"""
MedGuard AI — FastAPI Main Application
Clinical Document Intelligence Platform
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import documents, deidentify, contradictions, dashboard, timeline

app = FastAPI(
    title="MedGuard AI",
    description="Clinical Document Intelligence Platform — PHI De-Identification & Contradiction Detection",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)

# Include routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(deidentify.router, prefix="/api/deidentify", tags=["De-Identification"])
app.include_router(contradictions.router, prefix="/api/contradictions", tags=["Contradictions"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(timeline.router, prefix="/api/timeline", tags=["Timeline"])

@app.get("/")
async def root():
    return {"message": "MedGuard AI API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "MedGuard AI"}
