import httpx
import pytest
from django.core.wsgi import get_wsgi_application

from medical.models import Doctor, DoctorPatient, Patient, User, UserRole


def _make_user(login, role):
    user = User(login=login, role=role)
    user.set_password("password")
    user.save()
    return user


@pytest.fixture
def http_client():
    transport = httpx.WSGITransport(app=get_wsgi_application())
    with httpx.Client(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def mvp_context(db):
    patient_user = _make_user("patient1", UserRole.PATIENT)
    doctor_user = _make_user("doctor1", UserRole.DOCTOR)
    other_patient_user = _make_user("patient2", UserRole.PATIENT)

    patient = Patient.objects.create(
        user=patient_user,
        first_name="Ivan",
        last_name="Ivanov",
    )
    other_patient = Patient.objects.create(
        user=other_patient_user,
        first_name="Anna",
        last_name="Sidorova",
    )
    doctor = Doctor.objects.create(
        user=doctor_user,
        first_name="Petr",
        last_name="Petrov",
        specialization="Therapist",
    )

    patient.medical_card.card_number = "MC-0001"
    patient.medical_card.save(update_fields=["card_number"])
    other_patient.medical_card.card_number = "MC-0002"
    other_patient.medical_card.save(update_fields=["card_number"])
    DoctorPatient.objects.create(doctor=doctor, patient=patient)

    return {
        "patient": patient,
        "doctor": doctor,
    }


def _login(client: httpx.Client, login: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"login": login, "password": "password"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_httpx_patient_and_doctor_mvp_flow(http_client, mvp_context):
    patient_token = _login(http_client, "patient1")
    doctor_token = _login(http_client, "doctor1")

    patient_card = http_client.get(
        "/api/v1/patient/medical-card",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert patient_card.status_code == 200
    assert patient_card.json()["medical_card"]["card_number"] == "MC-0001"

    patients = http_client.get(
        "/api/v1/doctor/patients",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert patients.status_code == 200
    assert patients.json()["total"] == 1
    assert patients.json()["items"][0]["id"] == str(mvp_context["patient"].id)

    record = http_client.post(
        f"/api/v1/doctor/patients/{mvp_context['patient'].id}/medical-records",
        headers={"Authorization": f"Bearer {doctor_token}"},
        json={
            "complaints": "Cough",
            "examination_result": "Examined",
            "diagnosis_text": "URI",
            "treatment_text": "Rest",
        },
    )
    assert record.status_code == 201
    assert record.json()["doctor_id"] == str(mvp_context["doctor"].id)
