"""
Prediction and drift analysis endpoints.
"""

from fastapi import APIRouter

from api.models import TSHCodeListRequest, TSHCodeRequest
from core.archivist import TSHMolecularArchivist

router = APIRouter(prefix="/api", tags=["predictions"])

archivist = TSHMolecularArchivist()


@router.post("/predict-affinity")
async def predict_affinity(request: TSHCodeRequest):
    """Predict 5-HT2A receptor affinity."""
    prediction = archivist.predict_5ht2a_affinity(request.tsh_code)
    return prediction


@router.post("/drift-analysis")
async def drift_analysis(request: TSHCodeListRequest):
    """Run temporal drift analysis."""
    results = archivist.run_drift_analysis(request.tsh_codes)
    return results
