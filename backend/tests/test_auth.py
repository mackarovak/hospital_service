import json

import pytest
from django.test import Client

from medical.models import Doctor, DoctorPatient, MedicalCard, Patient, User, UserRole
from medical.security import create_access_token, decode_access_token, hash_password, verify_password


@pytest.fixture
def patient_user(db):
    user = User(login="patient1", role=UserRole.PATIENT)
    user.set_password("password")
    user.save()
    return user


@pytest.fixture
def doctor_user(db):
    user = User(login="doctor1", role=UserRole.DOCTOR)
    user.set_password("password")
    user.save()
    return user


def _login(client: Client, login: str, password: str):
    return client.post(
        "/api/v1/auth/login",
        data=json.dumps({"login": login, "password": password}),
        content_type="application/json",
    )


def test_hash_and_verify_password():
    password_hash = hash_password("password")

    assert password_hash != "password"
    assert verify_password("password", password_hash)
    assert not verify_password("wrong", password_hash)


def test_create_and_decode_access_token(patient_user):
    token = create_access_token(str(patient_user.id), patient_user.role)

    payload = decode_access_token(token)

    assert payload["sub"] == str(patient_user.id)
    assert payload["role"] == UserRole.PATIENT


def test_login_returns_token_and_user(patient_user):
    client = Client()

    response = _login(client, "patient1", "password")

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"] == {
        "id": str(patient_user.id),
        "login": "patient1",
        "role": UserRole.PATIENT,
    }


def test_doctor_login_returns_token_and_user(doctor_user):
    response = _login(Client(), "doctor1", "password")

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"] == {
        "id": str(doctor_user.id),
        "login": "doctor1",
        "role": UserRole.DOCTOR,
    }


def test_login_rejects_wrong_password(patient_user):
    response = _login(Client(), "patient1", "wrong")

    assert response.status_code == 401


def test_login_rejects_unknown_login(db):
    response = _login(Client(), "missing", "password")

    assert response.status_code == 401


def test_login_rejects_inactive_user(patient_user):
    patient_user.is_active = False
    patient_user.save(update_fields=["is_active"])

    response = _login(Client(), "patient1", "password")

    assert response.status_code == 403


def test_me_returns_current_user(patient_user):
    token = create_access_token(str(patient_user.id), patient_user.role)

    response = Client().get("/api/v1/me", HTTP_AUTHORIZATION=f"Bearer {token}")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(patient_user.id),
        "login": patient_user.login,
        "role": UserRole.PATIENT,
        "is_active": True,
    }


def test_patient_cannot_open_doctor_endpoint(patient_user):
    token = create_access_token(str(patient_user.id), patient_user.role)

    response = Client().get("/api/v1/doctor/check", HTTP_AUTHORIZATION=f"Bearer {token}")

    assert response.status_code == 403


def test_doctor_cannot_open_patient_endpoint(doctor_user):
    token = create_access_token(str(doctor_user.id), doctor_user.role)

    response = Client().get("/api/v1/patient/check", HTTP_AUTHORIZATION=f"Bearer {token}")

    assert response.status_code == 403


@pytest.mark.django_db
def test_seed_script_creates_demo_data():
    from scripts.seed import seed

    seed()

    patient_user = User.objects.get(login="patient1")
    doctor_user = User.objects.get(login="doctor1")
    patient = Patient.objects.get(user=patient_user)
    doctor = Doctor.objects.get(user=doctor_user)

    assert patient_user.check_password("password")
    assert doctor_user.check_password("password")
    assert MedicalCard.objects.filter(patient=patient).exists()
    assert DoctorPatient.objects.filter(doctor=doctor, patient=patient).exists()
