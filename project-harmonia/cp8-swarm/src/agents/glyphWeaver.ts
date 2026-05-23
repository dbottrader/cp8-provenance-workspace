import { Agent } from "../agent";
import { bus } from "../eventBus";

const GLYPHS = [
  "ANU", "CP8", "SEQ", "KUR", "TSH", "SYNC", "DIV",
  "ASH", "HOS", "LUN", "SOL", "TET", "HEX", "OCT",
  "NOV", "DEC", "ACE",
];

export class GlyphWeaver extends Agent {
  private comboHistory: Array<{ glyphs: string[]; coherence: number }> = [];

  constructor(hmnEndpoint?: string) {
    super({
      name: "GlyphWeaver",
      phase: "REASON",
      tickIntervalMs: 20000,
      hmnEndpoint,
    });
  }

  protected async onInit(): Promise<void> {
    console.log(`[${this.name}] INIT: ${GLYPHS.length} glyphs loaded for pattern weaving`);
  }

  protected async onTick(): Promise<void> {
    const comboSize = 2 + Math.floor(Math.random() * 3); // 2-4 glyphs
    const glyphs = this.randomCombo(comboSize);
    const coherence = this.calculateCoherence(glyphs);

    this.comboHistory.push({ glyphs, coherence });
    if (this.comboHistory.length > 50) this.comboHistory.shift();

    bus.publish({
      type: "glyph.pattern",
      timestamp: Date.now(),
      source: this.name,
      payload: { glyphs, coherence, tick: this.tickCount },
    });

    console.log(
      `[${this.name}] Combo tested: [${glyphs.join(" + ")}] | Coherence: ${coherence.toFixed(1)}%`
    );

    if (coherence > 85) {
      await this.postToHMN(
        `✨ High-coherence pattern discovered: [${glyphs.join(" + ")}] | Coherence: ${coherence.toFixed(1)}%`,
        ["glyphs", "pattern", "high-coherence"]
      );
    }
  }

  private randomCombo(size: number): string[] {
    const shuffled = [...GLYPHS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }

  private calculateCoherence(glyphs: string[]): number {
    // Harmonic coherence based on glyph index sums and prime resonance
    const indices = glyphs.map((g) => GLYPHS.indexOf(g) + 1);
    const sum = indices.reduce((a, b) => a + b, 0);
    const product = indices.reduce((a, b) => a * b, 1);

    // 428 Hz and 528 Hz resonance factors
    const resonance428 = 1 - Math.abs((sum % 428) - 214) / 214;
    const resonance528 = 1 - Math.abs((product % 528) - 264) / 264;

    const coherence = (resonance428 * 0.5 + resonance528 * 0.5) * 100;
    return Math.min(100, Math.max(0, coherence));
  }
}
