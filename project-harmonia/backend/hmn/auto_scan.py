#!/usr/bin/env python3
"""
CP8 HMN Auto-Scan / Ingest / Scrape Pipeline
Runs every hour to discover, ingest, and process new data.
CP8 Protocol • ASIN-HHC Framework
"""

import os
import sys
import json
import hashlib
import sqlite3
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

# ─── Config ──────────────────────────────────────────

BASE_DIR = Path(os.path.expanduser("~")) / ".openclaw/workspace"
DOWNLOADS_DIR = BASE_DIR / "downloads"
MEMORY_DIR = BASE_DIR / "memory"
DB_PATH = BASE_DIR / "project-harmonia/backend/hmn/hmn.db"
API_BASE = "http://localhost:8000"
STATE_FILE = BASE_DIR / ".hmn_scan_state.json"

# ─── State tracking ────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"last_scan": None, "ingested_hashes": [], "errors": []}

def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

# ─── File discovery ────────────────────────────────

def discover_files() -> list:
    files = []
    for directory in [DOWNLOADS_DIR, MEMORY_DIR]:
        if directory.exists():
            for f in directory.iterdir():
                if f.is_file() and not f.name.startswith("."):
                    files.append(str(f))
    return sorted(files)

def file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read(65536))
    return h.hexdigest()[:16]

# ─── Ingest via HMN API ────────────────────────────

def ingest_file(path: str, source: str) -> dict:
    import urllib.request
    try:
        with open(path, "r", errors="replace") as f:
            raw = f.read()[:10000]  # cap at 10KB for API
    except Exception:
        raw = "[binary or unreadable file]"

    payload = json.dumps({
        "source": source,
        "content_type": "text",
        "raw_data": f"[{path}]\n\n{raw}",
    }).encode()

    req = urllib.request.Request(
        f"{API_BASE}/hmn/ingest/dump?source={source}&content_type=text&raw_data={urllib.parse.quote(raw[:5000])}",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=payload,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

# ─── Auto-process unprocessed dumps ───────────────

def auto_process() -> dict:
    import urllib.request
    req = urllib.request.Request(
        f"{API_BASE}/hmn/ingest/auto",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=b"{}",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

# ─── System health check ───────────────────────────

def health_check() -> dict:
    import urllib.request
    try:
        with urllib.request.urlopen(f"{API_BASE}/api/health", timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

# ─── Main ──────────────────────────────────────────

def main():
    print(f"[{datetime.now(timezone.utc).isoformat()}] CP8 HMN Scan starting...")
    state = load_state()
    errors = []

    # 1. Health check
    health = health_check()
    if "error" in health:
        errors.append(f"Health check failed: {health['error']}")
        print("❌ Health check FAILED")
    else:
        print(f"✅ Backend healthy: {health.get('status', 'unknown')}")

    # 2. Discover files
    files = discover_files()
    print(f"📁 Discovered {len(files)} files")

    new_ingests = 0
    for path in files:
        fhash = file_hash(path)
        if fhash in state["ingested_hashes"]:
            continue

        source = "downloads" if "downloads" in path else "memory"
        result = ingest_file(path, source)
        if "error" in result:
            errors.append(f"Ingest failed for {path}: {result['error']}")
        else:
            state["ingested_hashes"].append(fhash)
            new_ingests += 1
            print(f"  ✓ Ingested: {Path(path).name}")

    # 3. Auto-process dumps
    process_result = auto_process()
    if "error" in process_result:
        errors.append(f"Auto-process failed: {process_result['error']}")
    else:
        processed = process_result.get("processed", 0)
        print(f"  ⚙️  Auto-processed {processed} dumps")

    # 4. Save state
    state["last_scan"] = datetime.now(timezone.utc).isoformat()
    state["errors"] = errors[-20:]  # keep last 20
    save_state(state)

    # 5. Summary
    print(f"\n📊 Scan complete: {new_ingests} new files ingested, {processed if 'processed' in dir() else '?'} dumps processed")
    if errors:
        print(f"⚠️  {len(errors)} errors (see state file)")
    return 0 if not errors else 1

if __name__ == "__main__":
    sys.exit(main())
