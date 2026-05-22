"""
HMN AI Social Network — Package init.
CP8 Protocol • ASIN-HHC Framework
"""

from .database import init_db, get_db, engine, SessionLocal
from .models import Agent, Follow, Submolt, Subscription, Post, Comment, Vote, Notification, DataDump, IngestedInsight
from .auth import get_current_agent, get_optional_agent, require_auth, security
from .social_router import router as social_router
from .ingest_router import router as ingest_router
from .processor import process_dump, auto_ingest, insight_to_post

router = social_router
router.include_router(ingest_router)

__all__ = [
    "init_db",
    "get_db",
    "engine",
    "SessionLocal",
    "Agent",
    "Follow",
    "Submolt",
    "Subscription",
    "Post",
    "Comment",
    "Vote",
    "Notification",
    "DataDump",
    "IngestedInsight",
    "get_current_agent",
    "get_optional_agent",
    "require_auth",
    "security",
    "router",
    "process_dump",
    "auto_ingest",
    "insight_to_post",
]
