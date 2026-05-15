import pytest
from django.db import IntegrityError

from medical.models import Doctor, DoctorPatient, MedicalCard, Patient, User, UserRole


@pytest.mark.django_db
def test_user_login_is_unique():
    User.objects.create(login="patient", role=UserRole.PATIENT)

    with pytest.raises(IntegrityError):
        User.objects.create(login="patient", role=UserRole.PATIENT)


@pytest.mark.django_db
def test_doctor_patient_pair_is_unique():
    patient_user = User.objects.create(login="patient", role=UserRole.PATIENT)
    doctor_user = User.objects.create(login="doctor", role=UserRole.DOCTOR)
    patient = Patient.objects.create(user=patient_user, first_name="Anna", last_name="Ivanova")
    doctor = Doctor.objects.create(user=doctor_user, first_name="Petr", last_name="Petrov")

    DoctorPatient.objects.create(doctor=doctor, patient=patient)

    with pytest.raises(IntegrityError):
        DoctorPatient.objects.create(doctor=doctor, patient=patient)


@pytest.mark.django_db
def test_medical_card_number_is_unique():
    first_user = User.objects.create(login="patient-1", role=UserRole.PATIENT)
    second_user = User.objects.create(login="patient-2", role=UserRole.PATIENT)
    first_patient = Patient.objects.create(user=first_user, first_name="Anna", last_name="Ivanova")
    second_patient = Patient.objects.create(user=second_user, first_name="Maria", last_name="Sidorova")

    MedicalCard.objects.create(patient=first_patient, card_number="CARD-1")

    with pytest.raises(IntegrityError):
        MedicalCard.objects.create(patient=second_patient, card_number="CARD-1")
