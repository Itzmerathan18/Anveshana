"""Timeline API route — builds and returns patient timelines."""
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
from app.services.timeline_service import get_demo_timeline, build_patient_timeline
from app.services.document_service import extract_text

router = APIRouter()

@router.get("/demo")
async def get_demo():
    return JSONResponse(get_demo_timeline())

@router.post("/build")
async def build_timeline(files: List[UploadFile] = File(...)):
    documents = []
    for f in files:
        contents = await f.read()
        doc = extract_text(contents, f.filename)
        if doc["text"]:
            documents.append({"filename": f.filename, "text": doc["text"]})
    result = build_patient_timeline(documents)
    result["status"] = "success"
    return JSONResponse(result)
