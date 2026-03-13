"""
Contradiction Detection Engine
Hybrid approach: Rule-based layer + semantic similarity scoring.
Detects clinical contradictions across multiple patient documents.
"""
import re
from typing import List, Dict, Any, Optional
from app.services.nlp_service import extract_medical_entities

# Drug-allergy cross-reactivity map
ALLERGY_CROSS_REACTIVITY = {
    "penicillin": ["amoxicillin", "ampicillin", "nafcillin", "oxacillin", "dicloxacillin",
                   "piperacillin", "cephalexin", "cefazolin", "ceftriaxone", "cefdinir"],
    "sulfa": ["sulfamethoxazole", "trimethoprim-sulfamethoxazole", "furosemide", "hydrochlorothiazide"],
    "aspirin": ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "indomethacin"],
    "codeine": ["morphine", "oxycodone", "hydrocodone", "tramadol", "fentanyl"],
    "latex": ["banana", "avocado", "kiwi"],  # latex-fruit syndrome
    "contrast": ["iodine", "shellfish"],
    "ciprofloxacin": ["levofloxacin", "moxifloxacin", "norfloxacin"],
}

# Diagnosis pairs that are mutually contradictory
CONTRADICTORY_DIAGNOSES = [
    ("type 1 diabetes", "type 2 diabetes"),
    ("hypothyroidism", "hyperthyroidism"),
    ("hypertension", "hypotension"),
    ("tachycardia", "bradycardia"),
    ("hyperkalemia", "hypokalemia"),
    ("hypernatremia", "hyponatremia"),
    ("polycythemia", "anemia"),
    ("hypocalcemia", "hypercalcemia"),
    ("alkalosis", "acidosis"),
]

# Diagnosis-medication contradictions (prescribing a contraindicated drug)
DIAGNOSIS_MED_CONTRAINDICATIONS = [
    {
        "diagnosis": "renal failure",
        "contraindicated_meds": ["metformin", "nsaids", "ibuprofen", "naproxen"],
        "reason": "These medications are contraindicated in renal failure due to nephrotoxicity or accumulation risk."
    },
    {
        "diagnosis": "asthma",
        "contraindicated_meds": ["atenolol", "metoprolol", "propranolol", "nadolol"],
        "reason": "Beta-blockers can cause bronchoconstriction in asthma patients."
    },
    {
        "diagnosis": "atrial fibrillation",
        "contraindicated_meds": ["class 1c antiarrhythmics"],
        "reason": "Certain antiarrhythmics increase mortality in structural heart disease."
    },
    {
        "diagnosis": "heart failure",
        "contraindicated_meds": ["ibuprofen", "naproxen", "verapamil", "diltiazem"],
        "reason": "NSAIDs worsen heart failure; non-DHP calcium channel blockers reduce cardiac output."
    },
    {
        "diagnosis": "pregnancy",
        "contraindicated_meds": ["warfarin", "methotrexate", "isotretinoin", "lisinopril", "enalapril"],
        "reason": "These are teratogenic medications contraindicated in pregnancy."
    },
    {
        "diagnosis": "liver disease",
        "contraindicated_meds": ["acetaminophen", "methotrexate", "isoniazid", "statins"],
        "reason": "Hepatotoxic medications are contraindicated in liver disease."
    },
    {
        "diagnosis": "hypertension",
        "contraindicated_meds": ["pseudoephedrine", "phenylephrine", "stimulants"],
        "reason": "These medications raise blood pressure and worsen hypertension."
    },
]


def _check_allergy_medication_conflict(entities: Dict[str, Any]) -> List[Dict]:
    """Check for allergy vs. prescribed medication conflicts."""
    conflicts = []
    allergies = [a["allergen"].lower() for a in entities.get("allergies", [])]
    medications = entities.get("medications", [])

    for allergy in allergies:
        # Direct allergy match
        for med in medications:
            med_name = med["name"].lower()
            if allergy in med_name or med_name in allergy:
                conflicts.append({
                    "type": "ALLERGY_MEDICATION",
                    "severity": "CRITICAL",
                    "allergy": allergy.title(),
                    "medication": med["name"],
                    "description": f"Patient has a documented allergy to '{allergy.title()}' but is prescribed '{med['name']}'.",
                    "reasoning_trace": [
                        f"Step 1: Document indicates allergy to '{allergy.title()}'.",
                        f"Step 2: Medication '{med['name']}' is prescribed.",
                        f"Step 3: Direct name match between allergen and medication.",
                        "Step 4: CRITICAL — prescribing an allergen poses severe anaphylaxis risk."
                    ],
                    "confidence": 0.97
                })
            # Cross-reactivity check
            elif allergy in ALLERGY_CROSS_REACTIVITY:
                cross_reactive = ALLERGY_CROSS_REACTIVITY[allergy]
                for cr_drug in cross_reactive:
                    if cr_drug in med_name or med_name in cr_drug:
                        conflicts.append({
                            "type": "CROSS_REACTIVITY",
                            "severity": "HIGH",
                            "allergy": allergy.title(),
                            "medication": med["name"],
                            "description": f"Patient allergic to '{allergy.title()}'. Prescribed '{med['name']}' is cross-reactive.",
                            "reasoning_trace": [
                                f"Step 1: Document indicates allergy to '{allergy.title()}'.",
                                f"Step 2: '{med['name']}' is prescribed.",
                                f"Step 3: Pharmacological analysis: '{med['name']}' shares structural similarity with '{allergy.title()}'.",
                                "Step 4: Cross-reactivity risk — may trigger allergic response."
                            ],
                            "confidence": 0.88
                        })
    return conflicts


def _check_diagnosis_medication_contraindications(entities: Dict[str, Any]) -> List[Dict]:
    """Check for contraindicated medications given patient diagnoses."""
    conflicts = []
    diagnoses = [d["name"].lower() for d in entities.get("diagnoses", []) if not d.get("negated")]
    medications = [m["name"].lower() for m in entities.get("medications", [])]

    for rule in DIAGNOSIS_MED_CONTRAINDICATIONS:
        diag_keyword = rule["diagnosis"]
        if any(diag_keyword in d for d in diagnoses):
            for contraind_med in rule["contraindicated_meds"]:
                for med in medications:
                    if contraind_med in med or med in contraind_med:
                        conflicts.append({
                            "type": "CONTRAINDICATION",
                            "severity": "HIGH",
                            "diagnosis": diag_keyword.title(),
                            "medication": med.title(),
                            "description": f"Patient has '{diag_keyword.title()}'. Prescribing '{med.title()}' is contraindicated.",
                            "clinical_reason": rule["reason"],
                            "reasoning_trace": [
                                f"Step 1: Document confirms diagnosis of '{diag_keyword.title()}'.",
                                f"Step 2: Medication '{med.title()}' is prescribed.",
                                f"Step 3: Clinical guidelines flag this combination as contraindicated.",
                                f"Step 4: {rule['reason']}",
                                "Step 5: HIGH risk — review medication regimen."
                            ],
                            "confidence": 0.91
                        })
    return conflicts


def _check_lab_abnormalities(entities: Dict[str, Any]) -> List[Dict]:
    """Flag critical lab values with context conflicts."""
    conflicts = []
    lab_values = entities.get("lab_values", [])
    diagnoses = [d["name"].lower() for d in entities.get("diagnoses", []) if not d.get("negated")]

    for lab in lab_values:
        if lab["status"] == "CRITICAL":
            conflicts.append({
                "type": "CRITICAL_LAB",
                "severity": "HIGH",
                "lab_test": lab["test"],
                "value": f"{lab['value']} {lab['unit']}",
                "normal_range": lab["normal_range"],
                "description": f"CRITICAL lab value: {lab['test']} = {lab['value']} {lab['unit']} (Normal: {lab['normal_range']}).",
                "reasoning_trace": [
                    f"Step 1: Lab result for '{lab['test']}' recorded as {lab['value']} {lab['unit']}.",
                    f"Step 2: Normal reference range is {lab['normal_range']}.",
                    f"Step 3: Value is outside critical safety thresholds.",
                    "Step 4: Immediate clinical alert warranted."
                ],
                "confidence": 0.95
            })
        elif lab["status"] == "ABNORMAL":
            # Look for contradnictory diagnosis context
            glucose_keywords = ["diabetes", "hypoglycemia", "hyperglycemia"]
            if lab["test"].lower() == "glucose" and not any(k in diagnoses for k in glucose_keywords):
                conflicts.append({
                    "type": "LAB_DIAGNOSIS_MISMATCH",
                    "severity": "MEDIUM",
                    "lab_test": lab["test"],
                    "value": f"{lab['value']} {lab['unit']}",
                    "normal_range": lab["normal_range"],
                    "description": f"Abnormal glucose ({lab['value']} {lab['unit']}) with no documented diabetes/glycemic diagnosis.",
                    "reasoning_trace": [
                        f"Step 1: Glucose level recorded as {lab['value']} {lab['unit']} — outside normal range.",
                        "Step 2: No diabetes or glycemic disorder found in diagnoses.",
                        "Step 3: Inconsistency between lab value and documented diagnoses.",
                        "Step 4: Consider documenting metabolic disorder or investigating cause."
                    ],
                    "confidence": 0.82
                })

    return conflicts


def detect_contradictions_in_single_doc(text: str) -> Dict[str, Any]:
    """Detect contradictions within a single document."""
    entities = extract_medical_entities(text)
    all_conflicts = []

    all_conflicts.extend(_check_allergy_medication_conflict(entities))
    all_conflicts.extend(_check_diagnosis_medication_contraindications(entities))
    all_conflicts.extend(_check_lab_abnormalities(entities))

    # Filter by confidence > 0.75
    filtered = [c for c in all_conflicts if c.get("confidence", 0) > 0.75]

    risk_score = _calculate_risk_score(filtered)

    return {
        "entities": entities,
        "contradictions": filtered,
        "contradiction_count": len(filtered),
        "risk_score": risk_score,
        "risk_level": _risk_level(risk_score)
    }


def detect_contradictions_across_docs(documents: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Detect contradictions across multiple patient documents.
    documents: List of {"filename": str, "text": str}
    """
    per_doc_results = []
    all_conflicts = []
    combined_entities = {
        "diagnoses": [], "medications": [], "lab_values": [], "allergies": []
    }

    for doc in documents:
        result = detect_contradictions_in_single_doc(doc["text"])
        result["filename"] = doc["filename"]
        per_doc_results.append(result)
        
        # Merge entities for cross-doc analysis
        for key in combined_entities:
            for item in result["entities"].get(key, []):
                combined_entities[key].append({**item, "source_doc": doc["filename"]})
        
        all_conflicts.extend([{**c, "source_doc": doc["filename"]} for c in result["contradictions"]])

    # Cross-document specific checks
    cross_conflicts = _cross_document_checks(per_doc_results, documents)
    all_conflicts.extend(cross_conflicts)

    # Filter duplicates and low confidence
    unique_conflicts = []
    seen = set()
    for c in all_conflicts:
        key = (c.get("type"), c.get("description", "")[:80])
        if key not in seen and c.get("confidence", 0) > 0.75:
            seen.add(key)
            unique_conflicts.append(c)

    risk_score = _calculate_risk_score(unique_conflicts)

    return {
        "per_document": per_doc_results,
        "combined_entities": combined_entities,
        "contradictions": unique_conflicts,
        "contradiction_count": len(unique_conflicts),
        "cross_document_count": len(cross_conflicts),
        "risk_score": risk_score,
        "risk_level": _risk_level(risk_score),
        "document_count": len(documents)
    }


def _cross_document_checks(per_doc_results: List[Dict], documents: List[Dict]) -> List[Dict]:
    """Find contradictions that span across two or more documents."""
    conflicts = []

    # Compare diagnoses across docs
    all_diagnoses_by_doc = {}
    for result in per_doc_results:
        fname = result["filename"]
        all_diagnoses_by_doc[fname] = {
            "confirmed": [d["name"].lower() for d in result["entities"]["diagnoses"] if not d.get("negated")],
            "negated": [d["name"].lower() for d in result["entities"]["diagnoses"] if d.get("negated")]
        }

    # Check for affirmation in one doc vs negation in another
    filenames = list(all_diagnoses_by_doc.keys())
    for i in range(len(filenames)):
        for j in range(i + 1, len(filenames)):
            fn_a, fn_b = filenames[i], filenames[j]
            confirmed_a = set(all_diagnoses_by_doc[fn_a]["confirmed"])
            negated_a = set(all_diagnoses_by_doc[fn_a]["negated"])
            confirmed_b = set(all_diagnoses_by_doc[fn_b]["confirmed"])
            negated_b = set(all_diagnoses_by_doc[fn_b]["negated"])

            # Confirmed in A, negated in B
            for dx in confirmed_a.intersection(negated_b):
                conflicts.append({
                    "type": "DIAGNOSIS_DISCREPANCY",
                    "severity": "HIGH",
                    "diagnosis": dx.title(),
                    "doc_a": fn_a,
                    "doc_b": fn_b,
                    "description": f"'{dx.title()}' confirmed in '{fn_a}' but denied/absent in '{fn_b}'.",
                    "reasoning_trace": [
                        f"Step 1: Document '{fn_a}' confirms diagnosis of '{dx.title()}'.",
                        f"Step 2: Document '{fn_b}' records 'No {dx.title()}' or denies this diagnosis.",
                        "Step 3: Direct contradiction between two clinical records.",
                        "Step 4: HIGH risk — discordant diagnoses may reflect documentation error or disease progression."
                    ],
                    "confidence": 0.86,
                    "cross_document": True
                })

            # Confirmed in B, negated in A
            for dx in confirmed_b.intersection(negated_a):
                conflicts.append({
                    "type": "DIAGNOSIS_DISCREPANCY",
                    "severity": "HIGH",
                    "diagnosis": dx.title(),
                    "doc_a": fn_b,
                    "doc_b": fn_a,
                    "description": f"'{dx.title()}' confirmed in '{fn_b}' but denied/absent in '{fn_a}'.",
                    "reasoning_trace": [
                        f"Step 1: Document '{fn_b}' confirms diagnosis of '{dx.title()}'.",
                        f"Step 2: Document '{fn_a}' records 'No {dx.title()}' or denies this diagnosis.",
                        "Step 3: Cross-document contradiction identified.",
                        "Step 4: HIGH risk — inconsistent records."
                    ],
                    "confidence": 0.86,
                    "cross_document": True
                })

    return conflicts


def _calculate_risk_score(contradictions: List[Dict]) -> int:
    """Calculate overall patient risk score 0-100."""
    score = 0
    severity_weights = {"CRITICAL": 40, "HIGH": 25, "MEDIUM": 10, "LOW": 5}
    for c in contradictions:
        weight = severity_weights.get(c.get("severity", "LOW"), 5)
        conf = c.get("confidence", 0.75)
        score += int(weight * conf)
    return min(score, 100)


def _risk_level(score: int) -> str:
    if score >= 70:
        return "CRITICAL"
    elif score >= 45:
        return "HIGH"
    elif score >= 20:
        return "MEDIUM"
    else:
        return "LOW"
