from app.services.phi.detector import detect_phi


def mask_phi(text: str) -> str:
    """Replace every detected PHI span with a typed redaction marker, e.g. [REDACTED-SSN]."""
    matches = detect_phi(text)
    if not matches:
        return text

    masked = []
    cursor = 0
    for m in matches:
        if m.start < cursor:
            continue  # overlapping match already covered
        masked.append(text[cursor : m.start])
        masked.append(f"[REDACTED-{m.phi_type.upper()}]")
        cursor = m.end
    masked.append(text[cursor:])
    return "".join(masked)
