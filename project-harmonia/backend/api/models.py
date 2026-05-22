"""
Pydantic request/response models for TSH Bio-Harmonic Molecular Archivist API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TSHCodeRequest(BaseModel):
    tsh_code: str = Field(
        ..., description="TSH scaffold notation code", examples=["◇④f∴mm"]
    )


class TSHCodeListRequest(BaseModel):
    tsh_codes: List[str] = Field(
        ...,
        description="List of TSH scaffold notation codes",
        examples=[["◇④f∴mm", "◇⑤m∴mm"]],
    )


class ManifestRequest(BaseModel):
    data: Dict[str, Any] = Field(
        ..., description="Manifest data for integrity verification"
    )


class IntegrityResponse(BaseModel):
    valid: bool
    hash: str
    ground_truth: str
    match: bool


class TemporalDeltaResponse(BaseModel):
    target_date: str
    origin_date: str
    temporal_delta_days: float
    frequency: int


class SMILESResponse(BaseModel):
    tsh_code: str
    smiles: str


class AffinityResponse(BaseModel):
    tsh_code: str
    predicted_ki_nM: float
    confidence: float
    affinity_class: str


class CodexEntryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tsh_code: str
    iupac_name: str
    common_name: str
    smiles: str
    molecular_weight: Optional[float] = None
    substitutions: List[Dict[str, str]]
    n_chain: Optional[str] = None
    alpha_methyl: bool
    affinity_prediction: Dict[str, Any]
    three_d_coordinates: Dict[str, Any] = Field(alias="3d_coordinates")
    temporal_stability: Dict[str, Any]
    chronal_anchor_freq: int


class BatchAnalyzeResponse(BaseModel):
    timestamp: str
    origin_date: str
    base_frequency: int
    compounds_analyzed: int
    results: List[Dict[str, Any]]


class ErrorResponse(BaseModel):
    detail: str
