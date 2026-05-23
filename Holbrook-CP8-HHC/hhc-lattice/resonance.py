#!/usr/bin/env python3
"""
CP8 Resonance Engine
Computes SHA-256 harmonic resonance between glyphs, agents, and packets.
CP8 Protocol • ASIN-HHC Framework • Holbrook Distributed Lattice
"""

import hashlib
import json
from datetime import datetime, timezone

def sha256(data):
    """Compute SHA-256 hex digest of string or bytes."""
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()

def glyph_resonance(glyph_id, frequency_hz, agent_id, timestamp=None):
    """
    Compute harmonic resonance signature for a glyph-agent interaction.
    
    The resonance is the SHA-256 of:
    glyph_id + frequency_hz + agent_id + timestamp + HOS_GROUND_TRUTH
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    HOS_GROUND_TRUTH = "63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320"
    
    canonical = f"{glyph_id}:{frequency_hz}:{agent_id}:{timestamp}:{HOS_GROUND_TRUTH}"
    return sha256(canonical)

def packet_integrity(packet):
    """
    Compute the provenance SHA-256 of an audit packet.
    Excludes the existing sha256 field to prevent circular hashing.
    """
    packet_copy = {k: v for k, v in packet.items() if k != "provenance"}
    canonical = json.dumps(packet_copy, sort_keys=True, separators=(',', ':'))
    return sha256(canonical)

def verify_chain(packets):
    """
    Verify a chain of audit packets.
    Returns (valid: bool, errors: list).
    """
    errors = []
    for i, packet in enumerate(packets):
        # Verify packet hash
        computed = packet_integrity(packet)
        stored = packet.get("provenance", {}).get("sha256", "")
        if computed != stored:
            errors.append(f"Packet {i}: hash mismatch (computed {computed[:16]}... vs stored {stored[:16]}...)")
        
        # Verify chain link
        if i > 0:
            prev = packets[i-1]
            prev_id = prev.get("packet_id", "")
            prev_hash = prev.get("provenance", {}).get("sha256", "")
            
            if packet.get("provenance", {}).get("previous_packet_id") != prev_id:
                errors.append(f"Packet {i}: previous_packet_id mismatch")
            if packet.get("provenance", {}).get("previous_sha256") != prev_hash:
                errors.append(f"Packet {i}: previous_sha256 mismatch")
    
    return len(errors) == 0, errors

def attestation_hash(agent_id, packet_id, action, timestamp=None):
    """Compute an attestation signature for multi-agent signoff."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    canonical = f"{agent_id}:{packet_id}:{action}:{timestamp}"
    return sha256(canonical)

if __name__ == "__main__":
    # Example: Compute resonance for Charge glyph + AceCp8
    resonance = glyph_resonance("anu-01", 528, "kimi-cp8")
    print(f"Charge (528Hz) + AceCp8 resonance: {resonance}")
    
    # Example: Compute attestation
    attestation = attestation_hash("holbrook-grok", "task-003-001", "completed_solidity")
    print(f"Grok attestation: {attestation}")
    
    print("Resonance engine operational.")
