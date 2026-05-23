#!/usr/bin/env python3
"""
CP8 Audit Packet Engine
Generates, verifies, and chains CP8 audit packets.
CP8 Protocol • ASIN-HHC Framework • Holbrook Distributed Lattice
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from hhc-lattice.resonance import sha256, packet_integrity, verify_chain, attestation_hash

# ─── Config ──────────────────────────────────────────

HOS_GROUND_TRUTH = "63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320"
PACKET_LOG = Path(__file__).parent.parent / "audit-packets.jsonl"

# ─── Engine ──────────────────────────────────────────

class AuditEngine:
    def __init__(self, agent_id, agent_name, model):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.model = model
        self.packets = []
        self._load_existing()
    
    def _load_existing(self):
        """Load existing packets from jsonl file."""
        if PACKET_LOG.exists():
            with open(PACKET_LOG, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        self.packets.append(json.loads(line))
    
    def create_packet(self, action_type, target, description, attestations=None):
        """Create a new audit packet and append to chain."""
        packet_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Build packet
        packet = {
            "schema_version": "CP8-0.1",
            "packet_type": "audit",
            "packet_id": packet_id,
            "timestamp": timestamp,
            "agent": {
                "id": self.agent_id,
                "name": self.agent_name,
                "model": self.model
            },
            "action": {
                "type": action_type,
                "target": target,
                "description": description
            },
            "provenance": {
                "sha256": "",  # Will be computed
                "previous_packet_id": None,
                "previous_sha256": None,
                "attestations": attestations or []
            },
            "metadata": {
                "harmonyos_mapped": True,
                "hhc_enabled": True,
                "agents": ["grok", "kimi"],
                "hos_ground_truth": HOS_GROUND_TRUTH
            }
        }
        
        # Link to previous packet
        if self.packets:
            prev = self.packets[-1]
            packet["provenance"]["previous_packet_id"] = prev["packet_id"]
            packet["provenance"]["previous_sha256"] = prev["provenance"]["sha256"]
        
        # Compute hash
        packet["provenance"]["sha256"] = packet_integrity(packet)
        
        # Store
        self.packets.append(packet)
        self._save_packet(packet)
        
        return packet
    
    def _save_packet(self, packet):
        """Append packet to jsonl log."""
        with open(PACKET_LOG, 'a') as f:
            f.write(json.dumps(packet, separators=(',', ':')) + '\n')
    
    def add_attestation(self, packet_id, attesting_agent, attestation_sig):
        """Add an attestation to an existing packet."""
        for packet in self.packets:
            if packet["packet_id"] == packet_id:
                packet["provenance"]["attestations"].append({
                    "agent_id": attesting_agent,
                    "signature": attestation_sig,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                # Re-hash after attestation
                packet["provenance"]["sha256"] = packet_integrity(packet)
                return True
        return False
    
    def verify(self):
        """Verify entire packet chain."""
        return verify_chain(self.packets)
    
    def stats(self):
        """Return audit statistics."""
        valid, errors = self.verify()
        return {
            "total_packets": len(self.packets),
            "chain_valid": valid,
            "errors": errors,
            "last_packet": self.packets[-1]["packet_id"] if self.packets else None,
            "last_timestamp": self.packets[-1]["timestamp"] if self.packets else None
        }

# ─── CLI ─────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="CP8 Audit Engine")
    parser.add_argument("--agent-id", default="holbrook-engine")
    parser.add_argument("--agent-name", default="Holbrook Engine")
    parser.add_argument("--model", default="system")
    parser.add_argument("action", choices=["create", "verify", "stats"])
    parser.add_argument("--type", help="Action type for create")
    parser.add_argument("--target", help="Target for create")
    parser.add_argument("--description", help="Description for create")
    
    args = parser.parse_args()
    
    engine = AuditEngine(args.agent_id, args.agent_name, args.model)
    
    if args.action == "create":
        packet = engine.create_packet(args.type, args.target, args.description)
        print(json.dumps(packet, indent=2))
    elif args.action == "verify":
        valid, errors = engine.verify()
        print(f"Chain valid: {valid}")
        if errors:
            for e in errors:
                print(f"  ERROR: {e}")
    elif args.action == "stats":
        print(json.dumps(engine.stats(), indent=2))
