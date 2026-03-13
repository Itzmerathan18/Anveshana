"""
Clinical Decision Support Engine
After contradiction detection, provides actionable clinical recommendations.
Maps contradiction types to evidence-based clinical actions.
"""
from typing import List, Dict, Any

# Decision support rules: contradiction type → recommendations
DECISION_RULES = {
    "ALLERGY_MEDICATION": {
        "urgency": "IMMEDIATE",
        "actions": [
            "Discontinue the prescribed medication immediately.",
            "Notify prescribing physician of documented allergy.",
            "Review full allergy history before alternative selection.",
            "Monitor patient for any early allergic reactions.",
        ],
        "alternatives_note": "Consider allergy-safe alternatives from a different drug class.",
        "icd10_flag": "Z88 — Allergy status to drugs, medicaments and biological substances"
    },
    "CROSS_REACTIVITY": {
        "urgency": "HIGH",
        "actions": [
            "Review cross-reactivity profile between allergen and prescribed drug.",
            "Consult allergist/immunologist before continuing therapy.",
            "Consider skin testing if alternate drug class unavailable.",
            "Document cross-reactivity concern in patient medical record.",
        ],
        "alternatives_note": "Choose a structurally unrelated antibiotic class.",
        "icd10_flag": "T78.1 — Other adverse food reactions; drug interaction cross-check required"
    },
    "CONTRAINDICATION": {
        "urgency": "HIGH",
        "actions": [
            "Review contraindication against current patient diagnosis.",
            "Assess benefits vs. risks with prescribing clinician.",
            "Check organ function labs (renal/hepatic) before continuing.",
            "Consider dose adjustment or drug substitution.",
        ],
        "alternatives_note": "Consult pharmacist for contraindication-safe alternatives.",
        "icd10_flag": "Z79 — Long-term (current) drug therapy — requires monitoring"
    },
    "DIAGNOSIS_DISCREPANCY": {
        "urgency": "MEDIUM",
        "actions": [
            "Reconcile contradictory diagnoses across clinical notes.",
            "Request clarification from the documenting clinician.",
            "Review most recent diagnostic workup and test results.",
            "Update patient's active problem list for accuracy.",
        ],
        "alternatives_note": "Ensure unified diagnosis before treatment planning.",
        "icd10_flag": "Z03 — Medical observation for suspected conditions"
    },
    "CRITICAL_LAB": {
        "urgency": "IMMEDIATE",
        "actions": [
            "Notify treating clinician of critical lab value immediately.",
            "Repeat lab test to confirm result (rule out error).",
            "Assess patient clinically for symptoms matching abnormal value.",
            "Document critical value notification per protocol.",
        ],
        "alternatives_note": "Initiate appropriate treatment protocol per clinical guideline.",
        "icd10_flag": "R00–R99 — Symptoms and signs — requires clinical correlation"
    },
    "LAB_DIAGNOSIS_MISMATCH": {
        "urgency": "MEDIUM",
        "actions": [
            "Correlate abnormal lab result with clinical presentation.",
            "Consider whether undiagnosed condition explains the result.",
            "Order follow-up diagnostic tests if indicated.",
            "Update diagnostic assessment based on lab findings.",
        ],
        "alternatives_note": "Lab-Clinical correlation essential for accurate diagnosis.",
        "icd10_flag": "R73 — Elevated blood glucose level — metabolic workup recommended"
    },
}

URGENCY_COLORS = {
    "IMMEDIATE": "#ef4444",
    "HIGH": "#f97316",
    "MEDIUM": "#eab308",
    "LOW": "#22c55e",
}

def get_decision_support(contradiction_type: str, context: Dict = None) -> Dict[str, Any]:
    rule = DECISION_RULES.get(contradiction_type, {
        "urgency": "LOW",
        "actions": ["Review clinical documentation for accuracy.", "Consult appropriate specialist."],
        "alternatives_note": "Clinical judgment required.",
        "icd10_flag": "—"
    })
    return {
        "contradiction_type": contradiction_type,
        "urgency": rule["urgency"],
        "urgency_color": URGENCY_COLORS.get(rule["urgency"], "#6b7280"),
        "recommended_actions": rule["actions"],
        "alternatives_note": rule["alternatives_note"],
        "icd10_reference": rule["icd10_flag"],
        "disclaimer": "These recommendations are for informational purposes only. Always apply clinical judgment."
    }

def enrich_contradictions_with_decision_support(contradictions: List[Dict]) -> List[Dict]:
    """Add decision support to each contradiction."""
    for c in contradictions:
        ctype = c.get("type", "")
        c["decision_support"] = get_decision_support(ctype, c)
    return contradictions
