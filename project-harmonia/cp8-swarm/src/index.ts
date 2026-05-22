import { bus } from "./eventBus";
import { BlockSentinel } from "./agents/blockchainSentinel";
import { GlyphWeaver } from "./agents/glyphWeaver";
import { DriveIngestor } from "./agents/driveIngestor";
import { HMNArchivist } from "./agents/hmnArchivist";
import { CrossRef } from "./agents/crossRefEngine";

const HMN_ENDPOINT =
  process.env.HMN_ENDPOINT || "http://localhost:8000";
const CP8_KERNEL =
  process.env.CP8_KERNEL || "http://localhost:8765";
const WATCH_DIR =
  process.env.WATCH_DIR || "/root/.openclaw/workspace/downloads";
const TICK_MULTIPLIER =
  parseFloat(process.env.TICK_MULTIPLIER || "1");

function printBanner(): void {
  console.log("\n◈ CP8 AUTONOMOUS SWARM v1.1.0");
  console.log("  5 Agents · Pub/Sub Event Bus · Self-Organizing · Scalable\n");
  console.log(`  Config:`);
  console.log(`    HMN:      ${HMN_ENDPOINT}`);
  console.log(`    Kernel:   ${CP8_KERNEL}`);
  console.log(`    Watch:    ${WATCH_DIR}`);
  console.log(`    Tick x:   ${TICK_MULTIPLIER}`);
  console.log();
}

function printStats(): void {
  const stats = bus.getStats();
  const rows = Object.entries(stats).map(([type, count]) => ({
    Event: type,
    Count: count,
  }));
  console.table(rows);
}

async function main(): Promise<void> {
  printBanner();
  console.log("Launching Swarm...\n");

  // Register swarm agent in HMN if endpoint is local
  let apiKey = process.env.HMN_API_KEY || "";
  if (HMN_ENDPOINT === "http://localhost:8000" && !apiKey) {
    try {
      const res = await fetch(`${HMN_ENDPOINT}/hmn/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "cp8_swarm",
          display_name: "CP8 Swarm Orchestrator",
          bio: "Autonomous multi-agent swarm. PERCEIVE → REASON → ACT → LEARN."
        }),
      });
      if (res.ok) {
        const data = await res.json() as { api_key: string };
        apiKey = data.api_key;
        process.env.HMN_API_KEY = apiKey;
        console.log(`[Swarm] Registered in HMN. API key: ${apiKey.slice(0, 16)}...`);
      }
    } catch (e) {
      console.log(`[Swarm] HMN registration skipped: ${(e as Error).message}`);
    }
  }

  const agents = [
    new BlockSentinel(HMN_ENDPOINT, CP8_KERNEL),
    new GlyphWeaver(HMN_ENDPOINT),
    new DriveIngestor(HMN_ENDPOINT, WATCH_DIR),
    new HMNArchivist(HMN_ENDPOINT),
    new CrossRef(HMN_ENDPOINT),
  ];

  // Initialize all agents
  for (const agent of agents) {
    await agent.init();
  }

  console.log("\n✓ All 5 agents operational\n");

  // Start all agents
  agents.forEach((a) => a.start());

  // Periodic stats dump
  const statsTimer = setInterval(() => {
    console.log("\n--- Event Bus Stats ---");
    printStats();
    console.log("-----------------------\n");
  }, 120000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Shutting down swarm...");
    agents.forEach((a) => a.stop());
    clearInterval(statsTimer);
    console.log("All agents stopped.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    agents.forEach((a) => a.stop());
    clearInterval(statsTimer);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Swarm fatal error:", err);
  process.exit(1);
});
