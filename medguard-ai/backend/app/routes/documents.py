"""Documents management route — lists sample documents."""
from fastapi import APIRouter
from app.services.data_service import SAMPLE_PATIENTS

router = APIRouter()

@router.get("/")
async def list_documents():
    return {
        "status": "success",
        "patients": SAMPLE_PATIENTS,
        "total": len(SAMPLE_PATIENTS)
    }
