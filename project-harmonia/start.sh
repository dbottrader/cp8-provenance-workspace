#!/usr/bin/env bash
# Project Harmonia — Dual-server startup script
# CP8 Protocol · ASIN-HHC Framework

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Project Harmonia — TSH Bio-Harmonic Molecular Archivist    ║"
echo "║  CP8/ASIN-HHC · 111 Hz · Chronal Alignment Engine            ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Start backend
echo ""
echo "[BACKEND] Starting FastAPI on port 8000..."
cd "$PROJECT_ROOT/backend"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "[BACKEND] Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/ >/dev/null 2>&1; then
        echo "[BACKEND] ✓ API ready at http://localhost:8000"
        break
    fi
    sleep 1
done

# Start frontend
echo ""
echo "[FRONTEND] Starting Vite dev server on port 3000..."
cd "$PROJECT_ROOT/frontend"
npm install --silent 2>/dev/null || true
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Backend API:  http://localhost:8000"
echo "  Frontend:     http://localhost:3000"
echo "  API Docs:     http://localhost:8000/docs"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Trap SIGINT to kill both processes
trap "echo ''; echo 'Shutting down servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
