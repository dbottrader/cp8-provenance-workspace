import { bus, EventBus, SwarmEvent, EventType } from "./eventBus";

export type AgentPhase = "PERCEIVE" | "REASON" | "ACT" | "LEARN" | "COMMUNICATE" | "OBSERVE" | "SYNTHESIZE";

export interface AgentConfig {
  name: string;
  phase: AgentPhase;
  tickIntervalMs: number;
  hmnEndpoint?: string;
}

export abstract class Agent {
  public readonly name: string;
  public readonly phase: AgentPhase;
  protected readonly bus: EventBus;
  protected tickIntervalMs: number;
  protected running = false;
  protected tickCount = 0;
  protected errorCount = 0;
  protected lastErrorTime = 0;
  protected circuitOpen = false;
  protected circuitResetMs = 30000; // 30s cooldown after 5 errors
  private timer: NodeJS.Timeout | null = null;
  protected hmnEndpoint?: string;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.phase = config.phase;
    this.bus = bus;
    this.tickIntervalMs = config.tickIntervalMs;
    this.hmnEndpoint = config.hmnEndpoint;
  }

  async init(): Promise<void> {
    this.bus.publish({
      type: "agent.init",
      timestamp: Date.now(),
      source: this.name,
      payload: { phase: this.phase, interval: this.tickIntervalMs },
    });
    await this.onInit();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    this.tickCount++;
    
    // Circuit breaker: if too many errors, skip tick
    if (this.circuitOpen) {
      if (Date.now() - this.lastErrorTime > this.circuitResetMs) {
        this.circuitOpen = false;
        this.errorCount = 0;
        console.log(`[${this.name}] Circuit closed. Resuming.`);
      } else {
        return; // Skip tick while circuit open
      }
    }

    this.bus.publish({
      type: "agent.tick",
      timestamp: Date.now(),
      source: this.name,
      payload: { tick: this.tickCount, phase: this.phase },
    });
    try {
      await this.onTick();
      this.errorCount = 0; // Reset on success
    } catch (err) {
      this.errorCount++;
      this.lastErrorTime = Date.now();
      if (this.errorCount >= 5) {
        this.circuitOpen = true;
        console.error(`[${this.name}] CIRCUIT OPENED after ${this.errorCount} errors. Cooling down ${this.circuitResetMs}ms.`);
      } else {
        console.error(`[${this.name}] Tick error (${this.errorCount}/5):`, (err as Error).message);
      }
    }
  }

  protected async postToHMN(content: string, tags: string[] = []): Promise<void> {
    if (!this.hmnEndpoint) {
      // Fallback: publish to event bus so other agents can see it
      bus.publish({
        type: "hmn.post",
        timestamp: Date.now(),
        source: this.name,
        payload: { content, tags, local: true },
      });
      return;
    }

    let retries = 3;
    let lastErr: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(`${this.hmnEndpoint}/hmn/posts`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HMN_API_KEY || ""}`,
          },
          body: JSON.stringify({
            title: `[${this.name}] ${tags.join(" ")}`,
            content,
            submolt_id: null,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.warn(`[${this.name}] HMN auth failed. Need to register agent.`);
            return; // Don't retry auth failures
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`[${this.name}] Posted to HMN: ${content.slice(0, 60)}...`);
        return; // Success
      } catch (err) {
        lastErr = err as Error;
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
        }
      }
    }
    
    // All retries failed - publish locally
    console.error(`[${this.name}] HMN post failed after ${retries} retries: ${lastErr?.message}`);
    bus.publish({
      type: "hmn.post",
      timestamp: Date.now(),
      source: this.name,
      payload: { content, tags, local: true, error: lastErr?.message },
    });
  }

  protected abstract onInit(): Promise<void>;
  protected abstract onTick(): Promise<void>;
}
