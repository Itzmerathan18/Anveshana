"""
Contradiction Detection API Route
Accepts one or multiple documents, runs entity extraction + contradiction engine.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List
from app.services.document_service import extract_text
from app.services.contradiction_service import (
    detect_contradictions_in_single_doc,
    detect_contradictions_across_docs
)
from app.services.data_service import SAMPLE_CONTRADICTIONS

router = APIRouter()

@router.post("/single")
async def analyze_single_document(file: UploadFile = File(...)):
    """Analyze a single document for internal contradictions."""
    contents = await file.read()
    doc_result = extract_text(contents, file.filename)
    
    if not doc_result["text"] or len(doc_result["text"]) < 10:
        raise HTTPException(status_code=422, detail="Could not extract readable text.")
    
    result = detect_contradictions_in_single_doc(doc_result["text"])
    result["filename"] = file.filename
    result["file_type"] = doc_result["file_type"]
    result["status"] = "success"
    
    return JSONResponse(result)


@router.post("/multi")
async def analyze_multiple_documents(files: List[UploadFile] = File(...)):
    """Analyze multiple documents for cross-document contradictions."""
    if len(files) < 1:
        raise HTTPException(status_code=400, detail="At least one document required.")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 documents per request.")
    
    documents = []
    for f in files:
        contents = await f.read()
        doc_result = extract_text(contents, f.filename)
        if doc_result["text"] and len(doc_result["text"]) > 5:
            documents.append({
                "filename": f.filename,
                "text": doc_result["text"],
                "file_type": doc_result["file_type"]
            })
    
    if not documents:
        raise HTTPException(status_code=422, detail="No readable text could be extracted from uploaded files.")
    
    result = detect_contradictions_across_docs(documents)
    result["status"] = "success"
    
    return JSONResponse(result)


@router.post("/text")
async def analyze_text_for_contradictions(body: dict):
    """Analyze raw text input for medical contradictions."""
    text = body.get("text", "")
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text must be at least 10 characters.")
    
    result = detect_contradictions_in_single_doc(text)
    result["status"] = "success"
    return JSONResponse(result)


@router.get("/demo")
async def get_demo_contradictions():
    """Return pre-computed demo contradictions for demonstration."""
    return JSONResponse({
        "status": "demo",
        "contradictions": SAMPLE_CONTRADICTIONS,
        "contradiction_count": len(SAMPLE_CONTRADICTIONS),
        "risk_score": 78,
        "risk_level": "CRITICAL",
        "note": "Demo data using synthetic patient records (Synthea-generated)."
    })
