import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    owner_id: uuid.UUID
    filename: str
    mime_type: str
    size_bytes: int
    source: str
    status: str
    extracted_summary: str | None
    extracted_data: dict | None
    phi_detected: bool
    phi_types: list[str] | None
    error_message: str | None
    created_at: datetime


class DocumentAnalysisResult(BaseModel):
    document_id: uuid.UUID
    summary: str
    key_dates: list[str] = []
    patient_identifiers_masked: list[str] = []
    diagnoses: list[str] = []
    procedures: list[str] = []
    insurance_details: dict = {}
    key_actions: list[str] = []
    phi_detected: bool = False
