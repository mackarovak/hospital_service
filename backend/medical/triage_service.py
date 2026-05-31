TRIAGE_RULES = [
    {
        "keywords": ["боль в груди", "одышка"],
        "specialization": "Кардиолог",
        "urgency": "HIGH",
        "reason": "Возможны сердечно-сосудистые проблемы",
    },
    {
        "keywords": ["температура", "кашель"],
        "specialization": "Терапевт",
        "urgency": "MEDIUM",
        "reason": "Похоже на инфекционное заболевание",
    },
    {
        "keywords": ["сыпь", "зуд"],
        "specialization": "Дерматолог",
        "urgency": "MEDIUM",
        "reason": "Похоже на кожное заболевание",
    },
]


def analyze_symptoms(symptoms: list[str], comment: str = "") -> dict:
    text = " ".join(symptoms + [comment]).lower()

    for rule in TRIAGE_RULES:
        matched = [
            keyword
            for keyword in rule["keywords"]
            if keyword.lower() in text
        ]

        if matched:
            return {
                "urgency": rule["urgency"],
                "recommended_specialization": rule["specialization"],
                "reason": rule["reason"],
                "matched_symptoms": matched,
            }

    return {
        "urgency": "LOW",
        "recommended_specialization": "Терапевт",
        "reason": "Не удалось определить профильного специалиста",
        "matched_symptoms": [],
    }