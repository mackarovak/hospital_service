import os
import sys
from datetime import timedelta
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.utils import timezone

from medical.models import AppointmentSlot, Doctor, DoctorPatient, MedicalCard, Patient, Specialization, User, UserRole


def _upsert_user(login, role):
    user, _ = User.objects.update_or_create(
        login=login,
        defaults={"role": role, "is_active": True},
    )
    user.set_password("password")
    user.save(update_fields=["password"])
    return user


def seed():
    therapist_spec, _ = Specialization.objects.get_or_create(name="Терапевт")
    Specialization.objects.get_or_create(name="Хирург")

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
            "specialization": therapist_spec,
            "office_number": "101",
        },
    )

    MedicalCard.objects.update_or_create(
        patient=patient,
        defaults={"card_number": "MC-0001"},
    )
    DoctorPatient.objects.get_or_create(doctor=doctor, patient=patient)

    # Свободные слоты на следующей неделе
    now = timezone.now()
    next_monday = now + timedelta(days=(7 - now.weekday()))
    next_monday = next_monday.replace(hour=9, minute=0, second=0, microsecond=0)

    slot_times = [
        (next_monday.replace(hour=9), next_monday.replace(hour=9, minute=30)),
        (next_monday.replace(hour=10), next_monday.replace(hour=10, minute=30)),
        (next_monday.replace(hour=11), next_monday.replace(hour=11, minute=30)),
        (next_monday + timedelta(days=1), next_monday + timedelta(days=1, minutes=30)),
        (next_monday + timedelta(days=2), next_monday + timedelta(days=2, minutes=30)),
    ]

    for starts, ends in slot_times:
        AppointmentSlot.objects.get_or_create(
            doctor=doctor,
            starts_at=starts,
            defaults={"ends_at": ends},
        )

    print("Seed users created: patient1 / password, doctor1 / password")


if __name__ == "__main__":
    seed()
