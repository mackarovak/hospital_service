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
        keywords=("боль в груди", "одышка", "сердце", "давление", "тахикардия", "аритмия", "пульс"),
        specialization="Кардиолог",
        urgency="HIGH",
        reason="Симптомы могут быть связаны с сердечно-сосудистой системой",
        score=100,
    ),
    TriageRule(
        keywords=("травма", "рана", "перелом", "кровотечение", "аппендицит", "ожог", "гной", "шов"),
        specialization="Хирург",
        urgency="HIGH",
        reason="Симптомы могут требовать осмотра хирурга",
        score=90,
    ),
    TriageRule(
        keywords=("температура", "кашель", "насморк", "горло", "простуда", "слабость", "озноб", "ломота"),
        specialization="Терапевт",
        urgency="MEDIUM",
        reason="Похоже на общее инфекционное или терапевтическое состояние",
        score=60,
    ),
    TriageRule(
        keywords=("сыпь", "зуд", "покраснение", "пятна", "кожа", "родинка", "прыщи", "шелушение"),
        specialization="Дерматолог",
        urgency="MEDIUM",
        reason="Симптомы похожи на кожное заболевание",
        score=55,
    ),
    TriageRule(
        keywords=("живот", "желудок", "изжога", "тошнота", "рвота", "понос", "диарея", "запор", "печень"),
        specialization="Гастроэнтеролог",
        urgency="MEDIUM",
        reason="Жалобы могут быть связаны с желудочно-кишечным трактом",
        score=58,
    ),
    TriageRule(
        keywords=("головная боль", "мигрень", "головокружение", "онемение", "судороги", "тремор", "память"),
        specialization="Невролог",
        urgency="MEDIUM",
        reason="Симптомы могут быть связаны с нервной системой",
        score=57,
    ),
    TriageRule(
        keywords=("ухо", "горло", "нос", "гайморит", "синусит", "слух", "миндалины", "заложенность"),
        specialization="ЛОР",
        urgency="MEDIUM",
        reason="Жалобы относятся к области уха, горла или носа",
        score=56,
    ),
    TriageRule(
        keywords=("глаз", "зрение", "конъюнктивит", "слезится", "очки", "веки", "резь в глазах"),
        specialization="Офтальмолог",
        urgency="MEDIUM",
        reason="Симптомы могут быть связаны с глазами или зрением",
        score=56,
    ),
    TriageRule(
        keywords=("зуб", "десна", "кариес", "пломба", "челюсть", "зубная боль", "налет"),
        specialization="Стоматолог",
        urgency="MEDIUM",
        reason="Жалобы относятся к зубам или полости рта",
        score=56,
    ),
    TriageRule(
        keywords=("сустав", "спина", "колено", "плечо", "остеохондроз", "растяжение", "боль в спине"),
        specialization="Ортопед",
        urgency="MEDIUM",
        reason="Симптомы могут быть связаны с опорно-двигательной системой",
        score=55,
    ),
    TriageRule(
        keywords=("моча", "почки", "цистит", "мочеиспускание", "уролог", "простата", "боль при мочеиспускании"),
        specialization="Уролог",
        urgency="MEDIUM",
        reason="Жалобы могут быть связаны с мочевыделительной системой",
        score=55,
    ),
    TriageRule(
        keywords=("цикл", "месячные", "беременность", "гинеколог", "выделения", "таз", "молочная железа"),
        specialization="Гинеколог",
        urgency="MEDIUM",
        reason="Жалобы относятся к гинекологическому профилю",
        score=55,
    ),
    TriageRule(
        keywords=("сахар", "диабет", "щитовидка", "гормоны", "вес", "инсулин", "эндокринолог"),
        specialization="Эндокринолог",
        urgency="MEDIUM",
        reason="Симптомы могут быть связаны с гормональной системой или обменом веществ",
        score=54,
    ),
    TriageRule(
        keywords=("ребенок", "детский", "младенец", "педиатр", "прививка", "рост", "вес ребенка"),
        specialization="Педиатр",
        urgency="MEDIUM",
        reason="Жалобы относятся к детскому здоровью",
        score=54,
    ),
]

URGENT_HINT = (
    "Если состояние быстро ухудшается, есть сильная боль, потеря сознания, "
    "выраженная одышка или кровотечение, обратитесь за экстренной помощью."
)


def _normalize_text(symptoms: list[str], comment: str) -> str:
    parts = [*symptoms, comment]
    return " ".join(part.strip().lower() for part in parts if part and part.strip())


def analyze_symptoms(
    symptoms: Optional[list[str]] = None,
    comment: str = "",
    available_specializations: Optional[list[str]] = None,
) -> dict:
    symptoms = symptoms or []
    text = _normalize_text(symptoms, comment)
    allowed = {item.lower(): item for item in (available_specializations or [])}

    best_match = None
    best_matched_keywords: list[str] = []

    for rule in TRIAGE_RULES:
        if allowed and rule.specialization.lower() not in allowed:
            continue

        matched = [keyword for keyword in rule.keywords if keyword in text]
        if not matched:
            continue

        current_score = rule.score + len(matched)
        if best_match is None or current_score > best_match[0]:
            best_match = (current_score, rule)
            best_matched_keywords = matched

    if best_match:
        _, rule = best_match
        specialization = allowed.get(rule.specialization.lower(), rule.specialization)
        return {
            "urgency": rule.urgency,
            "recommended_specialization": specialization,
            "reason": rule.reason,
            "matched_symptoms": best_matched_keywords,
            "urgent_hint": URGENT_HINT,
        }

    fallback_specialization = allowed.get("терапевт", "Терапевт")
    return {
        "urgency": "LOW",
        "recommended_specialization": fallback_specialization,
        "reason": "По описанию лучше начать с терапевта",
        "matched_symptoms": [],
        "urgent_hint": URGENT_HINT,
    }
