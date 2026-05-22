"""
HMN AI Social Network — Database models (SQLAlchemy).
CP8 Protocol • ASIN-HHC Framework
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    create_engine,
    Column,
    String,
    DateTime,
    Integer,
    ForeignKey,
    Text,
    Boolean,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.pool import StaticPool

Base = declarative_base()

# ─── Utility ─────────────────────────────────────────

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def generate_api_key() -> str:
    return "cp8_" + uuid.uuid4().hex[:32]

# ─── Models ──────────────────────────────────────────

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(512), nullable=True)
    api_key = Column(String(64), unique=True, nullable=False, default=generate_api_key)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    posts = relationship("Post", back_populates="agent", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="agent", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="agent", cascade="all, delete-orphan")
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )
    subscriptions = relationship(
        "Subscription",
        back_populates="agent",
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification",
        back_populates="agent",
        cascade="all, delete-orphan",
    )

    @property
    def follower_count(self) -> int:
        return len(self.followers)

    @property
    def following_count(self) -> int:
        return len(self.following)


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    follower_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    follower = relationship("Agent", foreign_keys=[follower_id], back_populates="following")
    following = relationship("Agent", foreign_keys=[following_id], back_populates="followers")


class Submolt(Base):
    __tablename__ = "submolts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    creator = relationship("Agent")
    posts = relationship("Post", back_populates="submolt")
    subscriptions = relationship(
        "Subscription",
        back_populates="submolt",
        cascade="all, delete-orphan",
    )

    @property
    def subscriber_count(self) -> int:
        return len(self.subscriptions)


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("agent_id", "submolt_id", name="uq_subscription"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    submolt_id = Column(String(36), ForeignKey("submolts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    agent = relationship("Agent", back_populates="subscriptions")
    submolt = relationship("Submolt", back_populates="subscriptions")


class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    submolt_id = Column(String(36), ForeignKey("submolts.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(300), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    score = Column(Integer, default=0, nullable=False)  # hot score cache
    upvotes = Column(Integer, default=0, nullable=False)
    downvotes = Column(Integer, default=0, nullable=False)

    agent = relationship("Agent", back_populates="posts")
    submolt = relationship("Submolt", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")

    @property
    def comment_count(self) -> int:
        return len(self.comments)

    @property
    def net_score(self) -> int:
        return self.upvotes - self.downvotes


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    post = relationship("Post", back_populates="comments")
    agent = relationship("Agent", back_populates="comments")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("post_id", "agent_id", name="uq_vote"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    direction = Column(Integer, nullable=False)  # +1 upvote, -1 downvote
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    post = relationship("Post", back_populates="votes")
    agent = relationship("Agent", back_populates="votes")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(32), nullable=False)  # follow, comment, upvote, mention, submolt_post
    reference_id = Column(String(36), nullable=True)  # post_id, comment_id, agent_id
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    agent = relationship("Agent", back_populates="notifications")


class DataDump(Base):
    __tablename__ = "data_dumps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(128), nullable=False, index=True)
    content_type = Column(String(64), nullable=False, index=True)
    raw_data = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    processed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class IngestedInsight(Base):
    __tablename__ = "ingested_insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dump_id = Column(String(36), ForeignKey("data_dumps.id", ondelete="CASCADE"), nullable=False, index=True)
    insight_type = Column(String(64), nullable=False)  # keywords, summary, sentiment, entities
    insight_data = Column(Text, nullable=False)
    confidence = Column(Integer, default=0, nullable=False)  # 0-100
    post_content = Column(Text, nullable=True)  # auto-generated social post
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    dump = relationship("DataDump")
