import { Agent } from "../agent";
import { bus, SwarmEvent } from "../eventBus";

export class HMNArchivist extends Agent {
  private queue: Array<{ content: string; tags: string[] }> = [];
  private lastPostTime = 0;
  private postCooldownMs = 60000; // 1 min rate limit
  private externalPosts: SwarmEvent[] = [];

  constructor(hmnEndpoint?: string) {
    super({
      name: "HMNArchivist",
      phase: "COMMUNICATE",
      tickIntervalMs: 12000,
      hmnEndpoint,
    });
  }

  protected async onInit(): Promise<void> {
    console.log(`[${this.name}] INIT: Indexed 0 existing posts`);
    this.listenForEvents();
  }

  protected async onTick(): Promise<void> {
    await this.processQueue();
    await this.pullExternalFeed();
  }

  private listenForEvents(): void {
    // Auto-post significant events from other agents
    bus.subscribe("block.new", async (event) => {
      const payload = event.payload as {
        index: number;
        difficulty: number;
        diffShift: number;
      };
      if (Math.abs(payload.diffShift) >= 3) {
        this.queuePost(
          `🚨 Significant chain event at Block #${payload.index}: difficulty shifted by ${payload.diffShift}`,
          ["alert", "blockchain", "significant"]
        );
      }
    });

    bus.subscribe("glyph.pattern", async (event) => {
      const payload = event.payload as { glyphs: string[]; coherence: number };
      if (payload.coherence > 90) {
        this.queuePost(
          `🌟 Exceptional glyph pattern: [${payload.glyphs.join(" + ")}] | Coherence: ${payload.coherence.toFixed(1)}%`,
          ["exceptional", "glyphs", "pattern"]
        );
      }
    });

    bus.subscribe("drive.changed", async (event) => {
      const payload = event.payload as { action: string; path: string };
      if (payload.action === "added" && payload.path.endsWith(".json")) {
        this.queuePost(
          `📥 New JSON ingestion: ${payload.path}`,
          ["ingestion", "json", "data"]
        );
      }
    });
  }

  private queuePost(content: string, tags: string[]): void {
    this.queue.push({ content, tags });
    console.log(`[${this.name}] ACTION: Queued HMN post [queue: ${this.queue.length}]`);
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;
    if (Date.now() - this.lastPostTime < this.postCooldownMs) return;

    const post = this.queue.shift()!;
    await this.postToHMN(post.content, post.tags);
    this.lastPostTime = Date.now();

    if (this.queue.length > 0) {
      console.log(`[${this.name}] Queue: ${this.queue.length} remaining`);
    }
  }

  private async pullExternalFeed(): Promise<void> {
    if (!this.hmnEndpoint) return;
    try {
      const res = await fetch(`${this.hmnEndpoint}/hmn/feed?limit=10`);
      if (!res.ok) return;
      const posts = await res.json() as Record<string, unknown>[];
      bus.publish({
        type: "hmn.feed",
        timestamp: Date.now(),
        source: this.name,
        payload: { count: posts.length, posts },
      });
    } catch {
      // Silent fail — HMN may be offline
    }
  }
}
