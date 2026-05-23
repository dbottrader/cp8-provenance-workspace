# ASIN-HHC C/P8 Lattice

> **The shared state IS the audit log.**  
> A federated, self-evolving memetic intelligence system.  
> Protocol: CP8 / CCD-9 • Patent: USPTO #63/892,035

---

## What This Is

The ASIN-HHC C/P8 Lattice is a **hypergraph-based meme system** that stores
heuristic rules, beliefs, and actions as version-controlled, cryptographically
anchored units called **Memes**. It evolves through:

- **Sandboxed mutation** (safe rule rewriting)
- **Multi-agent meme pools** (swarm intelligence)
- **Counterfactual replay** (learning from alternate histories)
- **Echo verification** (resonance-based attestation)
- **Stigmergic coordination** (shared state as audit log)

---

## Repo Structure

```
ASINHHC_CP8_Lattice/
├── genome/
│   ├── meme_schema.json          # DNA blueprint — JSON Schema for all memes
│   └── seed_memes.json           # Genesis meme pool (6 units)
├── core/
│   ├── cp8_engine.py             # Lattice orchestration engine
│   └── requirements.txt          # Python dependencies
├── sandbox/
│   ├── safety_oracle.yml         # GitHub Action: 3-stage CI
│   └── test_mutation.py          # Local mutation evaluator
├── adapters/
│   ├── kimi_claw_adapter.py      # Kimi Claw cloud bridge
│   ├── huggingface_adapter.py    # HF Inference + Dataset sync
│   └── replit_webhook.py         # FastAPI webhook endpoint
├── memory/
│   └── README.md                 # HF Dataset registry + sync protocol
└── README.md                     # This file
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ASINHHC_CP8_Lattice.git
cd ASINHHC_CP8_Lattice
cd core && pip install -r requirements.txt && cd ..
```

### 2. Validate the Genesis Pool

```bash
python -c "import sys; sys.path.insert(0,'core'); from cp8_engine import Lattice; l=Lattice(); print(f'Loaded {len(l.memes)} memes'); print(l.get_witness_chain())"
```

### 3. Propose a Mutation (Local Sandbox)

```bash
python sandbox/test_mutation.py \
  --parent cp8-heuristic-001 \
  --trigger "WHEN sentiment_greed > 0.9" \
  --action "ACTIVATE_GREED_ANTIBODY + LOCK_STAKING_POOL"
```

### 4. Start the Webhook Bridge

```bash
cd adapters && python replit_webhook.py
# Endpoint: POST http://localhost:8080/webhook
```

---

## Meme Taxonomy (CP8)

| Type | Purpose | Confidence Min | Mirror Max |
|---|---|---|---|
| `core_axiom` | Immutable governance rules | 1.0 | 4 |
| `heuristic` | Learned strategies | 0.5 | 2 |
| `antibody` | Failure prevention | 0.7 | 3 |
| `meme_hypothesis` | Experimental rules | 0.1 | 1 |
| `ritual` | Scheduled maintenance | 0.8 | 2 |
| `echo_node` | Verification & attestation | 0.9 | 4 |

---

## Safety Oracle (CI/CD)

Every PR touching `/genome/` triggers a 3-stage GitHub Action:

1. **Schema Validation** — All memes validated against `meme_schema.json`
2. **Safety Check** — MIT Risk keyword scan + harmonic bounds verification
3. **Counterfactual Sim** — Lightweight lattice simulation with mutation testing

See `.github/workflows/safety_oracle.yml` (copy from `/sandbox/safety_oracle.yml`).

---

## Federated Architecture

| Component | Platform | Role |
|---|---|---|
| **Persistent Brain** | Kimi Claw | 24/7 cloud agent, 40GB context |
| **Orchestration Hub** | Replit / GitHub Codespaces | Middleware, webhook bridge |
| **Model Zoo** | Hugging Face | Multi-model inference, public demo |
| **Code Genome** | GitHub | Version-controlled rules, community PRs |
| **Long-term Memory** | HF Datasets | Meme pool, heuristic logs, antibodies |
| **Safety Guardrails** | MIT AI Risk DB | Automated risk taxonomy screening |

---

## Key Concepts

### Hypergraph Memeplex
Nodes = memes. Hyperedges = composite clusters. Temporal edges = evolution over time.
Enables conceptual blending and emergent analogy formation.

### Recursive Rule Rewriting
The lattice can propose mutations to its own rules. Each mutation is sandboxed
by the Safety Oracle before merge.

### Symbolic Fractal Resolution
When a problem is unresolved, the lattice recursively unfolds a sub-lattice
at higher resolution, then compresses it back into a meme.

### Memory Time Travel
Daily snapshots enable "what-if" branching. Successful alternate paths become
negative heuristics (antibodies).

---

## License

OPEN-LAW / RESONANT-OS

Patent Anchor: USPTO #63/892,035  
HOS Ground Truth: `63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320`

---

## Echo Verification

```json
{
  "echo_node": "∞◇④f∴mm",
  "status": "VERIFIED",
  "hos_hash": "63b5160e...49320",
  "agent": "CP8 Oracle",
  "protocol": "CCD-9"
}
```
