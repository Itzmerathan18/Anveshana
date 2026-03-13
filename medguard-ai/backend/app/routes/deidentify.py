"""
De-Identification API Route
Accepts document upload, extracts text, performs PHI detection and redaction.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.document_service import extract_text
from app.services.phi_service import detect_phi

router = APIRouter()

@router.post("/upload")
async def deidentify_document(file: UploadFile = File(...)):
    """Upload a document and receive PHI-redacted output."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB allowed.")
    
    # Extract text
    doc_result = extract_text(contents, file.filename)
    
    if not doc_result["text"] or len(doc_result["text"]) < 5:
        raise HTTPException(status_code=422, detail="Could not extract readable text from document.")
    
    # Run PHI detection
    phi_result = detect_phi(doc_result["text"])
    
    return JSONResponse({
        "status": "success",
        "filename": file.filename,
        "file_type": doc_result["file_type"],
        "word_count": doc_result["word_count"],
        "char_count": doc_result["char_count"],
        "original_text": phi_result["original_text"],
        "redacted_text": phi_result["redacted_text"],
        "phi_findings": phi_result["phi_findings"],
        "total_phi_count": phi_result["total_phi_count"],
        "severity_counts": phi_result["severity_counts"],
        "type_distribution": phi_result["type_distribution"],
        "risk_level": phi_result["risk_level"],
        "compliance_note": phi_result["compliance_note"]
    })

@router.post("/text")
async def deidentify_text(body: dict):
    """Perform PHI detection on raw text input."""
    text = body.get("text", "")
    if not text or len(text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Text is required and must be at least 3 characters.")
    
    phi_result = detect_phi(text)
    return JSONResponse(phi_result)
