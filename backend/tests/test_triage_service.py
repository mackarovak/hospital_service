from medical.triage_service import analyze_symptoms


def test_analyze_symptoms_recommends_cardiologist_for_chest_pain():
    result = analyze_symptoms(comment="Боль в груди и одышка после нагрузки")

    assert result["urgency"] == "HIGH"
    assert result["recommended_specialization"] == "Кардиолог"
    assert "боль в груди" in result["matched_symptoms"]


def test_analyze_symptoms_falls_back_to_therapist():
    result = analyze_symptoms(comment="Непонятное недомогание")

    assert result["urgency"] == "LOW"
    assert result["recommended_specialization"] == "Терапевт"
    assert result["matched_symptoms"] == []


def test_analyze_symptoms_recommends_gastroenterologist():
    result = analyze_symptoms(comment="Тошнота, изжога и болит желудок")

    assert result["urgency"] == "MEDIUM"
    assert result["recommended_specialization"] == "Гастроэнтеролог"
    assert "тошнота" in result["matched_symptoms"]


def test_analyze_symptoms_respects_available_specializations():
    result = analyze_symptoms(
        comment="Сыпь и зуд",
        available_specializations=["Терапевт", "Кардиолог"],
    )

    assert result["recommended_specialization"] == "Терапевт"
    assert result["matched_symptoms"] == []
