from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class TriageRule:
    keywords: tuple[str, ...]
    specialization: str
    urgency: str
    reason: str
    score: int


TRIAGE_RULES = [
    TriageRule(
        keywords=("боль в груди", "одышка", "сердце", "давление", "тахикардия"),
        specialization="Кардиолог",
        urgency="HIGH",
        reason="Симптомы могут быть связаны с сердечно-сосудистой системой",
        score=100,
    ),
    TriageRule(
        keywords=("сильная боль", "травма", "рана", "перелом", "кровотечение", "аппендицит"),
        specialization="Хирург",
        urgency="HIGH",
        reason="Симптомы могут требовать срочного осмотра хирурга",
        score=90,
    ),
    TriageRule(
        keywords=("температура", "кашель", "насморк", "горло", "простуда", "слабость"),
        specialization="Терапевт",
        urgency="MEDIUM",
        reason="Похоже на общее инфекционное или терапевтическое состояние",
        score=60,
    ),
    TriageRule(
        keywords=("сыпь", "зуд", "покраснение", "пятна", "кожа", "родинка"),
        specialization="Дерматолог",
        urgency="MEDIUM",
        reason="Симптомы похожи на кожное заболевание",
        score=55,
    ),
]

URGENT_HINT = (
    "Если состояние быстро ухудшается, есть сильная боль, потеря сознания, "
    "выраженная одышка или кровотечение, обратитесь за экстренной помощью."
)


def _normalize_text(symptoms: list[str], comment: str) -> str:
    parts = [*symptoms, comment]
    return " ".join(part.strip().lower() for part in parts if part and part.strip())


def analyze_symptoms(symptoms: Optional[list[str]] = None, comment: str = "") -> dict:
    symptoms = symptoms or []
    text = _normalize_text(symptoms, comment)

    best_match = None
    best_matched_keywords: list[str] = []

    for rule in TRIAGE_RULES:
        matched = [keyword for keyword in rule.keywords if keyword in text]
        if not matched:
            continue

        current_score = rule.score + len(matched)
        if best_match is None or current_score > best_match[0]:
            best_match = (current_score, rule)
            best_matched_keywords = matched

    if best_match:
        _, rule = best_match
        return {
            "urgency": rule.urgency,
            "recommended_specialization": rule.specialization,
            "reason": rule.reason,
            "matched_symptoms": best_matched_keywords,
            "urgent_hint": URGENT_HINT,
        }

    return {
        "urgency": "LOW",
        "recommended_specialization": "Терапевт",
        "reason": "По описанию лучше начать с терапевта",
        "matched_symptoms": [],
        "urgent_hint": URGENT_HINT,
    }
