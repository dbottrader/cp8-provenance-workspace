"""
Integrity and temporal endpoints.
"""

from fastapi import APIRouter, HTTPException

from api.models import IntegrityResponse, ManifestRequest, TemporalDeltaResponse
from core.archivist import TSHMolecularArchivist

router = APIRouter(prefix="/api", tags=["integrity"])

archivist = TSHMolecularArchivist()


@router.post("/verify-integrity", response_model=IntegrityResponse)
async def verify_integrity(manifest: ManifestRequest):
    """Verify manifest integrity against ground truth."""
    is_valid, hash_value = archivist.verify_integrity(manifest.data)
    return {
        "valid": is_valid,
        "hash": hash_value,
        "ground_truth": archivist.HOS_GROUND_TRUTH,
        "match": is_valid,
    }


@router.get("/temporal-delta/{target_date}", response_model=TemporalDeltaResponse)
async def get_temporal_delta(target_date: str):
    """Calculate temporal delta to target date."""
    try:
        delta = archivist.calculate_t_delta(target_date)
        return {
            "target_date": target_date,
            "origin_date": archivist.origin.isoformat(),
            "temporal_delta_days": delta,
            "frequency": archivist.base_freq,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
