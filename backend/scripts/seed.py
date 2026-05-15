import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from medical.models import Doctor, DoctorPatient, MedicalCard, Patient, User, UserRole


def _upsert_user(login, role):
    user, _ = User.objects.update_or_create(
        login=login,
        defaults={"role": role, "is_active": True},
    )
    user.set_password("password")
    user.save(update_fields=["password"])
    return user


def seed():
    patient_user = _upsert_user("patient1", UserRole.PATIENT)
    doctor_user = _upsert_user("doctor1", UserRole.DOCTOR)

    patient, _ = Patient.objects.update_or_create(
        user=patient_user,
        defaults={
            "first_name": "Patient",
            "last_name": "One",
        },
    )
    doctor, _ = Doctor.objects.update_or_create(
        user=doctor_user,
        defaults={
            "first_name": "Doctor",
            "last_name": "One",
            "specialization": "Therapist",
            "office_number": "101",
        },
    )

    MedicalCard.objects.update_or_create(
        patient=patient,
        defaults={
            "card_number": "MC-0001",
        },
    )
    DoctorPatient.objects.get_or_create(doctor=doctor, patient=patient)

    print("Seed users created: patient1 / password, doctor1 / password")


if __name__ == "__main__":
    seed()
