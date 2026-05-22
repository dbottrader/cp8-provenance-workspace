"""
Compound generation and lookup endpoints.
"""

from fastapi import APIRouter

from api.models import CodexEntryResponse, SMILESResponse, TSHCodeRequest
from core.archivist import TSHMolecularArchivist

router = APIRouter(prefix="/api", tags=["compounds"])

archivist = TSHMolecularArchivist()


@router.post("/parse-tsh")
async def parse_tsh(request: TSHCodeRequest):
    """Parse a TSH code into its components."""
    parsed = archivist.parse_tsh_scaffold(request.tsh_code)
    return parsed


@router.post("/generate-smiles", response_model=SMILESResponse)
async def generate_smiles(request: TSHCodeRequest):
    """Generate SMILES string from TSH code."""
    smiles = archivist.generate_smiles(request.tsh_code)
    return {"tsh_code": request.tsh_code, "smiles": smiles}


@router.post("/generate-3d")
async def generate_3d(request: TSHCodeRequest):
    """Generate 3D coordinates for visualization."""
    coords = archivist.generate_3d_coordinates(request.tsh_code)
    return coords


@router.post("/codex-entry", response_model=CodexEntryResponse)
async def get_codex_entry(request: TSHCodeRequest):
    """Generate complete codex entry."""
    entry = archivist.generate_tsh_codex_entry(request.tsh_code)
    return entry


@router.get("/compound/{tsh_code}", response_model=CodexEntryResponse)
async def get_compound(tsh_code: str):
    """Get all data for a specific compound."""
    entry = archivist.generate_tsh_codex_entry(tsh_code)
    return entry
