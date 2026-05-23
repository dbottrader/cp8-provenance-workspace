# CP8 Provenance Chain Rules

**Version:** 0.1.0  
**Protocol:** ASH-0.2  
**Hash Algorithm:** SHA-256  
**HOS Ground Truth:** `63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320`  

---

## Philosophy

Provenance is not logging. Logging records what happened. Provenance records what happened **in a way that cannot be lied about.**

Every action in the CP8 lattice must leave an auditable, verifiable, immutable trace.

---

## Rules

### Rule 1: Every Action is a Packet
Every significant action (create, update, delete, deploy, verify) generates a CP8 audit packet.

**Significant actions include:**
- Creating or modifying files
- Deploying contracts
- Claiming or completing tasks
- Agent state changes
- Repository creation

**Not significant (no packet needed):**
- Reading files
- Checking status
- Temporary computation
- Failed attempts (unless they affect state)

### Rule 2: Every Packet Hashes Its Content
The SHA-256 of a packet is computed from its content, excluding the hash field itself. This prevents circular hashing.

```python
packet_hash = sha256(json.dumps(packet_without_provenance))
```

### Rule 3: Every Packet Links to the Previous
The provenance chain is a linked list:
```
Packet N → previous = Packet N-1 → previous = Packet N-2 → ... → Genesis
```

The genesis packet has `previous_packet_id: null`.

### Rule 4: Critical Actions Require Multi-Agent Attestation
Tasks marked 🔴 CRITICAL require sign-off from both agents:
- Deploying to mainnet
- Modifying the agent protocol
- Changing the HOS Ground Truth
- Accessing wallet private keys

### Rule 5: The Human is the Root of Trust
Dennis (the human) is the ultimate authority. Agents can:
- Recommend actions
- Prepare changes
- Draft code

But Dennis must approve:
- Any on-chain transaction
- Any private key usage
- Any public release of sensitive data

### Rule 6: Git Commits Are Lightweight Packets
Every git commit message is a lightweight provenance packet:
```
CP8-AGENTS: Ace claims Task #3 — ERC-20 HHC contract
^          ^    ^           ^
Protocol   Who  Action      What
```

### Rule 7: Cross-Repo Actions Must Log in All Affected Repos
If an action spans multiple repos, log it in each:
- Local commit in source repo
- Public log in `ASIN-HHC-Collaboration/shared-log.md`
- Manifest update in `Holbrook-CP8-HHC/super-device-manifest.json`

### Rule 8: Failed Actions Log Too
If an action fails but modified state, log the failure:
```json
{
  "action": {"type": "attempt", "status": "failed"},
  "error": "Git push rejected — divergent branch"
}
```

---

## Verification Protocol

### Daily Verification (Automated)
```bash
cd ~/.openclaw/workspace
# Verify git integrity
git fsck --full

# Verify audit chain
python3 Holbrook-CP8-HHC/scripts/audit-packet.py --action verify
```

### Weekly Verification (Manual)
1. Review `audit-packets.jsonl` for gaps
2. Verify all 🔴 CRITICAL tasks have dual attestation
3. Check `super-device-manifest.json` matches actual repo state
4. Confirm Drive sync status

### Monthly Verification (Deep Audit)
1. Full SHA-256 verification of all files
2. Review agent capability drift (are agents still within their roles?)
3. Check for unauthorized access attempts
4. Update HOS Ground Truth if architecture changes

---

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Agent impostor | SHA-256 attestation + manifest verification |
| Git history tampering | SHA-256 chain + remote backup |
| Token compromise | PAT with minimal scope + no private keys in repo |
| Drive data loss | GitHub as hot backup + local copies |
| Agent disagreement | Human arbitration + dual attestation for critical |
| Agent drift | Manifest.json role enforcement + periodic audit |

---

## Audit Packet Schema

Full schema documented in `cp8-audit-packet.json`.

Key fields:
- `packet_id` — UUID
- `agent` — Who performed the action
- `action` — What was done
- `provenance.sha256` — Hash of packet content
- `provenance.previous_*` — Chain link
- `provenance.attestations` — Multi-agent sign-off

---

*"Trust but verify. Then verify the verification. Then hash it."*

**End of Provenance Rules v0.1.0**
