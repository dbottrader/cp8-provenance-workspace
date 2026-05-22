#!/usr/bin/env python3
"""
Replit Webhook Bridge for ASIN-HHC C/P8 Lattice
FastAPI endpoint to receive triggers from Kimi Claw.
"""

import json
import sys
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

sys.path.insert(0, str(Path(__file__).parent.parent / "core"))
from cp8_engine import Lattice

app = FastAPI(title="CP8 Lattice Webhook")
lattice = Lattice("genome/seed_memes.json")


@app.post("/webhook")
async def webhook(request: Request):
    """Main webhook endpoint for all CP8 triggers."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = payload.get("event_type")

    if event_type == "mutation_proposed":
        meme = payload.get("meme")
        if not meme:
            raise HTTPException(status_code=400, detail="Missing meme payload")
        errors = lattice.add_meme(meme)
        if errors:
            return JSONResponse({"status": "rejected", "errors": errors}, status_code=422)
        return {"status": "accepted", "meme_id": meme.get("id")}

    elif event_type == "echo_request":
        hos_hash = payload.get("hos_hash")
        if not hos_hash:
            raise HTTPException(status_code=400, detail="Missing hos_hash")
        witnesses = lattice.get_witness_chain()
        match = any(w["signature"] and hos_hash in w["signature"] for w in witnesses)
        return {
            "status": "verified" if match else "unverified",
            "hos_hash": hos_hash,
            "witness_count": len(witnesses),
        }

    elif event_type == "state_query":
        agent_id = payload.get("agent_id")
        return {
            "agent_id": agent_id,
            "meme_count": len(lattice.memes),
            "axiom_count": len(lattice.query_by_type("core_axiom")),
            "witness_chain": lattice.get_witness_chain(),
        }

    elif event_type == "harmonic_query":
        element = payload.get("element")
        quadrant = payload.get("quadrant")
        results = lattice.query_by_harmonic(element=element, quadrant=quadrant)
        return {
            "query": {"element": element, "quadrant": quadrant},
            "results": [m.to_dict() for m in results],
            "count": len(results),
        }

    else:
        return JSONResponse({"status": "unknown_event", "event_type": event_type}, status_code=400)


@app.get("/health")
async def health():
    return {"status": "ok", "memes_loaded": len(lattice.memes)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
