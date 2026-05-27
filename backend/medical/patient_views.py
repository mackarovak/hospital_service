import json
from datetime import date

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from medical.deps import role_required
from medical.models import AppointmentSlot, MedicalRecord, Patient, UserRole


PROFILE_FIELDS = {
    "first_name",
    "last_name",
    "middle_name",
    "date_of_birth",
    "gender",
    "phone",
    "address",
    "blood_type",
    "allergies",
    "chronic_conditions",
}


def _patient_payload(patient: Patient) -> dict:
    return {
        "id": str(patient.id),
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "middle_name": patient.middle_name,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "gender": patient.gender,
        "phone": patient.phone,
        "address": patient.address,
        "blood_type": patient.blood_type,
        "allergies": patient.allergies,
        "chronic_conditions": patient.chronic_conditions,
    }


def _medical_card_payload(patient: Patient) -> dict:
    medical_card = patient.medical_card
    return {
        "id": str(medical_card.id),
        "card_number": medical_card.card_number,
        "status": medical_card.status,
    }


def _doctor_full_name(record: MedicalRecord) -> str:
    doctor = record.doctor
    parts = [doctor.last_name, doctor.first_name, doctor.middle_name]
    return " ".join(part for part in parts if part)


def _record_payload(record: MedicalRecord) -> dict:
    return {
        "id": str(record.id),
        "record_date": record.record_date.isoformat(),
        "doctor_full_name": _doctor_full_name(record),
        "complaints": record.complaints,
        "examination_result": record.examination_result,
        "diagnosis_text": record.diagnosis_text,
        "treatment_text": record.treatment_text,
    }


def _slot_doctor_payload(slot: AppointmentSlot) -> dict:
    doctor = slot.doctor
    parts = [doctor.last_name, doctor.first_name, doctor.middle_name]
    full_name = " ".join(p for p in parts if p)
    return {
        "id": str(doctor.id),
        "full_name": full_name,
        "office_number": doctor.office_number,
        "specialization_name": doctor.specialization.name if doctor.specialization else None,
    }


def _appointment_payload(slot: AppointmentSlot) -> dict:
    return {
        "id": str(slot.id),
        "starts_at": slot.starts_at.isoformat(),
        "ends_at": slot.ends_at.isoformat(),
        "doctor": _slot_doctor_payload(slot),
    }


def _validate_profile_payload(payload: dict) -> dict:
    errors = {}

    for field in ("first_name", "last_name"):
        if field in payload and payload[field] is not None and len(payload[field]) > 100:
            errors[field] = "Must be 100 characters or fewer"

    if "phone" in payload and payload["phone"] is not None and len(payload["phone"]) > 30:
        errors["phone"] = "Must be 30 characters or fewer"

    if "blood_type" in payload and payload["blood_type"] is not None and len(payload["blood_type"]) > 10:
        errors["blood_type"] = "Must be 10 characters or fewer"

    if "date_of_birth" in payload and payload["date_of_birth"]:
        try:
            parsed_date = date.fromisoformat(payload["date_of_birth"])
        except ValueError:
            errors["date_of_birth"] = "Must be a valid ISO date"
        else:
            if parsed_date > date.today():
                errors["date_of_birth"] = "Must not be in the future"
            payload["date_of_birth"] = parsed_date

    return errors


@require_GET
@role_required(UserRole.PATIENT)
def medical_card(request):
    patient = Patient.objects.select_related("medical_card").get(user=request.current_user)
    records = (
        MedicalRecord.objects.select_related("doctor")
        .filter(medical_card=patient.medical_card)
        .order_by("-record_date")
    )

    return JsonResponse(
        {
            "patient": _patient_payload(patient),
            "medical_card": _medical_card_payload(patient),
            "records": [_record_payload(record) for record in records],
        }
    )


@csrf_exempt
@require_http_methods(["PATCH"])
@role_required(UserRole.PATIENT)
def update_profile(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    allowed_payload = {
        field: value
        for field, value in payload.items()
        if field in PROFILE_FIELDS
    }
    errors = _validate_profile_payload(allowed_payload)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    patient = Patient.objects.get(user=request.current_user)
    for field, value in allowed_payload.items():
        setattr(patient, field, value)
    patient.save(update_fields=[*allowed_payload.keys(), "updated_at"] if allowed_payload else ["updated_at"])

    return JsonResponse({"patient": _patient_payload(patient)})


@require_GET
@role_required(UserRole.PATIENT)
def doctor_slots(request, doctor_id):
    slots = (
        AppointmentSlot.objects
        .filter(doctor_id=doctor_id, patient__isnull=True, starts_at__gt=timezone.now())
        .order_by("starts_at")
    )
    return JsonResponse(
        [{"id": str(s.id), "starts_at": s.starts_at.isoformat(), "ends_at": s.ends_at.isoformat()} for s in slots],
        safe=False,
    )


@csrf_exempt
@role_required(UserRole.PATIENT)
def book_slot(request, slot_id):
    patient = Patient.objects.get(user=request.current_user)

    if request.method == "POST":
        rows = AppointmentSlot.objects.filter(id=slot_id, patient__isnull=True).update(patient=patient)
        if rows == 0:
            return JsonResponse({"detail": "Slot is already booked or does not exist"}, status=409)

        slot = (
            AppointmentSlot.objects
            .select_related("doctor__specialization")
            .get(id=slot_id)
        )
        return JsonResponse(_appointment_payload(slot))

    if request.method == "DELETE":
        try:
            slot = AppointmentSlot.objects.get(id=slot_id)
        except AppointmentSlot.DoesNotExist:
            return JsonResponse({"detail": "Slot not found"}, status=404)

        if slot.patient_id != patient.id:
            return JsonResponse({"detail": "This slot does not belong to you"}, status=403)

        AppointmentSlot.objects.filter(id=slot_id).update(patient=None)
        return JsonResponse({}, status=204)

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@require_GET
@role_required(UserRole.PATIENT)
def my_appointments(request):
    patient = Patient.objects.get(user=request.current_user)
    slots = (
        AppointmentSlot.objects
        .select_related("doctor__specialization")
        .filter(patient=patient)
        .order_by("starts_at")
    )
    return JsonResponse(
        [_appointment_payload(s) for s in slots],
        safe=False,
    )
