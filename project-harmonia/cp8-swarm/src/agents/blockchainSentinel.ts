import { Agent } from "../agent";
import { bus } from "../eventBus";

interface BlockInfo {
  index: number;
  hash: string;
  difficulty: number;
  timestamp: number;
}

export class BlockSentinel extends Agent {
  private lastBlock: BlockInfo | null = null;
  private difficultyHistory: number[] = [];
  private cp8Endpoint: string;

  constructor(hmnEndpoint?: string, cp8Endpoint = "http://localhost:8765") {
    super({
      name: "BlockSentinel",
      phase: "PERCEIVE",
      tickIntervalMs: 15000,
      hmnEndpoint,
    });
    this.cp8Endpoint = cp8Endpoint;
  }

  protected async onInit(): Promise<void> {
    console.log(`[${this.name}] INIT: Connected to CP8 Kernel at ${this.cp8Endpoint}`);
    await this.checkChain();
  }

  protected async onTick(): Promise<void> {
    await this.checkChain();
  }

  private async checkChain(): Promise<void> {
    try {
      const res = await fetch(`${this.cp8Endpoint}/chain`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const chain = await res.json() as BlockInfo[];
      const latest = chain[chain.length - 1] as BlockInfo;

      if (!this.lastBlock) {
        this.lastBlock = latest;
        this.difficultyHistory.push(latest.difficulty);
        return;
      }

      if (latest.hash !== this.lastBlock.hash) {
        this.difficultyHistory.push(latest.difficulty);
        if (this.difficultyHistory.length > 20) this.difficultyHistory.shift();

        const avgDiff =
          this.difficultyHistory.reduce((a, b) => a + b, 0) /
          this.difficultyHistory.length;
        const diffShift = latest.difficulty - this.lastBlock.difficulty;

        bus.publish({
          type: "block.new",
          timestamp: Date.now(),
          source: this.name,
          payload: {
            index: latest.index,
            hash: latest.hash,
            difficulty: latest.difficulty,
            diffShift,
            avgDifficulty: avgDiff,
          },
        });

        if (Math.abs(diffShift) >= 2) {
          await this.postToHMN(
            `⛏️ CP8 Chain update: Block #${latest.index} | Difficulty: ${latest.difficulty} (shift: ${diffShift > 0 ? "+" : ""}${diffShift})`,
            ["blockchain", "cp8", "sentinel"]
          );
        }

        this.lastBlock = latest;
      }
    } catch (err) {
      bus.publish({
        type: "block.invalid",
        timestamp: Date.now(),
        source: this.name,
        payload: { error: (err as Error).message },
      });
    }
  }
}
