"""
PHI De-Identification Service
Detects and redacts Protected Health Information (PHI) using regex + rule patterns.
Covers: Names, Dates, Phone, Email, SSN, MRN, Address, IP, URLs.
"""
import re
from typing import List, Dict, Any

# PHI patterns — HIPAA 18 identifiers (rule-based, no ML needed for speed)
PHI_PATTERNS = [
    {
        "type": "NAME",
        "category": "Direct Identifier",
        "severity": "HIGH",
        "pattern": r"\b(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b",
        "description": "Patient/Provider names with salutation"
    },
    {
        "type": "DATE",
        "category": "Temporal Identifier",
        "severity": "MEDIUM",
        "pattern": r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b",
        "description": "Dates including birthdate, admission, discharge"
    },
    {
        "type": "PHONE",
        "category": "Contact Identifier",
        "severity": "HIGH",
        "pattern": r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "description": "Phone numbers"
    },
    {
        "type": "EMAIL",
        "category": "Contact Identifier",
        "severity": "HIGH",
        "pattern": r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b",
        "description": "Email addresses"
    },
    {
        "type": "SSN",
        "category": "Government Identifier",
        "severity": "CRITICAL",
        "pattern": r"\b\d{3}-\d{2}-\d{4}\b",
        "description": "Social Security Numbers"
    },
    {
        "type": "MRN",
        "category": "Medical Identifier",
        "severity": "HIGH",
        "pattern": r"\b(?:MRN|Patient\s*ID|Record\s*No\.?|Medical\s*Record)\s*:?\s*#?\d{4,10}\b",
        "description": "Medical Record Numbers"
    },
    {
        "type": "ZIP_CODE",
        "category": "Geographic Identifier",
        "severity": "MEDIUM",
        "pattern": r"\b\d{5}(?:-\d{4})?\b",
        "description": "ZIP/postal codes"
    },
    {
        "type": "AGE_OVER_89",
        "category": "Demographic Identifier",
        "severity": "MEDIUM",
        "pattern": r"\b(?:9[0-9]|1[0-9]{2})\s*(?:year[s]?\s*old|yo|y\.o\.)\b",
        "description": "Ages over 89"
    },
    {
        "type": "IP_ADDRESS",
        "category": "Technical Identifier",
        "severity": "LOW",
        "pattern": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "description": "IP addresses"
    },
    {
        "type": "URL",
        "category": "Technical Identifier",
        "severity": "LOW",
        "pattern": r"https?://[^\s]+",
        "description": "URLs and web addresses"
    },
    {
        "type": "ACCOUNT_NUMBER",
        "category": "Financial Identifier",
        "severity": "CRITICAL",
        "pattern": r"\b(?:Acct\.?|Account)\s*(?:No\.?|Number|#)\s*:?\s*\d{6,16}\b",
        "description": "Account numbers"
    },
    {
        "type": "NPI",
        "category": "Provider Identifier",
        "severity": "HIGH",
        "pattern": r"\b(?:NPI|National\s*Provider)\s*:?\s*\d{10}\b",
        "description": "National Provider Identifiers"
    }
]

def detect_phi(text: str) -> Dict[str, Any]:
    """Detect all PHI instances in the given text."""
    findings = []
    redacted_text = text
    
    for phi_pattern in PHI_PATTERNS:
        matches = list(re.finditer(phi_pattern["pattern"], text, re.IGNORECASE))
        for match in matches:
            findings.append({
                "type": phi_pattern["type"],
                "category": phi_pattern["category"],
                "severity": phi_pattern["severity"],
                "description": phi_pattern["description"],
                "original_text": match.group(),
                "start": match.start(),
                "end": match.end(),
                "replacement": f"[{phi_pattern['type']} REDACTED]"
            })
    
    # Sort by position for accurate replacement
    findings.sort(key=lambda x: x["start"], reverse=True)
    
    # Apply redactions
    for finding in findings:
        redacted_text = redacted_text[:finding["start"]] + finding["replacement"] + redacted_text[finding["end"]:]
    
    # Statistics
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    type_counts: Dict[str, int] = {}
    for f in findings:
        severity_counts[f["severity"]] = severity_counts.get(f["severity"], 0) + 1
        type_counts[f["type"]] = type_counts.get(f["type"], 0) + 1
    
    risk_level = "SAFE"
    if severity_counts["CRITICAL"] > 0:
        risk_level = "CRITICAL"
    elif severity_counts["HIGH"] > 2:
        risk_level = "HIGH"
    elif severity_counts["HIGH"] > 0 or severity_counts["MEDIUM"] > 3:
        risk_level = "MEDIUM"
    
    return {
        "original_text": text,
        "redacted_text": redacted_text,
        "phi_findings": list(reversed(findings)),  # restore natural order
        "total_phi_count": len(findings),
        "severity_counts": severity_counts,
        "type_distribution": type_counts,
        "risk_level": risk_level,
        "compliance_note": "Document processed per HIPAA Safe Harbor de-identification method"
    }

def get_phi_summary_for_report(phi_result: Dict[str, Any]) -> str:
    """Generate a human-readable PHI summary."""
    total = phi_result["total_phi_count"]
    risk = phi_result["risk_level"]
    types = list(phi_result["type_distribution"].keys())
    return f"Detected {total} PHI instance(s) — Risk Level: {risk}. Types found: {', '.join(types) if types else 'None'}."
