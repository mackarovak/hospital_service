import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserRole(models.TextChoices):
    PATIENT = "PATIENT", "Patient"
    DOCTOR = "DOCTOR", "Doctor"


class MedicalCardStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    ARCHIVED = "ARCHIVED", "Archived"


class Gender(models.TextChoices):
    MALE = "MALE", "Мужской"
    FEMALE = "FEMALE", "Женский"
    OTHER = "OTHER", "Другой"


class BloodType(models.TextChoices):
    A_PLUS = "A+", "A+"
    A_MINUS = "A-", "A-"
    B_PLUS = "B+", "B+"
    B_MINUS = "B-", "B-"
    AB_PLUS = "AB+", "AB+"
    AB_MINUS = "AB-", "AB-"
    O_PLUS = "O+", "O+"
    O_MINUS = "O-", "O-"
    UNKNOWN = "UNKNOWN", "Не определена"


class UserManager(BaseUserManager):
    def create_user(self, login, role, raw_password, **extra_fields):
        user = self.model(login=login, role=role, **extra_fields)
        user.set_password(raw_password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.DOCTOR)
        extra_fields.setdefault("is_active", True)
        role = extra_fields.pop("role")
        return self.create_user(login, role, password, **extra_fields)


class User(AbstractBaseUser, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    login = models.CharField(max_length=100, unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = "login"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.login

    @property
    def is_staff(self):
        return False

    def set_password(self, raw_password):
        from medical.security import hash_password
        self.password = hash_password(raw_password) if raw_password else "!"

    def check_password(self, raw_password):
        try:
            from medical.security import verify_password
            return verify_password(raw_password, self.password)
        except Exception:
            return False

    def save(self, *args, **kwargs):
        if not self.password:
            self.set_unusable_password()
        super().save(*args, **kwargs)


class Patient(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    blood_type = models.CharField(max_length=10, choices=BloodType.choices, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    chronic_conditions = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "patients"

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class Doctor(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    office_number = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "doctors"

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class DoctorPatient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="patient_links")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="doctor_links")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "doctor_patients"
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "patient"],
                name="unique_doctor_patient",
            ),
        ]

    def __str__(self):
        return f"{self.doctor_id} -> {self.patient_id}"


class MedicalCard(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name="medical_card")
    card_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(
        max_length=20,
        choices=MedicalCardStatus.choices,
        default=MedicalCardStatus.ACTIVE,
    )

    class Meta:
        db_table = "medical_cards"

    def __str__(self):
        return self.card_number


class MedicalRecord(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_card = models.ForeignKey(MedicalCard, on_delete=models.CASCADE, related_name="records")
    doctor = models.ForeignKey(Doctor, on_delete=models.PROTECT, related_name="medical_records")
    record_date = models.DateTimeField(default=timezone.now)
    complaints = models.TextField(blank=True, null=True)
    examination_result = models.TextField(blank=True, null=True)
    diagnosis_text = models.TextField(blank=True, null=True)
    treatment_text = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "medical_records"
        ordering = ["-record_date"]

    def __str__(self):
        return f"{self.medical_card_id} / {self.record_date:%Y-%m-%d}"
