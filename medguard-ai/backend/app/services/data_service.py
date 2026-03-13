"""
Synthetic demo data for MedGuard AI.
Used for dashboard statistics and demonstration purposes without real patient data.
"""
from typing import Dict, Any

DEMO_STATS = {
    "documents_processed": 247,
    "phi_items_detected": 1842,
    "contradictions_found": 38,
    "risk_alerts": 12,
    "patients_analyzed": 84,
}

DEMO_PHI_DISTRIBUTION = [
    {"type": "NAME", "count": 512, "severity": "HIGH"},
    {"type": "DATE", "count": 387, "severity": "MEDIUM"},
    {"type": "PHONE", "count": 234, "severity": "HIGH"},
    {"type": "MRN", "count": 198, "severity": "HIGH"},
    {"type": "EMAIL", "count": 167, "severity": "HIGH"},
    {"type": "SSN", "count": 89, "severity": "CRITICAL"},
    {"type": "ZIP_CODE", "count": 145, "severity": "MEDIUM"},
    {"type": "IP_ADDRESS", "count": 67, "severity": "LOW"},
    {"type": "NPI", "count": 43, "severity": "HIGH"},
]

DEMO_CONTRADICTION_SEVERITY = [
    {"severity": "CRITICAL", "count": 8, "color": "#ef4444"},
    {"severity": "HIGH", "count": 17, "color": "#f97316"},
    {"severity": "MEDIUM", "count": 10, "color": "#eab308"},
    {"severity": "LOW", "count": 3, "color": "#22c55e"},
]

DEMO_MONTHLY_TREND = [
    {"month": "Sep", "documents": 18, "contradictions": 3},
    {"month": "Oct", "documents": 32, "contradictions": 5},
    {"month": "Nov", "documents": 41, "contradictions": 7},
    {"month": "Dec", "documents": 29, "contradictions": 4},
    {"month": "Jan", "documents": 58, "contradictions": 9},
    {"month": "Feb", "documents": 69, "contradictions": 10},
]

SAMPLE_CONTRADICTIONS = [
    {
        "id": "c001",
        "type": "ALLERGY_MEDICATION",
        "severity": "CRITICAL",
        "patient_id": "PT-001",
        "description": "Patient has documented penicillin allergy. Amoxicillin (penicillin-class) prescribed.",
        "doc_a": "Allergy_Record_PT001.pdf",
        "doc_b": "Prescription_PT001.pdf",
        "confidence": 0.97,
        "risk_contribution": 40,
        "reasoning_trace": [
            "Step 1: Allergy record documents penicillin allergy dated 2023-05-10.",
            "Step 2: Prescription record shows Amoxicillin 500mg TID prescribed on 2024-01-15.",
            "Step 3: Amoxicillin is a penicillin-class antibiotic (aminopenicillin).",
            "Step 4: CRITICAL — administering amoxicillin to a penicillin-allergic patient poses severe anaphylaxis risk."
        ]
    },
    {
        "id": "c002",
        "type": "DIAGNOSIS_DISCREPANCY",
        "severity": "HIGH",
        "patient_id": "PT-002",
        "description": "Diabetes confirmed in discharge summary but denied in outpatient note.",
        "doc_a": "Discharge_Summary_PT002.pdf",
        "doc_b": "Outpatient_Note_PT002.pdf",
        "confidence": 0.88,
        "risk_contribution": 25,
        "reasoning_trace": [
            "Step 1: Discharge summary (Jan 2024) confirms Type 2 Diabetes diagnosis.",
            "Step 2: Outpatient note (Feb 2024) states 'No history of diabetes mellitus'.",
            "Step 3: Contradictory documentation across two clinical records.",
            "Step 4: HIGH risk — may result in incorrect treatment decisions."
        ]
    },
    {
        "id": "c003",
        "type": "CONTRAINDICATION",
        "severity": "HIGH",
        "patient_id": "PT-003",
        "description": "Metformin prescribed despite documented renal failure (CKD Stage 4).",
        "doc_a": "Nephrology_Report_PT003.pdf",
        "doc_b": "Medication_List_PT003.pdf",
        "confidence": 0.93,
        "risk_contribution": 25,
        "reasoning_trace": [
            "Step 1: Nephrology report confirms CKD Stage 4 (eGFR < 30 mL/min).",
            "Step 2: Current medication list includes Metformin 1000mg BID.",
            "Step 3: FDA contraindicates Metformin with eGFR < 30 due to lactic acidosis risk.",
            "Step 4: HIGH risk — immediate medication review recommended."
        ]
    },
    {
        "id": "c004",
        "type": "CRITICAL_LAB",
        "severity": "HIGH",
        "patient_id": "PT-004",
        "description": "Critical hemoglobin value (5.2 g/dL) without documented anemia diagnosis.",
        "doc_a": "Lab_Report_PT004.pdf",
        "doc_b": None,
        "confidence": 0.95,
        "risk_contribution": 25,
        "reasoning_trace": [
            "Step 1: Lab report shows Hemoglobin = 5.2 g/dL.",
            "Step 2: Critical low threshold is 7.0 g/dL.",
            "Step 3: No anemia diagnosis documented in clinical notes.",
            "Step 4: CRITICAL lab value without corresponding clinical documentation."
        ]
    }
]

SAMPLE_PATIENTS = [
    {
        "id": "PT-001",
        "name": "[REDACTED — PHI Protected]",
        "documents": ["Allergy_Record_PT001.pdf", "Prescription_PT001.pdf"],
        "risk_score": 82,
        "risk_level": "CRITICAL",
        "contradiction_count": 2
    },
    {
        "id": "PT-002", 
        "name": "[REDACTED — PHI Protected]",
        "documents": ["Discharge_Summary_PT002.pdf", "Outpatient_Note_PT002.pdf"],
        "risk_score": 55,
        "risk_level": "HIGH",
        "contradiction_count": 1
    },
    {
        "id": "PT-003",
        "name": "[REDACTED — PHI Protected]",
        "documents": ["Nephrology_Report_PT003.pdf", "Medication_List_PT003.pdf"],
        "risk_score": 61,
        "risk_level": "HIGH",
        "contradiction_count": 1
    },
]


def get_dashboard_data() -> Dict[str, Any]:
    return {
        "stats": DEMO_STATS,
        "phi_distribution": DEMO_PHI_DISTRIBUTION,
        "contradiction_severity": DEMO_CONTRADICTION_SEVERITY,
        "monthly_trend": DEMO_MONTHLY_TREND,
        "recent_contradictions": SAMPLE_CONTRADICTIONS[:3],
        "high_risk_patients": SAMPLE_PATIENTS,
        "dataset_note": "Demo data generated using Synthea synthetic patient records. No real patient data used."
    }
