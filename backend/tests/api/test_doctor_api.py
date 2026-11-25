import json

import pytest
from django.test import Client
from django.utils import timezone

from medical.models import (
    Doctor,
    DoctorPatient,
    MedicalRecord,
    Patient,
    User,
    UserRole,
)
from medical.security import create_access_token


def _make_user(login, role):
    user = User(login=login, role=role)
    user.set_password("password")
    user.save()
    return user


@pytest.fixture
def doctor_context(db):
    doctor_user = _make_user("doctor1", UserRole.DOCTOR)
    other_doctor_user = _make_user("doctor2", UserRole.DOCTOR)
    patient_user = _make_user("patient1", UserRole.PATIENT)
    other_patient_user = _make_user("patient2", UserRole.PATIENT)

    doctor = Doctor.objects.create(
        user=doctor_user,
        first_name="Petr",
        last_name="Petrov",
        middle_name="Petrovich",
    )
    other_doctor = Doctor.objects.create(
        user=other_doctor_user,
        first_name="Sergey",
        last_name="Sergeev",
    )
    patient = Patient.objects.create(
        user=patient_user,
        first_name="Ivan",
        last_name="Ivanov",
        middle_name="Ivanovich",
        date_of_birth="1990-01-01",
        gender="male",
        phone="+79990000000",
        allergies="Penicillin",
        chronic_conditions="None",
    )
    other_patient = Patient.objects.create(
        user=other_patient_user,
        first_name="Anna",
        last_name="Sidorova",
    )

    medical_card = patient.medical_card
    medical_card.card_number = "MC-0001"
    medical_card.save(update_fields=["card_number"])
    other_medical_card = other_patient.medical_card
    other_medical_card.card_number = "MC-0002"
    other_medical_card.save(update_fields=["card_number"])
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
    other_record = MedicalRecord.objects.create(
        medical_card=medical_card,
        doctor=other_doctor,
        record_date=timezone.now(),
        complaints="Other",
        examination_result="Other",
        diagnosis_text="Other",
        treatment_text="Other",
    )

    return {
        "doctor_user": doctor_user,
        "other_doctor_user": other_doctor_user,
        "patient_user": patient_user,
        "doctor": doctor,
        "other_doctor": other_doctor,
        "patient": patient,
        "other_patient": other_patient,
        "medical_card": medical_card,
        "other_medical_card": other_medical_card,
        "record": record,
        "other_record": other_record,
    }


def _auth_header(user: User) -> dict:
    return {"HTTP_AUTHORIZATION": f"Bearer {create_access_token(str(user.id), user.role)}"}


def test_doctor_can_list_own_patients(doctor_context):
    response = Client().get(
        "/api/v1/doctor/patients",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["limit"] == 20
    assert body["items"] == [
        {
            "id": str(doctor_context["patient"].id),
            "full_name": "Ivanov Ivan Ivanovich",
            "date_of_birth": "1990-01-01",
            "card_number": "MC-0001",
        }
    ]


def test_doctor_patient_list_searches_by_name_and_card(doctor_context):
    client = Client()

    name_response = client.get(
        "/api/v1/doctor/patients?query=ivanov",
        **_auth_header(doctor_context["doctor_user"]),
    )
    card_response = client.get(
        "/api/v1/doctor/patients?query=MC-0001",
        **_auth_header(doctor_context["doctor_user"]),
    )
    miss_response = client.get(
        "/api/v1/doctor/patients?query=sidorova",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert name_response.json()["total"] == 1
    assert card_response.json()["total"] == 1
    assert miss_response.json()["total"] == 0


def test_doctor_patient_list_is_paginated(doctor_context):
    response = Client().get(
        "/api/v1/doctor/patients?page=2&limit=1",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["page"] == 2
    assert response.json()["limit"] == 1
    assert response.json()["total"] == 1


def test_patient_cannot_list_doctor_patients(doctor_context):
    response = Client().get(
        "/api/v1/doctor/patients",
        **_auth_header(doctor_context["patient_user"]),
    )

    assert response.status_code == 403


def test_doctor_can_open_own_patient_medical_card(doctor_context):
    response = Client().get(
        f"/api/v1/doctor/patients/{doctor_context['patient'].id}/medical-card",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["patient"]["id"] == str(doctor_context["patient"].id)
    assert body["patient"]["full_name"] == "Ivanov Ivan Ivanovich"
    assert body["medical_card"]["card_number"] == "MC-0001"
    assert body["records"][0]["doctor_full_name"] in {"Petrov Petr Petrovich", "Sergeev Sergey"}


def test_doctor_cannot_open_unlinked_patient_medical_card(doctor_context):
    response = Client().get(
        f"/api/v1/doctor/patients/{doctor_context['other_patient'].id}/medical-card",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 403


def test_doctor_can_create_record_for_own_patient(doctor_context):
    response = Client().post(
        f"/api/v1/doctor/patients/{doctor_context['patient'].id}/medical-records",
        data=json.dumps(
            {
                "complaints": "Cough",
                "examination_result": "Repeated exam",
                "diagnosis_text": "URI",
                "treatment_text": "Rest and water",
            }
        ),
        content_type="application/json",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 201
    body = response.json()
    record = MedicalRecord.objects.get(id=body["id"])
    assert body["medical_card_id"] == str(doctor_context["medical_card"].id)
    assert body["doctor_id"] == str(doctor_context["doctor"].id)
    assert record.complaints == "Cough"
    assert record.doctor == doctor_context["doctor"]


def test_doctor_cannot_create_record_for_unlinked_patient(doctor_context):
    response = Client().post(
        f"/api/v1/doctor/patients/{doctor_context['other_patient'].id}/medical-records",
        data=json.dumps({"complaints": "Nope"}),
        content_type="application/json",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 403


def test_doctor_can_update_own_record(doctor_context):
    response = Client().patch(
        f"/api/v1/doctor/medical-records/{doctor_context['record'].id}",
        data=json.dumps(
            {
                "complaints": "Sore throat and cough",
                "examination_result": "Repeated exam",
                "diagnosis_text": "URI",
                "treatment_text": "Rest",
            }
        ),
        content_type="application/json",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 200
    doctor_context["record"].refresh_from_db()
    assert doctor_context["record"].complaints == "Sore throat and cough"
    assert doctor_context["record"].examination_result == "Repeated exam"


def test_doctor_cannot_update_other_doctor_record(doctor_context):
    response = Client().patch(
        f"/api/v1/doctor/medical-records/{doctor_context['other_record'].id}",
        data=json.dumps({"complaints": "Changed"}),
        content_type="application/json",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 403
    doctor_context["other_record"].refresh_from_db()
    assert doctor_context["other_record"].complaints == "Other"


def test_doctor_cannot_update_record_for_unlinked_patient(doctor_context):
    linked_record = MedicalRecord.objects.create(
        medical_card=doctor_context["other_medical_card"],
        doctor=doctor_context["doctor"],
        complaints="Linked author but patient is not linked",
    )

    response = Client().patch(
        f"/api/v1/doctor/medical-records/{linked_record.id}",
        data=json.dumps({"complaints": "Changed"}),
        content_type="application/json",
        **_auth_header(doctor_context["doctor_user"]),
    )

    assert response.status_code == 403


def test_patient_cannot_update_medical_record(doctor_context):
    response = Client().patch(
        f"/api/v1/doctor/medical-records/{doctor_context['record'].id}",
        data=json.dumps({"complaints": "Changed"}),
        content_type="application/json",
        **_auth_header(doctor_context["patient_user"]),
    )

    assert response.status_code == 403
