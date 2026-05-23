"""
ASH-0.2 Handshake Protocol endpoints.
Session token generation, validation, exchange, and resonance manifest hydration.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional, Set, Dict, Any
from pydantic import BaseModel, Field

from core.handshake import (
    TokenEngine,
    ResonanceManifestEngine,
    ExchangeEndpoint,
    ExchangeRequest,
    ALLOWED_SCOPES,
    SessionToken,
    TokenScope,
)

router = APIRouter(prefix="/api/sessions", tags=["handshake"])

# ─── Pydantic Models ───────────────────────────────

class GenerateTokenRequest(BaseModel):
    node_id: str = Field(..., description="Unique node identifier")
    scopes: list[str] = Field(default=["read:lattice"], description="Requested permission scopes")
    lifetime_seconds: Optional[int] = Field(default=None, description="Token lifetime in seconds (default: 7200)")


class GenerateTokenResponse(BaseModel):
    success: bool
    token: str
    token_id: str
    node_id: str
    expires_at: int
    scope: list[str]
    gateway_url: str
    markdown: str


class ExchangeRequestModel(BaseModel):
    node_id: str
    token: str = Field(..., description="Compact/base64url token string")
    scopes: list[str] = Field(default=[], description="Scopes to request for this exchange")


class ExchangeResponseModel(BaseModel):
    success: bool
    session_id: Optional[str]
    manifest: Optional[Dict[str, Any]]
    error: Optional[Dict[str, Any]]
    gateway_url: str


class ValidateRequest(BaseModel):
    compact_token: str


class ValidateResponse(BaseModel):
    valid: bool
    reason: str
    code: str
    claims: Optional[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    gateway_url: str
    version: str
    allowed_scopes: list[str]


# ─── Endpoints ─────────────────────────────────────

token_engine = TokenEngine()
manifest_engine = ResonanceManifestEngine()
exchange_endpoint = ExchangeEndpoint()


@router.post("/generate", response_model=GenerateTokenResponse)
async def generate_token(request: GenerateTokenRequest):
    """Generate a new ASH-0.2 ephemeral session token."""
    try:
        scopes = set(request.scopes)
        token = token_engine.generate(
            node_id=request.node_id,
            scopes=scopes,
            lifetime_seconds=request.lifetime_seconds,
        )
        return {
            "success": True,
            "token": token.to_compact_string(),
            "token_id": token.token_id,
            "node_id": token.node_id,
            "expires_at": token.expires_at,
            "scope": sorted(token.scope.to_set()),
            "gateway_url": token.gateway_url,
            "markdown": token.to_markdown_block(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/exchange", response_model=ExchangeResponseModel)
async def exchange_token(request: ExchangeRequestModel):
    """Exchange a valid token for a hydrated resonance manifest."""
    result = exchange_endpoint.handle(
        body={
            "node_id": request.node_id,
            "token": request.token,
            "scopes": request.scopes,
        }
    )
    if not result.success:
        status_map = {
            "UNAUTHORIZED": 401,
            "FORBIDDEN": 403,
            "RATE_LIMITED": 429,
            "EXPIRED": 401,
            "REVOKED": 401,
            "HUMAN_APPROVAL_REQUIRED": 403,
            "UNKNOWN_NODE": 404,
            "VALIDATION_FAILED": 400,
            "BAD_REQUEST": 400,
        }
        status = status_map.get(result.error_code, 400)
        raise HTTPException(
            status_code=status,
            detail={
                "code": result.error_code,
                "reason": result.error_reason,
                "blocked_by": result.blocked_by,
            },
        )
    return {
        "success": True,
        "session_id": result.session_id,
        "manifest": result.manifest,
        "error": None,
        "gateway_url": result.gateway_url,
    }


@router.post("/validate", response_model=ValidateResponse)
async def validate_token(request: ValidateRequest):
    """Validate a compact token without exchanging it."""
    result = token_engine.validate_compact(request.compact_token)
    return {
        "valid": result["valid"],
        "reason": result.get("reason", ""),
        "code": result.get("code", "OK"),
        "claims": result.get("claims"),
    }


@router.get("/health", response_model=HealthResponse)
async def handshake_health():
    """ASH-0.2 handshake service health check."""
    return {
        "status": "healthy",
        "gateway_url": exchange_endpoint.gateway_url,
        "version": "ASH-0.2",
        "allowed_scopes": sorted(ALLOWED_SCOPES),
    }
