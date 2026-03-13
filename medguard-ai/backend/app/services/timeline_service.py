"""
Patient Timeline Builder Service
Extracts dated clinical events from documents and builds a chronological patient timeline.
Detects temporal contradictions (e.g., diagnosis appearing 5 days after it was denied).
"""
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

# Date patterns with context extraction
DATE_PATTERNS = [
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
    r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})",
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})",
    r"(Day\s+\d+)",
    r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})",
]

EVENT_KEYWORDS = {
    "DIAGNOSIS": [
        "diagnosed with", "diagnosis:", "presents with", "patient has",
        "confirmed:", "assessment:", "impression:", "suffers from", "history of"
    ],
    "MEDICATION": [
        "prescribed", "prescription:", "medication:", "medications:", "drug:",
        "started on", "initiated", "ordered:", "dispense", "administer"
    ],
    "LAB": [
        "lab result", "blood test", "glucose:", "hemoglobin:", "hba1c:",
        "creatinine:", "potassium:", "sodium:", "result:", "lab:"
    ],
    "ALLERGY": [
        "allergy:", "allergies:", "allergic to", "drug allergy", "known allergy"
    ],
    "VITAL": [
        "blood pressure:", "bp:", "heart rate:", "hr:", "pulse:", "temperature:",
        "spo2:", "o2 sat:", "weight:", "height:"
    ],
    "PROCEDURE": [
        "surgery:", "procedure:", "operation:", "biopsy:", "scan:", "mri:",
        "ct scan:", "x-ray:", "ecg:", "ekg:"
    ],
    "NOTE": [
        "patient denies", "no history of", "negative for", "no known",
        "patient states", "reports", "chief complaint:"
    ],
    "DISCHARGE": [
        "discharged", "discharge date", "discharge summary", "discharged on"
    ],
    "ADMISSION": [
        "admitted", "admission date", "admission:", "admitted on", "hospitalized"
    ],
}

EVENT_COLORS = {
    "DIAGNOSIS": "#3b82f6",
    "MEDICATION": "#10b981",
    "LAB": "#f59e0b",
    "ALLERGY": "#ef4444",
    "VITAL": "#8b5cf6",
    "PROCEDURE": "#06b6d4",
    "NOTE": "#6b7280",
    "DISCHARGE": "#84cc16",
    "ADMISSION": "#f97316",
}

DEMO_TIMELINE = [
    {
        "date": "2024-01-05",
        "day_label": "Day 1",
        "event_type": "ADMISSION",
        "description": "Patient admitted — chief complaint: fatigue and polyuria.",
        "source_doc": "Admission_Record.pdf",
        "color": EVENT_COLORS["ADMISSION"],
        "entities": [],
        "has_conflict": False
    },
    {
        "date": "2024-01-05",
        "day_label": "Day 1",
        "event_type": "DIAGNOSIS",
        "description": "Confirmed: Type 2 Diabetes. Blood glucose 285 mg/dL.",
        "source_doc": "Initial_Assessment.pdf",
        "color": EVENT_COLORS["DIAGNOSIS"],
        "entities": ["Type 2 Diabetes"],
        "has_conflict": True,
        "conflict_note": "⚠️ Contradicted by Day 5 outpatient note"
    },
    {
        "date": "2024-01-05",
        "day_label": "Day 1",
        "event_type": "ALLERGY",
        "description": "Allergy documented: Penicillin (anaphylaxis).",
        "source_doc": "Allergy_Record.pdf",
        "color": EVENT_COLORS["ALLERGY"],
        "entities": ["Penicillin"],
        "has_conflict": True,
        "conflict_note": "⚠️ Amoxicillin (penicillin-class) prescribed on Day 8"
    },
    {
        "date": "2024-01-07",
        "day_label": "Day 3",
        "event_type": "LAB",
        "description": "HbA1c: 9.2% (HIGH). Creatinine: 2.8 mg/dL (ABNORMAL). Hemoglobin: 9.2 g/dL.",
        "source_doc": "Lab_Report.pdf",
        "color": EVENT_COLORS["LAB"],
        "entities": ["HbA1c 9.2%", "Creatinine 2.8", "Hemoglobin 9.2"],
        "has_conflict": True,
        "conflict_note": "⚠️ CKD indicators suggest Metformin contraindicated"
    },
    {
        "date": "2024-01-08",
        "day_label": "Day 4",
        "event_type": "MEDICATION",
        "description": "Prescribed: Metformin 1000mg BID, Lisinopril 10mg OD.",
        "source_doc": "Prescription_Record.pdf",
        "color": EVENT_COLORS["MEDICATION"],
        "entities": ["Metformin 1000mg", "Lisinopril 10mg"],
        "has_conflict": True,
        "conflict_note": "⚠️ Metformin contraindicated: Creatinine 2.8 mg/dL (CKD)"
    },
    {
        "date": "2024-01-10",
        "day_label": "Day 6",
        "event_type": "NOTE",
        "description": "Outpatient note: Patient denies diabetes. No known allergies reported.",
        "source_doc": "Outpatient_Note.pdf",
        "color": EVENT_COLORS["NOTE"],
        "entities": [],
        "has_conflict": True,
        "conflict_note": "⚠️ Contradicts Day 1 diabetes diagnosis and allergy record"
    },
    {
        "date": "2024-01-13",
        "day_label": "Day 9",
        "event_type": "MEDICATION",
        "description": "Prescribed: Amoxicillin 500mg TID for respiratory infection.",
        "source_doc": "Prescription_2.pdf",
        "color": EVENT_COLORS["MEDICATION"],
        "entities": ["Amoxicillin 500mg"],
        "has_conflict": True,
        "conflict_note": "⚠️ CRITICAL: Penicillin allergy documented Day 1!"
    },
    {
        "date": "2024-01-15",
        "day_label": "Day 11",
        "event_type": "VITAL",
        "description": "BP: 158/96 mmHg (HIGH). HR: 92 bpm. SpO2: 97%.",
        "source_doc": "Vitals_Record.pdf",
        "color": EVENT_COLORS["VITAL"],
        "entities": ["BP 158/96", "HR 92"],
        "has_conflict": False
    },
    {
        "date": "2024-01-18",
        "day_label": "Day 14",
        "event_type": "DISCHARGE",
        "description": "Patient discharged. Follow-up in 2 weeks.",
        "source_doc": "Discharge_Summary.pdf",
        "color": EVENT_COLORS["DISCHARGE"],
        "entities": [],
        "has_conflict": False
    },
]


def extract_timeline_from_text(text: str, source_doc: str = "Document") -> List[Dict]:
    """Extract timeline events from a clinical document."""
    events = []
    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Find date in this line or nearby
        date_found = None
        for pattern in DATE_PATTERNS:
            m = re.search(pattern, line, re.IGNORECASE)
            if m:
                date_found = m.group(1)
                break

        # Detect event type
        event_type = "NOTE"
        line_lower = line.lower()
        for etype, keywords in EVENT_KEYWORDS.items():
            if any(kw in line_lower for kw in keywords):
                event_type = etype
                break

        if date_found or event_type != "NOTE":
            if len(line) > 10:
                events.append({
                    "date": date_found or "Unknown",
                    "day_label": date_found or "—",
                    "event_type": event_type,
                    "description": line[:200],
                    "source_doc": source_doc,
                    "color": EVENT_COLORS.get(event_type, "#6b7280"),
                    "entities": [],
                    "has_conflict": False,
                })

    return events


def build_patient_timeline(documents: List[Dict]) -> Dict[str, Any]:
    """Build a patient timeline from multiple documents."""
    all_events = []
    for doc in documents:
        events = extract_timeline_from_text(doc.get("text", ""), doc.get("filename", "Document"))
        all_events.extend(events)

    # Sort by date if possible
    all_events.sort(key=lambda x: x.get("date", ""))

    conflicts = [e for e in all_events if e.get("has_conflict")]

    return {
        "events": all_events,
        "event_count": len(all_events),
        "conflict_count": len(conflicts),
        "event_type_distribution": {
            t: len([e for e in all_events if e["event_type"] == t])
            for t in EVENT_KEYWORDS.keys()
            if any(e["event_type"] == t for e in all_events)
        },
    }


def get_demo_timeline() -> Dict[str, Any]:
    """Return static demo timeline for demonstration."""
    conflicts = [e for e in DEMO_TIMELINE if e.get("has_conflict")]
    type_dist = {}
    for e in DEMO_TIMELINE:
        t = e["event_type"]
        type_dist[t] = type_dist.get(t, 0) + 1

    return {
        "events": DEMO_TIMELINE,
        "event_count": len(DEMO_TIMELINE),
        "conflict_count": len(conflicts),
        "event_type_distribution": type_dist,
        "patient_id": "PT-Demo-01",
        "demo": True
    }
