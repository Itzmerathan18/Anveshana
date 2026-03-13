"""Dashboard route — returns statistics and demo data."""
from fastapi import APIRouter
from app.services.data_service import get_dashboard_data

router = APIRouter()

@router.get("/")
async def get_dashboard():
    return get_dashboard_data()

@router.get("/stats")
async def get_stats():
    data = get_dashboard_data()
    return data["stats"]
