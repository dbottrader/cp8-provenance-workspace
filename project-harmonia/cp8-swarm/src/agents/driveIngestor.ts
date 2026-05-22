import { Agent } from "../agent";
import { bus } from "../eventBus";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface FileSnapshot {
  path: string;
  hash: string;
  size: number;
  mtime: number;
}

export class DriveIngestor extends Agent {
  private watchDir: string;
  private snapshot: Map<string, FileSnapshot> = new Map();

  constructor(
    hmnEndpoint?: string,
    watchDir = "/root/.openclaw/workspace/downloads"
  ) {
    super({
      name: "DriveIngestor",
      phase: "OBSERVE",
      tickIntervalMs: 30000,
      hmnEndpoint,
    });
    this.watchDir = watchDir;
  }

  protected async onInit(): Promise<void> {
    console.log(`[${this.name}] INIT: Watching: ${this.watchDir}`);
    this.snapshot = await this.scanDirectory();
    console.log(`[${this.name}] Indexed ${this.snapshot.size} files`);
  }

  protected async onTick(): Promise<void> {
    const current = await this.scanDirectory();
    const changes = this.detectChanges(current);

    for (const change of changes) {
      bus.publish({
        type: "drive.changed",
        timestamp: Date.now(),
        source: this.name,
        payload: change,
      });
      console.log(
        `[${this.name}] ACTION: ${change.action}: ${change.path} (${change.size}B)`
      );
    }

    if (changes.length > 0) {
      await this.postToHMN(
        `📁 Drive scan: ${changes.length} file(s) changed in ${this.watchDir}`,
        ["filesystem", "ingestion", "drive"]
      );
    }

    this.snapshot = current;
  }

  private async scanDirectory(): Promise<Map<string, FileSnapshot>> {
    const result = new Map<string, FileSnapshot>();
    if (!fs.existsSync(this.watchDir)) return result;

    const entries = fs.readdirSync(this.watchDir, { recursive: true }) as string[];
    for (const entry of entries) {
      const fullPath = path.join(this.watchDir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        const hash = this.fileHash(fullPath);
        result.set(fullPath, {
          path: fullPath,
          hash,
          size: stat.size,
          mtime: stat.mtimeMs,
        });
      }
    }
    return result;
  }

  private fileHash(filePath: string): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(data).digest("hex");
  }

  private detectChanges(
    current: Map<string, FileSnapshot>
  ): Array<{
    action: "added" | "modified" | "removed";
    path: string;
    size: number;
    hash?: string;
  }> {
    const changes: ReturnType<typeof this.detectChanges> = [];

    // Added or modified
    for (const [p, snap] of current) {
      const old = this.snapshot.get(p);
      if (!old) {
        changes.push({ action: "added", path: p, size: snap.size, hash: snap.hash });
      } else if (old.hash !== snap.hash) {
        changes.push({
          action: "modified",
          path: p,
          size: snap.size,
          hash: snap.hash,
        });
      }
    }

    // Removed
    for (const [p, snap] of this.snapshot) {
      if (!current.has(p)) {
        changes.push({ action: "removed", path: p, size: snap.size });
      }
    }

    return changes;
  }
}
