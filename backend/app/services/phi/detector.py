import re
from dataclasses import dataclass

# Pattern-based PHI/PII detection covering the identifier classes most likely to appear in
# RCM workflows (claims, EOBs, patient records). This is a deterministic first line of
# defense — combined with the configurable "block on PHI" policy — not a clinical NLP model.
_PATTERNS: dict[str, re.Pattern] = {
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "mrn": re.compile(r"\b(?:MRN|Medical Record(?: Number)?)[:\s#]*([A-Z0-9]{5,15})\b", re.IGNORECASE),
    "dob": re.compile(
        r"\b(?:DOB|Date of Birth)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", re.IGNORECASE
    ),
    "phone": re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "insurance_member_id": re.compile(
        r"\b(?:Member ID|Policy(?: Number)?|Subscriber ID)[:\s#]*([A-Z0-9]{6,15})\b", re.IGNORECASE
    ),
    "npi": re.compile(r"\bNPI[:\s#]*(\d{10})\b", re.IGNORECASE),
    "credit_card": re.compile(r"\b(?:\d[ -]*?){13,16}\b"),
    "date_of_service": re.compile(
        r"\b(?:DOS|Date of Service)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", re.IGNORECASE
    ),
}


@dataclass
class PHIMatch:
    phi_type: str
    value: str
    start: int
    end: int


def detect_phi(text: str) -> list[PHIMatch]:
    matches: list[PHIMatch] = []
    for phi_type, pattern in _PATTERNS.items():
        for m in pattern.finditer(text):
            matches.append(PHIMatch(phi_type=phi_type, value=m.group(0), start=m.start(), end=m.end()))
    return sorted(matches, key=lambda m: m.start)


def has_phi(text: str) -> bool:
    return any(pattern.search(text) for pattern in _PATTERNS.values())


def detected_phi_types(text: str) -> list[str]:
    return sorted({m.phi_type for m in detect_phi(text)})
