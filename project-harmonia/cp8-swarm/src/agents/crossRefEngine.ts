import { Agent } from "../agent";
import { bus, SwarmEvent } from "../eventBus";

interface DomainEvents {
  domain: string;
  events: SwarmEvent[];
  lastActivity: number;
}

export class CrossRef extends Agent {
  private domains: Map<string, DomainEvents> = new Map();
  private insights: Array<{
    timestamp: number;
    description: string;
    confidence: number;
    domains: string[];
  }> = [];

  constructor(hmnEndpoint?: string) {
    super({
      name: "CrossRef",
      phase: "SYNTHESIZE",
      tickIntervalMs: 25000,
      hmnEndpoint,
    });
  }

  protected async onInit(): Promise<void> {
    console.log(`[${this.name}] INIT: Cross-reference engine ready`);
    this.listenForAllEvents();
  }

  protected async onTick(): Promise<void> {
    this.correlate();
  }

  private listenForAllEvents(): void {
    const types = [
      "block.new",
      "glyph.pattern",
      "drive.changed",
      "hmn.post",
      "agent.task",
    ] as const;

    types.forEach((type) => {
      bus.subscribe(type, (event) => {
        const domain = this.typeToDomain(type);
        if (!this.domains.has(domain)) {
          this.domains.set(domain, { domain, events: [], lastActivity: 0 });
        }
        const d = this.domains.get(domain)!;
        d.events.push(event);
        if (d.events.length > 100) d.events.shift();
        d.lastActivity = Date.now();
      });
    });
  }

  private typeToDomain(type: string): string {
    if (type.startsWith("block")) return "blockchain";
    if (type.startsWith("glyph")) return "glyphs";
    if (type.startsWith("drive")) return "filesystem";
    if (type.startsWith("hmn")) return "social";
    if (type.startsWith("agent")) return "swarm";
    return "other";
  }

  private correlate(): void {
    const activeDomains = Array.from(this.domains.values()).filter(
      (d) => Date.now() - d.lastActivity < 60000
    );

    if (activeDomains.length >= 3) {
      const confidence = Math.min(95, 60 + activeDomains.length * 10);
      const insight = {
        timestamp: Date.now(),
        description: `Unified Swarm Activity: ${activeDomains.length} domains active`,
        confidence,
        domains: activeDomains.map((d) => d.domain),
      };

      // Avoid duplicate insights
      const last = this.insights[this.insights.length - 1];
      if (!last || last.description !== insight.description) {
        this.insights.push(insight);
        bus.publish({
          type: "crossref.insight",
          timestamp: Date.now(),
          source: this.name,
          payload: insight,
        });
        console.log(
          `[${this.name}] INSIGHT: ${insight.description} | Confidence: ${insight.confidence}%`
        );

        if (insight.confidence >= 80) {
          this.postToHMN(
            `🔗 CrossRef insight: ${insight.description} | Confidence: ${insight.confidence}% | Domains: ${insight.domains.join(", ")}`,
            ["crossref", "insight", "swarm"]
          );
        }
      }
    }

    // Look for temporal correlations (events within 5s of each other across domains)
    this.findTemporalPatterns(activeDomains);
  }

  private findTemporalPatterns(domains: DomainEvents[]): void {
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const d1 = domains[i];
        const d2 = domains[j];
        const pairs = this.findNearSimultaneous(d1.events, d2.events, 5000);
        if (pairs.length > 0) {
          console.log(
            `[${this.name}] Temporal link: ${d1.domain} ↔ ${d2.domain} — ${pairs.length} near-simultaneous events`
          );
        }
      }
    }
  }

  private findNearSimultaneous(
    a: SwarmEvent[],
    b: SwarmEvent[],
    windowMs: number
  ): Array<[SwarmEvent, SwarmEvent]> {
    const pairs: Array<[SwarmEvent, SwarmEvent]> = [];
    for (const evA of a.slice(-20)) {
      for (const evB of b.slice(-20)) {
        if (Math.abs(evA.timestamp - evB.timestamp) <= windowMs) {
          pairs.push([evA, evB]);
        }
      }
    }
    return pairs;
  }
}
