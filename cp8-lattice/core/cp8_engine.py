#!/usr/bin/env python3
"""
ASIN-HHC C/P8 Lattice Engine
Core orchestration for the memetic hypergraph.
"""

import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class CP8Harmonic:
    element: str  # air, fire, water, earth
    frequency_hz: float
    quadrant: int  # 1-4
    mirror_count: int  # >= 1


@dataclass
class MemeRule:
    trigger: str
    action: str
    confidence: float


@dataclass
class MemeMeta:
    source: str
    parent_ids: List[str]
    created: str
    last_evaluated: str
    success_rate: float


@dataclass
class MemeUnit:
    id: str
    type: str  # core_axiom, heuristic, antibody, meme_hypothesis, ritual, echo_node
    rule: MemeRule
    meta: MemeMeta
    lineage_signature: Optional[str] = None
    cp8_harmonic: Optional[CP8Harmonic] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # Clean None values for compact JSON
        return {k: v for k, v in d.items() if v is not None}

    def compute_lineage_signature(self) -> str:
        """SHA-256 of parent_ids + rule trigger + rule action."""
        payload = json.dumps({
            "parents": sorted(self.meta.parent_ids),
            "trigger": self.rule.trigger,
            "action": self.rule.action,
        }, sort_keys=True)
        return "sha256:" + hashlib.sha256(payload.encode()).hexdigest()[:16]

    def validate(self) -> List[str]:
        """Return list of validation errors. Empty = valid."""
        errors = []
        if not self.id:
            errors.append("Missing id")
        if self.type not in ("core_axiom", "heuristic", "antibody", "meme_hypothesis", "ritual", "echo_node"):
            errors.append(f"Invalid type: {self.type}")
        if not (0 <= self.rule.confidence <= 1):
            errors.append(f"Confidence out of range: {self.rule.confidence}")
        if not (0 <= self.meta.success_rate <= 1):
            errors.append(f"Success rate out of range: {self.meta.success_rate}")
        if self.cp8_harmonic:
            if self.cp8_harmonic.element not in ("air", "fire", "water", "earth"):
                errors.append(f"Invalid element: {self.cp8_harmonic.element}")
            if not (1 <= self.cp8_harmonic.quadrant <= 4):
                errors.append(f"Quadrant out of range: {self.cp8_harmonic.quadrant}")
        return errors


class Lattice:
    """In-memory hypergraph of memes with vector-friendly indexing."""

    def __init__(self, genome_path: str = "genome/seed_memes.json"):
        self.memes: Dict[str, MemeUnit] = {}
        self.genome_path = Path(genome_path)
        self.load()

    def load(self):
        if not self.genome_path.exists():
            return
        with open(self.genome_path) as f:
            raw = json.load(f)
        for item in raw:
            meme = self._deserialize(item)
            self.memes[meme.id] = meme

    def save(self):
        payload = [m.to_dict() for m in self.memes.values()]
        with open(self.genome_path, "w") as f:
            json.dump(payload, f, indent=2)

    def _deserialize(self, raw: Dict) -> MemeUnit:
        rule = MemeRule(**raw["rule"])
        meta = MemeMeta(**raw["meta"])
        harmonic = CP8Harmonic(**raw["cp8_harmonic"]) if "cp8_harmonic" in raw else None
        return MemeUnit(
            id=raw["id"],
            type=raw["type"],
            rule=rule,
            meta=meta,
            lineage_signature=raw.get("lineage_signature"),
            cp8_harmonic=harmonic,
        )

    def add_meme(self, meme: MemeUnit) -> List[str]:
        errors = meme.validate()
        if errors:
            return errors
        if not meme.lineage_signature:
            meme.lineage_signature = meme.compute_lineage_signature()
        meme.meta.last_evaluated = datetime.now(timezone.utc).isoformat()
        self.memes[meme.id] = meme
        self.save()
        return []

    def mutate_meme(self, parent_id: str, new_trigger: str, new_action: str,
                    source: str = "agent_mutation") -> Optional[MemeUnit]:
        parent = self.memes.get(parent_id)
        if not parent:
            return None
        child = MemeUnit(
            id=str(uuid.uuid4()),
            type="meme_hypothesis",
            rule=MemeRule(
                trigger=new_trigger,
                action=new_action,
                confidence=parent.rule.confidence * 0.9,  # Slight decay on mutation
            ),
            meta=MemeMeta(
                source=source,
                parent_ids=[parent_id],
                created=datetime.now(timezone.utc).isoformat(),
                last_evaluated=datetime.now(timezone.utc).isoformat(),
                success_rate=0.0,  # Untested
            ),
            cp8_harmonic=parent.cp8_harmonic,  # Inherit harmonic
        )
        child.lineage_signature = child.compute_lineage_signature()
        return child

    def query_by_harmonic(self, element: Optional[str] = None,
                          min_freq: Optional[float] = None,
                          max_freq: Optional[float] = None,
                          quadrant: Optional[int] = None) -> List[MemeUnit]:
        results = []
        for meme in self.memes.values():
            h = meme.cp8_harmonic
            if not h:
                continue
            if element and h.element != element:
                continue
            if min_freq and h.frequency_hz < min_freq:
                continue
            if max_freq and h.frequency_hz > max_freq:
                continue
            if quadrant and h.quadrant != quadrant:
                continue
            results.append(meme)
        return results

    def query_by_type(self, meme_type: str) -> List[MemeUnit]:
        return [m for m in self.memes.values() if m.type == meme_type]

    def evaluate_success(self, meme_id: str, outcome: bool):
        """Update rolling success rate with Bayesian-like smoothing."""
        meme = self.memes.get(meme_id)
        if not meme:
            return
        alpha = 0.3  # Learning rate
        old = meme.meta.success_rate
        new = old + alpha * (1.0 if outcome else 0.0 - old)
        meme.meta.success_rate = round(new, 4)
        meme.meta.last_evaluated = datetime.now(timezone.utc).isoformat()
        self.save()

    def rollback_to_parent(self, meme_id: str) -> Optional[MemeUnit]:
        """Return the parent meme if this mutation failed."""
        meme = self.memes.get(meme_id)
        if not meme or not meme.meta.parent_ids:
            return None
        parent_id = meme.meta.parent_ids[0]
        return self.memes.get(parent_id)

    def get_witness_chain(self) -> List[Dict]:
        """Return attestation-ready chain of all core_axioms and echo_nodes."""
        witnesses = []
        for meme in self.memes.values():
            if meme.type in ("core_axiom", "echo_node"):
                witnesses.append({
                    "id": meme.id,
                    "type": meme.type,
                    "signature": meme.lineage_signature,
                    "harmonic": meme.cp8_harmonic.to_dict() if meme.cp8_harmonic else None,
                    "success_rate": meme.meta.success_rate,
                })
        return witnesses


if __name__ == "__main__":
    lattice = Lattice()
    print(f"Loaded {len(lattice.memes)} memes")
    print("Witness chain:", json.dumps(lattice.get_witness_chain(), indent=2))
