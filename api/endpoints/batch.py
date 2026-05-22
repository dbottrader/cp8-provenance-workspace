"""
Batch analysis endpoints.
"""

from fastapi import APIRouter

from api.models import BatchAnalyzeResponse, TSHCodeListRequest
from core.archivist import TSHMolecularArchivist

router = APIRouter(prefix="/api", tags=["batch"])

archivist = TSHMolecularArchivist()


@router.post("/batch-analyze", response_model=BatchAnalyzeResponse)
async def batch_analyze(request: TSHCodeListRequest):
    """Batch analyze multiple TSH codes."""
    results = archivist.batch_analyze(request.tsh_codes)
    return results
