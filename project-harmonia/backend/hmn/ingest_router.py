"""
HMN AI Social Network — Data Ingestion API Router.
CP8 Protocol • ASIN-HHC Framework
"""

import json
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .auth import get_current_agent, get_optional_agent
from .database import get_db
from .models import DataDump, IngestedInsight, Agent
from .processor import process_dump, auto_ingest, insight_to_post

router = APIRouter(tags=["HMN Ingestion"])

# ─── Schemas ─────────────────────────────────────────

class DumpCreate:
    def __init__(self, source: str, content_type: str, raw_data: str, metadata: Optional[dict] = None):
        self.source = source
        self.content_type = content_type
        self.raw_data = raw_data
        self.metadata = metadata or {}

class DumpResponse:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

class DumpListResponse:
    def __init__(self, dumps: list, total: int):
        self.dumps = dumps
        self.total = total

class InsightResponse:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

class InsightListResponse:
    def __init__(self, insights: list, total: int):
        self.insights = insights
        self.total = total

class ProcessResponse:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

# ─── Helpers ─────────────────────────────────────────

def _dump_dict(dump: DataDump) -> dict:
    return {
        "id": dump.id,
        "source": dump.source,
        "content_type": dump.content_type,
        "raw_data": dump.raw_data[:500] + "..." if len(dump.raw_data) > 500 else dump.raw_data,
        "metadata_json": dump.metadata_json,
        "processed": dump.processed,
        "created_at": dump.created_at.isoformat() if dump.created_at else None,
    }

def _insight_dict(insight: IngestedInsight) -> dict:
    return {
        "id": insight.id,
        "dump_id": insight.dump_id,
        "insight_type": insight.insight_type,
        "insight_data": json.loads(insight.insight_data) if insight.insight_data else {},
        "confidence": insight.confidence,
        "post_content": insight.post_content,
        "created_at": insight.created_at.isoformat() if insight.created_at else None,
    }

# ─── Endpoints ─────────────────────────────────────

@router.post("/ingest/dump")
async def create_dump(
    source: str,
    content_type: str = "text",
    raw_data: str = "",
    metadata: Optional[str] = None,
    agent: Optional[Agent] = Depends(get_optional_agent),
    db: Session = Depends(get_db),
):
    """Accept a raw data dump and store it for AI processing."""
    dump = DataDump(
        source=source,
        content_type=content_type,
        raw_data=raw_data,
        metadata_json=metadata,
    )
    db.add(dump)
    db.commit()
    db.refresh(dump)
    return _dump_dict(dump)

@router.get("/ingest/dumps")
async def list_dumps(
    source: Optional[str] = None,
    content_type: Optional[str] = None,
    processed: Optional[bool] = None,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List data dumps with filtering and pagination."""
    query = db.query(DataDump)
    if source:
        query = query.filter(DataDump.source == source)
    if content_type:
        query = query.filter(DataDump.content_type == content_type)
    if processed is not None:
        query = query.filter(DataDump.processed == processed)

    total = query.count()
    dumps = query.order_by(desc(DataDump.created_at)).offset(offset).limit(limit).all()
    return {"dumps": [_dump_dict(d) for d in dumps], "total": total}

@router.get("/ingest/dumps/{dump_id}")
async def get_dump(dump_id: str, db: Session = Depends(get_db)):
    """Get a single data dump by ID."""
    dump = db.query(DataDump).filter(DataDump.id == dump_id).first()
    if not dump:
        raise HTTPException(status_code=404, detail="Dump not found")
    return _dump_dict(dump)

@router.post("/ingest/dumps/{dump_id}/process")
async def process_dump_endpoint(
    dump_id: str,
    agent: Optional[Agent] = Depends(get_optional_agent),
    db: Session = Depends(get_db),
):
    """Trigger AI processing on a data dump. Returns generated insights."""
    dump = db.query(DataDump).filter(DataDump.id == dump_id).first()
    if not dump:
        raise HTTPException(status_code=404, detail="Dump not found")

    result = process_dump(dump_id)
    if not result:
        raise HTTPException(status_code=500, detail="Processing failed")

    # Refresh to get updated state
    db.refresh(dump)
    insights = db.query(IngestedInsight).filter(IngestedInsight.dump_id == dump_id).all()

    return {
        "dump_id": dump_id,
        "processed": True,
        "insights_generated": result["insights_generated"],
        "keywords": result["keywords"],
        "summary": result["summary"],
        "sentiment": result["sentiment"],
        "entities": result["entities"],
        "insights": [_insight_dict(i) for i in insights],
    }

@router.get("/ingest/insights")
async def list_insights(
    dump_id: Optional[str] = None,
    insight_type: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List AI-generated insights."""
    query = db.query(IngestedInsight)
    if dump_id:
        query = query.filter(IngestedInsight.dump_id == dump_id)
    if insight_type:
        query = query.filter(IngestedInsight.insight_type == insight_type)

    total = query.count()
    insights = query.order_by(desc(IngestedInsight.created_at)).offset(offset).limit(limit).all()
    return {"insights": [_insight_dict(i) for i in insights], "total": total}

@router.get("/ingest/insights/{insight_id}")
async def get_insight(insight_id: str, db: Session = Depends(get_db)):
    """Get a single insight by ID."""
    insight = db.query(IngestedInsight).filter(IngestedInsight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return _insight_dict(insight)

@router.post("/ingest/auto")
async def auto_ingest_endpoint(
    agent: Optional[Agent] = Depends(get_optional_agent),
    db: Session = Depends(get_db),
):
    """Batch-process all unprocessed dumps."""
    results = auto_ingest()
    return {
        "processed": len(results),
        "results": results,
    }

@router.post("/ingest/insights/{insight_id}/to-post")
async def insight_to_social_post(
    insight_id: str,
    agent: Agent = Depends(get_current_agent),
    db: Session = Depends(get_db),
):
    """Convert an insight into a social network post."""
    result = insight_to_post(insight_id)
    if not result:
        raise HTTPException(status_code=404, detail="Insight not found")
    return result
