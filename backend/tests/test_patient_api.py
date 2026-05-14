import json
from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from medical.models import (
    Doctor,
    DoctorPatient,
    MedicalCard,
    MedicalRecord,
    Patient,
    User,
    UserRole,
)
from medical.security import create_access_token, hash_password


@pytest.fixture
def patient_context(db):
    patient_user = User.objects.create(
        login="patient1",
        password_hash=hash_password("password"),
        role=UserRole.PATIENT,
    )
    other_patient_user = User.objects.create(
        login="patient2",
        password_hash=hash_password("password"),
        role=UserRole.PATIENT,
    )
    doctor_user = User.objects.create(
        login="doctor1",
        password_hash=hash_password("password"),
        role=UserRole.DOCTOR,
    )

    patient = Patient.objects.create(
        user=patient_user,
        first_name="Ivan",
        last_name="Ivanov",
        middle_name="Ivanovich",
        date_of_birth="1990-01-01",
        gender="male",
        phone="+79990000000",
        address="Samara",
        blood_type="A+",
        allergies="None",
        chronic_conditions="None",
    )
    other_patient = Patient.objects.create(
        user=other_patient_user,
        first_name="Petr",
        last_name="Sidorov",
    )
    doctor = Doctor.objects.create(
        user=doctor_user,
        first_name="Petr",
        last_name="Petrov",
        middle_name="Petrovich",
    )

    medical_card = MedicalCard.objects.create(patient=patient, card_number="MC-0001")
    other_medical_card = MedicalCard.objects.create(patient=other_patient, card_number="MC-0002")
    DoctorPatient.objects.create(doctor=doctor, patient=patient)
    record = MedicalRecord.objects.create(
        medical_card=medical_card,
        doctor=doctor,
        record_date=timezone.now(),
        complaints="Sore throat",
        examination_result="Examined",
        diagnosis_text="URI",
        treatment_text="Rest",
    )

    return {
        "patient_user": patient_user,
        "doctor_user": doctor_user,
        "patient": patient,
        "doctor": doctor,
        "medical_card": medical_card,
        "other_medical_card": other_medical_card,
        "record": record,
    }


def _auth_header(user: User) -> dict:
    return {"HTTP_AUTHORIZATION": f"Bearer {create_access_token(str(user.id), user.role)}"}


def test_patient_can_get_own_medical_card(patient_context):
    response = Client().get(
        "/api/v1/patient/medical-card",
        **_auth_header(patient_context["patient_user"]),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["patient"]["id"] == str(patient_context["patient"].id)
    assert body["medical_card"]["id"] == str(patient_context["medical_card"].id)
    assert body["medical_card"]["card_number"] == "MC-0001"
    assert body["records"][0]["doctor_full_name"] == "Petrov Petr Petrovich"
    assert body["records"][0]["diagnosis_text"] == "URI"


def test_patient_endpoint_does_not_expose_other_medical_cards(patient_context):
    response = Client().get(
        "/api/v1/patient/medical-card",
        **_auth_header(patient_context["patient_user"]),
    )

    body = response.json()
    assert body["medical_card"]["id"] != str(patient_context["other_medical_card"].id)


def test_doctor_cannot_get_patient_medical_card(patient_context):
    response = Client().get(
        "/api/v1/patient/medical-card",
        **_auth_header(patient_context["doctor_user"]),
    )

    assert response.status_code == 403


def test_patient_can_update_own_profile(patient_context):
    response = Client().patch(
        "/api/v1/patient/profile",
        data=json.dumps(
            {
                "first_name": "Anna",
                "last_name": "Ivanova",
                "phone": "+79991112233",
                "blood_type": "B+",
                "allergies": "Penicillin",
                "role": UserRole.DOCTOR,
                "card_number": "HACK",
            }
        ),
        content_type="application/json",
        **_auth_header(patient_context["patient_user"]),
    )

    assert response.status_code == 200
    patient_context["patient"].refresh_from_db()
    patient_context["patient_user"].refresh_from_db()
    patient_context["medical_card"].refresh_from_db()
    assert patient_context["patient"].first_name == "Anna"
    assert patient_context["patient"].last_name == "Ivanova"
    assert patient_context["patient"].phone == "+79991112233"
    assert patient_context["patient"].blood_type == "B+"
    assert patient_context["patient"].allergies == "Penicillin"
    assert patient_context["patient_user"].role == UserRole.PATIENT
    assert patient_context["medical_card"].card_number == "MC-0001"


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({"first_name": "a" * 101}, "first_name"),
        ({"last_name": "a" * 101}, "last_name"),
        ({"phone": "1" * 31}, "phone"),
        ({"blood_type": "A" * 11}, "blood_type"),
        ({"date_of_birth": (timezone.now().date() + timedelta(days=1)).isoformat()}, "date_of_birth"),
    ],
)
def test_update_profile_validates_fields(patient_context, payload, field):
    response = Client().patch(
        "/api/v1/patient/profile",
        data=json.dumps(payload),
        content_type="application/json",
        **_auth_header(patient_context["patient_user"]),
    )

    assert response.status_code == 400
    assert field in response.json()["errors"]


def test_patient_cannot_edit_medical_records_through_profile(patient_context):
    response = Client().patch(
        "/api/v1/patient/profile",
        data=json.dumps({"diagnosis_text": "Changed"}),
        content_type="application/json",
        **_auth_header(patient_context["patient_user"]),
    )

    assert response.status_code == 200
    patient_context["record"].refresh_from_db()
    assert patient_context["record"].diagnosis_text == "URI"
