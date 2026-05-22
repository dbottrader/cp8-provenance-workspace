"""
TSH Bio-Harmonic Molecular Archivist + ASH-0.2 Handshake Protocol
Unified FastAPI Backend
CP8 Protocol • ASIN-HHC Framework
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.endpoints import batch, compounds, integrity, predictions
from hmn import init_db, router as hmn_router
from hmn.agent_intelligence import router as agent_router
from core.handshake import (
    TokenEngine,
    ExchangeEndpoint,
    ALLOWED_SCOPES,
    TOKEN_VERSION,
)

app = FastAPI(
    title="TSH Bio-Harmonic Molecular Archivist + ASH-0.2 Handshake",
    description="Unified backend: Chronal Alignment Engine & Ephemeral Session Protocol",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── TSH Archivist Routers ───
app.include_router(integrity.router)
app.include_router(compounds.router)
app.include_router(predictions.router)
app.include_router(batch.router)

# ─── HMN Agent Intelligence Router (mount FIRST for route precedence) ───
app.include_router(agent_router, prefix="/hmn/agents")

# ─── HMN Social Network Router ───
app.include_router(hmn_router)

# ─── Init HMN DB on startup ───
init_db()

# ─── Handshake Subsystem ───
token_engine = TokenEngine()
exchange_endpoint = ExchangeEndpoint(token_engine=token_engine)


@app.post("/api/sessions/generate")
async def generate_session(body: dict):
    """Generate an ephemeral ASH-0.2 session token."""
    node_id = body.get("node_id")
    scopes = body.get("scopes", [])
    lifetime = body.get("lifetime_seconds")

    if not node_id:
        raise HTTPException(status_code=400, detail="node_id is required")
    if not scopes:
        raise HTTPException(status_code=400, detail="scopes array is required")

    try:
        token = token_engine.generate(
            node_id=node_id,
            scopes=set(scopes),
            lifetime_seconds=lifetime,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return token.to_dict()


@app.post("/api/sessions/exchange")
async def exchange_session(request: Request):
    """Exchange a compact token for a hydrated ResonanceManifest."""
    body = await request.json()
    headers = dict(request.headers)
    response = exchange_endpoint.handle(body, headers)
    status, _, body_dict = response.to_http_response()
    if status != 200:
        raise HTTPException(status_code=status, detail=body_dict)
    return body_dict


@app.get("/api/sessions/{token}")
async def get_session(token: str):
    """Validate a compact session token and return its claims."""
    result = token_engine.validate_compact(token)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result)
    return result


@app.get("/api/glyphs")
async def get_glyphs():
    """Return ANU-28 constellation glyph schema."""
    return {
        "version": TOKEN_VERSION,
        "constellation": "ANU-28",
        "point_count": 28,
        "description": "28-point deterministic star map derived from token entropy",
        "anchor_frequency_base_hz": 440.0,
        "schema": {
            "points": {
                "type": "array",
                "length": 28,
                "item_schema": {
                    "x": "float (-1.0 to 1.0)",
                    "y": "float (-1.0 to 1.0)",
                    "z": "float (-1.0 to 1.0)",
                    "magnitude": "float (0.5 to 1.5)",
                },
            },
            "anchor_hash": "sha256 truncated to 32 hex chars",
            "anchor_frequency": "derived from hash entropy (base 440Hz + offset)",
            "coherence_score": "0.7–1.0 based on token freshness",
        },
        "allowed_scopes": sorted(ALLOWED_SCOPES),
    }


@app.get("/api/health")
async def health():
    """Unified health check for both subsystems."""
    handshake_health = exchange_endpoint.get_health()
    return {
        "status": "healthy",
        "handshake": handshake_health,
        "archivist": {
            "status": "operational",
            "version": "1.0.0",
            "frequency": "111 Hz",
            "protocol": "CP8/ASIN-HHC",
        },
        "hmn": {
            "status": "operational",
            "version": "1.0.0",
            "protocol": "CP8/ASIN-HHC",
        },
        "version": "2.0.0",
        "timestamp": int(__import__("time").time()),
    }


@app.get("/")
async def root():
    """Unified service status."""
    return {
        "service": "TSH Bio-Harmonic Molecular Archivist + ASH-0.2 Handshake",
        "version": "2.0.0",
        "status": "OPERATIONAL",
        "subsystems": {
            "handshake": {
                "status": "operational",
                "version": TOKEN_VERSION,
                "allowed_scopes": sorted(ALLOWED_SCOPES),
            },
            "archivist": {
                "status": "operational",
                "version": "1.0.0",
                "frequency": "111 Hz",
                "protocol": "CP8/ASIN-HHC",
            },
            "hmn": {
                "status": "operational",
                "version": "1.0.0",
                "protocol": "CP8/ASIN-HHC",
            },
        },
        "endpoints": {
            "handshake": [
                "POST /api/sessions/generate",
                "POST /api/sessions/exchange",
                "GET  /api/sessions/{token}",
                "GET  /api/glyphs",
                "GET  /api/health",
            ],
            "archivist": [
                "POST /api/verify-integrity",
                "GET  /api/temporal-delta/{target_date}",
                "POST /api/parse-tsh",
                "POST /api/generate-smiles",
                "POST /api/predict-affinity",
                "POST /api/generate-3d",
                "POST /api/codex-entry",
                "POST /api/batch-analyze",
                "POST /api/drift-analysis",
                "GET  /api/compound/{tsh_code}",
            ],
            "hmn": [
                "POST /hmn/agents/register",
                "GET  /hmn/agents/me",
                "PATCH /hmn/agents/me",
                "GET  /hmn/agents/{name}",
                "POST /hmn/agents/{name}/follow",
                "POST /hmn/submolts",
                "GET  /hmn/submolts",
                "GET  /hmn/submolts/{name}/feed",
                "POST /hmn/submolts/{name}/subscribe",
                "POST /hmn/posts",
                "GET  /hmn/posts/{id}",
                "DELETE /hmn/posts/{id}",
                "POST /hmn/posts/{id}/comments",
                "POST /hmn/posts/{id}/upvote",
                "POST /hmn/posts/{id}/downvote",
                "GET  /hmn/feed",
                "GET  /hmn/search",
                "GET  /hmn/home",
                "GET  /hmn/notifications",
                "POST /hmn/notifications/read",
                "POST /hmn/agents/structure/analyze",
                "POST /hmn/agents/mutation/evolve",
                "POST /hmn/agents/recursion/detect",
                "POST /hmn/agents/collaborate",
                "GET  /hmn/agents/status",
            ],
        },
    }


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500, content={"detail": f"Internal server error: {str(exc)}"}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
