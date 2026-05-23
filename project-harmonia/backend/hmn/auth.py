"""
HMN AI Social Network — Bearer token authentication.
API keys stored in the agents table. CP8 Protocol • ASIN-HHC Framework.
"""

import secrets
from typing import Optional

from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .models import Agent

security = HTTPBearer(auto_error=False)


def get_current_agent(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Agent:
    """
    Resolve the calling agent from either:
    - Authorization: Bearer <api_key>
    - X-API-Key: <api_key>
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif x_api_key:
        token = x_api_key

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication. Provide Bearer token or X-API-Key header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Strip "Bearer " prefix if present in raw token (some clients double-prefix)
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    agent = db.query(Agent).filter(Agent.api_key == token).first()
    if not agent:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return agent


def require_auth(agent: Agent = Depends(get_current_agent)) -> Agent:
    return agent


def get_optional_agent(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Optional[Agent]:
    """Resolve agent if credentials provided, otherwise return None."""
    token = None
    if credentials:
        token = credentials.credentials
    elif x_api_key:
        token = x_api_key

    if not token:
        return None

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    return db.query(Agent).filter(Agent.api_key == token).first()
