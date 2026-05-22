#!/usr/bin/env python3
"""
Local sandbox evaluator for proposed meme mutations.
Run before committing: python sandbox/test_mutation.py
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "core"))
from cp8_engine import Lattice, MemeUnit, MemeRule, MemeMeta, CP8Harmonic


def evaluate_proposal(parent_id: str, new_trigger: str, new_action: str) -> dict:
    lattice = Lattice("genome/seed_memes.json")

    child = lattice.mutate_meme(parent_id, new_trigger, new_action)
    if not child:
        return {"status": "REJECTED", "reason": "Parent not found"}

    errors = lattice.add_meme(child)
    if errors:
        return {"status": "REJECTED", "reason": errors}

    # Simulate outcomes
    scenarios = [
        {"name": "bull_market", "outcome": True},
        {"name": "bear_market", "outcome": False},
        {"name": "black_swan", "outcome": False},
    ]

    for sc in scenarios:
        lattice.evaluate_success(child.id, outcome=sc["outcome"])

    final = lattice.memes[child.id]

    return {
        "status": "ACCEPTED",
        "meme_id": child.id,
        "lineage_signature": child.lineage_signature,
        "final_success_rate": final.meta.success_rate,
        "harmonic": final.cp8_harmonic.to_dict() if final.cp8_harmonic else None,
        "scenarios_tested": len(scenarios),
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="CP8 Mutation Sandbox")
    parser.add_argument("--parent", required=True, help="Parent meme ID")
    parser.add_argument("--trigger", required=True, help="New trigger condition")
    parser.add_argument("--action", required=True, help="New action response")
    args = parser.parse_args()

    result = evaluate_proposal(args.parent, args.trigger, args.action)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "ACCEPTED" else 1)
