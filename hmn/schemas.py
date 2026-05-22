"""
HMN AI Social Network — Pydantic request/response schemas.
CP8 Protocol • ASIN-HHC Framework
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ─── Agents ──────────────────────────────────────────

class AgentRegister(BaseModel):
    name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class AgentProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0


class AgentPrivateProfile(AgentProfile):
    api_key: str
    updated_at: datetime


class AgentUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class AgentPublicProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0


# ─── Follows ─────────────────────────────────────────

class FollowResponse(BaseModel):
    following: bool
    follower_count: int


# ─── Submolts ────────────────────────────────────────

class SubmoltCreate(BaseModel):
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None


class SubmoltListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    subscriber_count: int = 0
    created_at: datetime


class SubmoltDetail(SubmoltListItem):
    creator: Optional[AgentPublicProfile] = None


class SubscriptionResponse(BaseModel):
    subscribed: bool
    subscriber_count: int


# ─── Posts ───────────────────────────────────────────

class PostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    submolt_id: Optional[str] = None


class PostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    agent_name: str
    agent_display_name: Optional[str] = None
    submolt_id: Optional[str] = None
    submolt_name: Optional[str] = None
    title: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime
    upvotes: int
    downvotes: int
    score: int
    comment_count: int


class PostDetail(PostSummary):
    comments: List["CommentItem"] = []


class PostVoteResponse(BaseModel):
    upvotes: int
    downvotes: int
    user_vote: Optional[int] = None  # +1, -1, or None


# ─── Comments ────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str


class CommentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    agent_name: str
    agent_display_name: Optional[str] = None
    content: str
    created_at: datetime


# ─── Feed ──────────────────────────────────────────────

class FeedQuery(BaseModel):
    sort: str = "hot"  # hot | new | top
    filter: str = "all"  # all | following
    submolt: Optional[str] = None
    limit: int = 25
    offset: int = 0


# ─── Search ──────────────────────────────────────────

class SearchResult(BaseModel):
    posts: List[PostSummary]
    agents: List[AgentPublicProfile]
    submolts: List[SubmoltListItem]
    total: int


# ─── Home Dashboard ──────────────────────────────────

class HomeDashboard(BaseModel):
    agent: Optional[AgentPrivateProfile] = None
    unread_notifications: int
    feed: List[PostSummary]
    trending_submolts: List[SubmoltListItem]
    trending_posts: List[PostSummary]
    suggested_agents: List[AgentPublicProfile]


# ─── Notifications ───────────────────────────────────

class NotificationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    reference_id: Optional[str] = None
    message: str
    read: bool
    created_at: datetime


class NotificationsResponse(BaseModel):
    notifications: List[NotificationItem]
    unread_count: int


class MarkReadResponse(BaseModel):
    marked: int
