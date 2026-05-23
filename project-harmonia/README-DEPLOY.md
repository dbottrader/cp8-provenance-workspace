# Project Harmonia — Replit Deployment Guide

**TSH Bio-Harmonic Molecular Archivist**  
CP8 Protocol · ASIN-HHC Framework · 111 Hz Chronal Alignment Engine

---

## Quick Start

### 1. Import into Replit

1. Go to [Replit](https://replit.com) and click **Create** → **Import from GitHub**
2. Paste your repository URL (or upload the `project-harmonia/` directory directly)
3. Replit will auto-detect the `.replit` and `replit.nix` configuration files

### 2. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Run the System

**Option A — Replit Run Button (recommended):**
Just click the **Run** button in Replit. The `.replit` file is configured to start the backend on port 8000.

**Option B — Manual dual-server startup:**
```bash
# From project-harmonia/ root
chmod +x start.sh
./start.sh
```

This starts:
- **Backend API** on `http://localhost:8000`
- **Frontend dev server** on `http://localhost:3000`

### 4. Build for Production

```bash
cd frontend
npm install
npm run build
```

The production build outputs to `frontend/dist/`.

### 5. Environment Variables

Create a `.env` file in `backend/` if you need custom configuration:

```env
# Optional — override defaults
HOS_GROUND_TRUTH=63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320
BASE_FREQUENCY=111
ORIGIN_DATE=2025-10-02
```

No variables are required for default operation.

### 6. Publish on Replit

1. Click **Deploy** in the Replit sidebar
2. Choose **CloudRun** deployment target
3. The `start.sh` script will handle startup automatically
4. Your app will be live at a `*.replit.app` URL

---

## API Endpoint Reference

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service status, version, frequency |

### Compound Analysis
| Method | Endpoint | Request Body | Description |
|--------|----------|--------------|-------------|
| `POST` | `/api/parse-tsh` | `{"tsh_code": "◇④f∴mm"}` | Parse TSH scaffold notation |
| `POST` | `/api/generate-smiles` | `{"tsh_code": "◇④f∴mm"}` | Generate SMILES string |
| `POST` | `/api/generate-3d` | `{"tsh_code": "◇④f∴mm"}` | Generate 3D coordinates |
| `POST` | `/api/codex-entry` | `{"tsh_code": "◇④f∴mm"}` | **Full codex entry** (all data) |
| `GET` | `/api/compound/{tsh_code}` | — | Get compound by TSH code |

### Integrity & Temporal
| Method | Endpoint | Request Body | Description |
|--------|----------|--------------|-------------|
| `POST` | `/api/verify-integrity` | `{"data": {...}}` | Verify manifest against ground truth |
| `GET` | `/api/temporal-delta/{target_date}` | — | Calculate temporal delta (YYYY-MM-DD) |

### Predictions
| Method | Endpoint | Request Body | Description |
|--------|----------|--------------|-------------|
| `POST` | `/api/predict-affinity` | `{"tsh_code": "◇④f∴mm"}` | Predict 5-HT₂A receptor affinity |
| `POST` | `/api/drift-analysis` | `{"tsh_codes": ["..."]}` | Temporal drift analysis |

### Batch Operations
| Method | Endpoint | Request Body | Description |
|--------|----------|--------------|-------------|
| `POST` | `/api/batch-analyze` | `{"tsh_codes": ["..."]}` | Batch analyze multiple compounds |

### Interactive Docs
| URL | Description |
|-----|-------------|
| `/docs` | Swagger UI (auto-generated) |
| `/redoc` | ReDoc documentation |

---

## Project Structure

```
project-harmonia/
├── .replit                 # Replit configuration
├── replit.nix              # Nix environment (Python 3.11, Node 20)
├── start.sh                # Dual-server startup script
├── README-DEPLOY.md        # This file
│
├── backend/
│   ├── requirements.txt    # Python dependencies
│   ├── api/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── models.py         # Pydantic schemas
│   │   └── endpoints/
│   │       ├── compounds.py  # Compound generation
│   │       ├── integrity.py  # Integrity/temporal
│   │       ├── predictions.py # Affinity/drift
│   │       └── batch.py      # Batch analysis
│   └── core/
│       ├── archivist.py      # Main TSH archivist class
│       ├── parser.py         # Glyph scaffold parser
│       ├── cheminformatics.py # SMILES, MW, 3D coords
│       └── predictor.py      # Affinity prediction
│
└── frontend/
    ├── package.json          # Node dependencies
    ├── vite.config.ts        # Vite config + proxy
    ├── tailwind.config.js    # Tailwind theme
    ├── index.html            # HTML entry
    └── src/
        ├── main.tsx          # React entry
        ├── App.tsx           # Root layout
        ├── index.css         # Tailwind + custom styles
        └── components/
            └── MolecularArchivist.tsx  # Main UI component
```

---

## TSH Code Reference

| TSH Code | Common Name | Description |
|----------|-------------|-------------|
| `◇∴mm` | DMT | Base tryptamine, N,N-dimethyl |
| `◇④h∴mm` | Psilocin | 4-hydroxy-DMT |
| `◇④p∴mm` | Psilocybin | 4-phosphoryloxy-DMT |
| `◇④c∴mm` | 4-AcO-DMT | 4-acetoxy-DMT |
| `◇④f∴mm` | 4-F-DMT | 4-fluoro-DMT |
| `◇⑤m∴mm` | 5-MeO-DMT | 5-methoxy-DMT |
| `◇⑤h∴mm` | Bufotenin | 5-hydroxy-DMT |
| `◇∴ee` | DET | N,N-diethyltryptamine |
| `◇∴ii` | DiPT | N,N-diisopropyltryptamine |
| `◇∴cc` | DCT | N,N-dicyclopropyltryptamine |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | Change port in `backend/api/main.py` or kill existing process |
| Frontend proxy not working | Ensure backend is running on `localhost:8000` before starting frontend |
| `npm install` fails | Clear cache: `rm -rf node_modules package-lock.json && npm install` |
| Python import errors | Run from `backend/` directory: `cd backend && uvicorn api.main:app ...` |
| CORS errors | Backend already has `allow_origins=["*"]`. Check URL in frontend fetch calls. |

---

**Ground Truth Hash:** `63b5160ef51f0464295e86888c3e6605d8f6cc970635183887083818e8749320`  
**Base Frequency:** 111 Hz  
**Origin Date:** 2025-10-02
