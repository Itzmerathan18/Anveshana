"""
Document Processing Service
Handles PDF, DOCX, Images, and plain text extraction.
Uses PyMuPDF (fitz) for PDFs, python-docx for DOCX, and pytesseract for images.
"""
import io
import os
from typing import Optional

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        all_text = []
        for page in doc:
            all_text.append(page.get_text())
        doc.close()
        text = "\n".join(all_text).strip()
        return text if text else ""
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        return f"[DOCX extraction error: {str(e)}]"


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from image using Tesseract OCR."""
    try:
        import pytesseract
        from PIL import Image
        
        # Try to find tesseract (Windows default paths)
        tesseract_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for path in tesseract_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break
        
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except ImportError:
        return "[OCR not available — pytesseract not installed]"
    except Exception as e:
        return f"[Image OCR error: {str(e)}]"


def extract_text(file_bytes: bytes, filename: str) -> dict:
    """Route to appropriate extractor based on file type."""
    ext = os.path.splitext(filename.lower())[1]
    
    if ext == ".pdf":
        text = extract_text_from_pdf(file_bytes)
        file_type = "PDF"
    elif ext in [".docx", ".doc"]:
        text = extract_text_from_docx(file_bytes)
        file_type = "DOCX"
    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"]:
        text = extract_text_from_image(file_bytes)
        file_type = "IMAGE"
    elif ext in [".txt", ".text", ""]:
        text = file_bytes.decode("utf-8", errors="replace")
        file_type = "TEXT"
    else:
        # Try as text fallback
        try:
            text = file_bytes.decode("utf-8", errors="replace")
            file_type = "TEXT"
        except Exception:
            text = "[Unsupported file format]"
            file_type = "UNKNOWN"
    
    return {
        "text": text,
        "file_type": file_type,
        "char_count": len(text),
        "word_count": len(text.split()),
        "filename": filename
    }
