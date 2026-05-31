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
