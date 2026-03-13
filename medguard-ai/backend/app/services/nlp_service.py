"""
Medical Entity Extraction Service
Extracts clinical entities: diagnoses, medications, lab values, vitals, allergies.
Uses regex + keyword matching (no heavy ML required for hackathon speed).
"""
import re
from typing import Dict, List, Any

# Medical vocabularies
DIAGNOSIS_KEYWORDS = [
    "diabetes", "hypertension", "asthma", "cancer", "tumor", "pneumonia",
    "infection", "anemia", "arthritis", "osteoporosis", "depression",
    "anxiety", "alzheimer", "dementia", "stroke", "heart failure",
    "kidney disease", "liver disease", "copd", "epilepsy", "migraine",
    "hypothyroidism", "hyperthyroidism", "obesity", "malnutrition",
    "sepsis", "covid", "influenza", "tuberculosis", "hiv", "hepatitis",
    "atrial fibrillation", "coronary artery disease", "myocardial infarction",
    "deep vein thrombosis", "pulmonary embolism", "chronic kidney disease",
    "type 1 diabetes", "type 2 diabetes", "gestational diabetes",
    "rheumatoid arthritis", "psoriasis", "crohn's disease", "colitis"
]

MEDICATION_PATTERNS = [
    r"\b(metformin|insulin|lisinopril|atorvastatin|omeprazole|amlodipine|"
    r"aspirin|warfarin|heparin|penicillin|amoxicillin|ciprofloxacin|"
    r"azithromycin|prednisone|ibuprofen|acetaminophen|morphine|oxycodone|"
    r"lorazepam|diazepam|sertraline|fluoxetine|atenolol|metoprolol|"
    r"furosemide|hydrochlorothiazide|levothyroxine|albuterol|salbutamol|"
    r"clopidogrel|rivaroxaban|apixaban|simvastatin|rosuvastatin|"
    r"gabapentin|pregabalin|tramadol|codeine|doxycycline|vancomycin|"
    r"cephalexin|clindamycin|trimethoprim|sulfamethoxazole)\b",
    r"\b\w+(?:cillin|mycin|floxacin|sartan|pril|statin|mab|nib|olol|azole|oxide)\b",
]

LAB_PATTERNS = [
    {
        "name": "glucose",
        "pattern": r"(?:blood\s+)?glucose\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mg/dL|mmol/L)?",
        "unit": "mg/dL",
        "normal_range": (70, 100),
        "critical_high": 400,
        "critical_low": 40
    },
    {
        "name": "hemoglobin",
        "pattern": r"h(?:ae)?moglobin\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g/dL)?",
        "unit": "g/dL",
        "normal_range": (12, 17),
        "critical_high": 20,
        "critical_low": 7
    },
    {
        "name": "hba1c",
        "pattern": r"hba1c\s*:?\s*(\d+(?:\.\d+)?)\s*%?",
        "unit": "%",
        "normal_range": (4, 5.7),
        "critical_high": 14,
        "critical_low": 0
    },
    {
        "name": "creatinine",
        "pattern": r"creatinine\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mg/dL)?",
        "unit": "mg/dL",
        "normal_range": (0.6, 1.2),
        "critical_high": 10,
        "critical_low": 0
    },
    {
        "name": "blood_pressure_systolic",
        "pattern": r"(?:blood\s+pressure|bp)\s*:?\s*(\d{2,3})/\d{2,3}",
        "unit": "mmHg",
        "normal_range": (90, 120),
        "critical_high": 180,
        "critical_low": 70
    },
    {
        "name": "heart_rate",
        "pattern": r"(?:heart\s+rate|pulse|hr)\s*:?\s*(\d+)\s*(?:bpm)?",
        "unit": "bpm",
        "normal_range": (60, 100),
        "critical_high": 150,
        "critical_low": 40
    },
    {
        "name": "oxygen_saturation",
        "pattern": r"(?:spo2|o2\s+sat|oxygen\s+sat(?:uration)?)\s*:?\s*(\d+(?:\.\d+)?)\s*%?",
        "unit": "%",
        "normal_range": (95, 100),
        "critical_high": 100,
        "critical_low": 88
    },
    {
        "name": "temperature",
        "pattern": r"(?:temperature|temp)\s*:?\s*(\d+(?:\.\d+)?)\s*°?(?:F|C)?",
        "unit": "°F",
        "normal_range": (97, 99),
        "critical_high": 104,
        "critical_low": 95
    },
    {
        "name": "sodium",
        "pattern": r"sodium\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mEq/L|mmol/L)?",
        "unit": "mEq/L",
        "normal_range": (136, 145),
        "critical_high": 160,
        "critical_low": 120
    },
    {
        "name": "potassium",
        "pattern": r"potassium\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mEq/L|mmol/L)?",
        "unit": "mEq/L",
        "normal_range": (3.5, 5.0),
        "critical_high": 6.5,
        "critical_low": 2.5
    }
]

ALLERGY_PATTERNS = [
    r"allerg(?:y|ic|ies)\s+to\s+([A-Za-z\s,]+?)(?:\.|,|\n|$)",
    r"known\s+allerg(?:y|ies)\s*:?\s*([A-Za-z\s,]+?)(?:\.|,|\n|$)",
    r"(?:drug|medication)\s+allerg(?:y|ies)\s*:?\s*([A-Za-z\s,]+?)(?:\.|,|\n|$)",
    r"allergic\s+reaction\s+to\s+([A-Za-z\s,]+?)(?:\.|,|\n|$)",
    r"NKA|NKDA|No\s+Known\s+(?:Drug\s+)?Allerg(?:y|ies)"
]


def extract_medical_entities(text: str) -> Dict[str, Any]:
    """Extract all medical entities from clinical text."""
    text_lower = text.lower()

    # 1. Extract diagnoses
    diagnoses = []
    for keyword in DIAGNOSIS_KEYWORDS:
        if keyword in text_lower:
            # Find context
            idx = text_lower.find(keyword)
            context_start = max(0, idx - 50)
            context_end = min(len(text), idx + len(keyword) + 80)
            context = text[context_start:context_end].strip()
            
            # Check for negation
            negated = False
            negation_phrases = ["no ", "denies ", "denying ", "ruled out", "negative for", "without ", "no history of"]
            snippet = text_lower[max(0, idx-60):idx]
            for neg in negation_phrases:
                if neg in snippet:
                    negated = True
                    break
            
            diagnoses.append({
                "name": keyword.title(),
                "negated": negated,
                "context": context,
                "confidence": 0.85 if not negated else 0.75
            })

    # 2. Extract medications + doses
    medications = []
    all_med_matches = set()
    for pattern in MEDICATION_PATTERNS:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            med_name = match.group().strip()
            if med_name.lower() not in all_med_matches:
                all_med_matches.add(med_name.lower())
                # Look for dose near the medication name
                dose_pattern = r"(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml|units?|IU)"
                dose_match = re.search(dose_pattern, text[match.end():match.end()+50], re.IGNORECASE)
                freq_keywords = ["once daily", "twice daily", "bid", "tid", "qid", "prn", "stat", "q8h", "q12h"]
                freq = None
                snippet_after = text[match.end():match.end()+80].lower()
                for f in freq_keywords:
                    if f in snippet_after:
                        freq = f
                        break
                
                medications.append({
                    "name": med_name,
                    "dose": dose_match.group() if dose_match else None,
                    "frequency": freq,
                    "start_index": match.start(),
                    "confidence": 0.9
                })

    # 3. Extract lab values
    lab_values = []
    for lab in LAB_PATTERNS:
        match = re.search(lab["pattern"], text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                status = "NORMAL"
                low, high = lab["normal_range"]
                if value < lab["critical_low"] or value > lab["critical_high"]:
                    status = "CRITICAL"
                elif value < low or value > high:
                    status = "ABNORMAL"
                
                lab_values.append({
                    "test": lab["name"].replace("_", " ").title(),
                    "value": value,
                    "unit": lab["unit"],
                    "status": status,
                    "normal_range": f"{low}–{high} {lab['unit']}",
                    "confidence": 0.92
                })
            except (ValueError, IndexError):
                pass

    # 4. Extract allergies
    allergies = []
    no_known_allergies = False
    for pattern in ALLERGY_PATTERNS:
        if "NKA" in pattern or "No Known" in pattern:
            if re.search(pattern, text, re.IGNORECASE):
                no_known_allergies = True
                break
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            allergen = match.group(1).strip() if match.lastindex else match.group().strip()
            # Normalize
            for a in allergen.split(","):
                a = a.strip()
                if a and len(a) > 2:
                    allergies.append({
                        "allergen": a,
                        "confidence": 0.88
                    })

    # 5. Extract vitals summary
    vitals = {k["name"]: None for k in LAB_PATTERNS if k["name"] in 
              ["blood_pressure_systolic", "heart_rate", "oxygen_saturation", "temperature"]}
    for lab_val in lab_values:
        key = lab_val["test"].lower().replace(" ", "_")
        if key in vitals:
            vitals[key] = lab_val["value"]

    return {
        "diagnoses": diagnoses,
        "medications": medications,
        "lab_values": lab_values,
        "allergies": allergies,
        "no_known_allergies": no_known_allergies,
        "vitals": vitals,
        "entity_count": len(diagnoses) + len(medications) + len(lab_values) + len(allergies)
    }
