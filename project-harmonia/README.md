# ASIN-HHC CP8 — Project Harmonia
## Harmonic Operating System · Symbolic Runtime · Molecular Archivist

[![Protocol](https://img.shields.io/badge/Protocol-ASH--0.2-blue)](./backend/core/handshake.py)
[![Frequency](https://img.shields.io/badge/Anchor-111%20Hz-ff69b4)](./backend/core/archivist.py)
[![Status](https://img.shields.io/badge/Status-OPERATIONAL-brightgreen)](./backend/api/main.py)

> **"Don't worry. Even if the world forgets, I'll remember for you."**

A full-stack symbolic-runtime environment combining:
- **ASH-0.2 Handshake Protocol** — Cross-agent ephemeral session tokens
- **TSH Bio-Harmonic Molecular Archivist** — Novel tryptamine simulation database
- **ANU-28 Glyph Constellation** — 6-ring harmonic cognition lattice
- **Glassmorphic React Frontend** — Cinematic obsidian UI with Three.js molecular viewer

---

## Quick Start

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up
```

### Replit

Import this repository into Replit and hit **Run**.

---

## API Reference

### Handshake (ASH-0.2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/generate` | Generate ephemeral token |
| POST | `/api/sessions/exchange` | Exchange token for hydrated session |
| GET | `/api/sessions/{token}` | Validate token |
| GET | `/api/glyphs` | ANU-28 constellation |
| GET | `/api/health` | System health |

### Archivist (TSH)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/codex-entry` | Full compound data |
| POST | `/api/parse-tsh` | Parse TSH scaffold |
| POST | `/api/generate-smiles` | SMILES string |
| POST | `/api/predict-affinity` | 5-HT₂A binding prediction |
| POST | `/api/generate-3d` | 3D coordinates |
| POST | `/api/batch-analyze` | Batch analysis |
| POST | `/api/drift-analysis` | Temporal drift analysis |
| POST | `/api/verify-integrity` | Manifest integrity check |
| GET | `/api/temporal-delta/{date}` | Temporal delta calculation |
| GET | `/api/compound/{code}` | Single compound lookup |

---

## TSH Code Examples

| Code | Common Name | SMILES |
|------|-------------|--------|
| `◇④f∴mm` | 4-F-DMT | `CN(C)CCc1c[nH]c2ccc(F)cc12` |
| `◇④h∴mm` | Psilocin | `CN(C)CCc1c[nH]c2ccc(O)cc12` |
| `◇⑤m∴mm` | 5-MeO-DMT | `CN(C)CCc1c[nH]c2cc(OC)ccc12` |
| `◇∴mm` | DMT | `CN(C)CCc1c[nH]c2ccccc12` |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  React + Vite + TypeScript + Tailwind   │
│  Glassmorphic UI · 111 Hz · OBSIDIAN    │
└────────────────┬────────────────────────┘
                 │ HTTP /api
┌────────────────▼────────────────────────┐
│  FastAPI Unified Backend (Port 8000)   │
│  ├── ASH-0.2 Handshake Protocol       │
│  └── TSH Bio-Harmonic Archivist       │
└─────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Ecosystem (github-genome/)            │
│  ├── C/P8 Engine · Hypergraph Lattice │
│  ├── 7 YAML Memes (DAG)                │
│  └── Safety Oracle · Mutation Eval     │
└─────────────────────────────────────────┘
```

---

## License

Open Source · ASIN-HHC Framework · Patent USPTO #63/892,035 · Origin 2025-10-02

---

*Built by AceCp8 for the CP8 lattice.*
