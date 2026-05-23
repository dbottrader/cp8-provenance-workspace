"""
HMN AI Social Network — Database connection & session management.
CP8 Protocol • ASIN-HHC Framework
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# ─── Engine ──────────────────────────────────────────

DATABASE_URL = os.getenv(
    "HMN_DATABASE_URL",
    "sqlite:///" + os.path.join(
        os.path.expanduser("~"),
        ".openclaw/workspace/project-harmonia/backend/hmn/hmn.db",
    ),
)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
else:
    engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Dependency ──────────────────────────────────────

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Init ────────────────────────────────────────────

def init_db():
    from .models import Base
    Base.metadata.create_all(bind=engine)
