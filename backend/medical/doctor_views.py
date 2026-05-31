import json
from datetime import datetime
from typing import Optional

from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from medical.deps import role_required
from medical.models import AppointmentSlot, Doctor, DoctorPatient, MedicalRecord, Patient, UserRole
from medical.patient_views import _record_payload


RECORD_FIELDS = {
    "complaints",
    "examination_result",
    "diagnosis_text",
    "treatment_text",
}


def _patient_full_name(patient: Patient) -> str:
    parts = [patient.last_name, patient.first_name, patient.middle_name]
    return " ".join(part for part in parts if part)


def _medical_card_payload(patient: Patient) -> dict:
    medical_card = patient.medical_card
    return {
        "id": str(medical_card.id),
        "card_number": medical_card.card_number,
        "status": medical_card.status,
    }


def _doctor_payload(doctor: Doctor) -> dict:
    parts = [doctor.last_name, doctor.first_name, doctor.middle_name]
    return {
        "id": str(doctor.id),
        "full_name": " ".join(part for part in parts if part),
        "specialization": doctor.specialization.name if doctor.specialization else None,
        "office_number": doctor.office_number,
    }


def _doctor_patient_payload(patient: Patient) -> dict:
    return {
        "id": str(patient.id),
        "full_name": _patient_full_name(patient),
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "card_number": patient.medical_card.card_number,
    }


def _doctor_medical_card_patient_payload(patient: Patient) -> dict:
    return {
        "id": str(patient.id),
        "full_name": _patient_full_name(patient),
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "gender": patient.gender,
        "phone": patient.phone,
        "allergies": patient.allergies,
        "chronic_conditions": patient.chronic_conditions,
    }


def _record_response(record: MedicalRecord) -> dict:
    return {
        "id": str(record.id),
        "medical_card_id": str(record.medical_card_id),
        "doctor_id": str(record.doctor_id),
        "record_date": record.record_date.isoformat(),
        "complaints": record.complaints,
        "examination_result": record.examination_result,
        "diagnosis_text": record.diagnosis_text,
        "treatment_text": record.treatment_text,
    }


def _get_current_doctor(request) -> Doctor:
    return Doctor.objects.select_related("specialization").get(user=request.current_user)


def _get_linked_patient_or_error(doctor: Doctor, patient_id: str):
    try:
        patient = Patient.objects.select_related("medical_card").get(id=patient_id)
    except (Patient.DoesNotExist, ValueError):
        return None, JsonResponse({"detail": "Patient not found"}, status=404)

    if not DoctorPatient.objects.filter(doctor=doctor, patient=patient).exists():
        return None, JsonResponse({"detail": "Patient is not linked to doctor"}, status=403)

    return patient, None


def _parse_positive_int(value: str, default: int, maximum: Optional[int] = None) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    parsed = max(parsed, 1)
    return min(parsed, maximum) if maximum else parsed


@require_GET
@role_required(UserRole.DOCTOR)
def patients(request):
    doctor = _get_current_doctor(request)
    query = request.GET.get("query", "").strip()
    page = _parse_positive_int(request.GET.get("page"), default=1)
    limit = _parse_positive_int(request.GET.get("limit"), default=20, maximum=100)

    queryset = Patient.objects.select_related("medical_card").filter(doctor_links__doctor=doctor)
    if query:
        queryset = queryset.filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(middle_name__icontains=query)
            | Q(medical_card__card_number__icontains=query)
        )

    queryset = queryset.order_by("last_name", "first_name", "middle_name").distinct()
    total = queryset.count()
    offset = (page - 1) * limit
    items = queryset[offset : offset + limit]

    return JsonResponse(
        {
            "doctor": _doctor_payload(doctor),
            "items": [_doctor_patient_payload(patient) for patient in items],
            "page": page,
            "limit": limit,
            "total": total,
        }
    )


@require_GET
@role_required(UserRole.DOCTOR)
def patient_medical_card(request, patient_id):
    doctor = _get_current_doctor(request)
    patient, error = _get_linked_patient_or_error(doctor, patient_id)
    if error:
        return error

    records = (
        MedicalRecord.objects.select_related("doctor")
        .filter(medical_card=patient.medical_card)
        .order_by("-record_date")
    )

    return JsonResponse(
        {
            "current_doctor": _doctor_payload(doctor),
            "patient": _doctor_medical_card_patient_payload(patient),
            "medical_card": _medical_card_payload(patient),
            "records": [_record_payload(record) for record in records],
        }
    )


@csrf_exempt
@require_POST
@role_required(UserRole.DOCTOR)
def create_medical_record(request, patient_id):
    doctor = _get_current_doctor(request)
    patient, error = _get_linked_patient_or_error(doctor, patient_id)
    if error:
        return error

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    record = MedicalRecord.objects.create(
        medical_card=patient.medical_card,
        doctor=doctor,
        **{field: payload.get(field) for field in RECORD_FIELDS},
    )

    return JsonResponse(_record_response(record), status=201)


@csrf_exempt
@require_http_methods(["PATCH"])
@role_required(UserRole.DOCTOR)
def update_medical_record(request, record_id):
    doctor = _get_current_doctor(request)
    try:
        record = MedicalRecord.objects.select_related("medical_card__patient").get(id=record_id)
    except (MedicalRecord.DoesNotExist, ValueError):
        return JsonResponse({"detail": "Medical record not found"}, status=404)

    if record.doctor_id != doctor.id:
        return JsonResponse({"detail": "Only author can edit medical record"}, status=403)

    if not DoctorPatient.objects.filter(doctor=doctor, patient=record.medical_card.patient).exists():
        return JsonResponse({"detail": "Patient is not linked to doctor"}, status=403)

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    update_fields = []
    for field in RECORD_FIELDS:
        if field in payload:
            setattr(record, field, payload[field])
            update_fields.append(field)

    if update_fields:
        record.save(update_fields=[*update_fields, "updated_at"])

    return JsonResponse(_record_response(record))


def _slot_payload(slot: AppointmentSlot) -> dict:
    patient_data = None
    if slot.patient_id:
        p = slot.patient
        parts = [p.last_name, p.first_name, p.middle_name]
        patient_data = {"id": str(p.id), "full_name": " ".join(x for x in parts if x)}
    return {
        "id": str(slot.id),
        "starts_at": slot.starts_at.isoformat(),
        "ends_at": slot.ends_at.isoformat(),
        "patient": patient_data,
    }


@csrf_exempt
@role_required(UserRole.DOCTOR)
def manage_slots(request):
    doctor = _get_current_doctor(request)

    if request.method == "GET":
        qs = AppointmentSlot.objects.select_related("patient").filter(doctor=doctor)
        from_date = request.GET.get("from")
        to_date = request.GET.get("to")
        if from_date:
            qs = qs.filter(starts_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(starts_at__date__lte=to_date)
        return JsonResponse([_slot_payload(s) for s in qs], safe=False)

    if request.method == "POST":
        try:
            payload = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        starts_raw = payload.get("starts_at", "")
        ends_raw = payload.get("ends_at", "")
        if not starts_raw or not ends_raw:
            return JsonResponse({"detail": "starts_at and ends_at are required"}, status=400)

        try:
            starts_at = datetime.fromisoformat(starts_raw)
            ends_at = datetime.fromisoformat(ends_raw)
        except ValueError:
            return JsonResponse({"detail": "Invalid datetime format, use ISO 8601"}, status=400)

        if timezone.is_naive(starts_at):
            starts_at = timezone.make_aware(starts_at)
        if timezone.is_naive(ends_at):
            ends_at = timezone.make_aware(ends_at)

        if starts_at >= ends_at:
            return JsonResponse({"detail": "starts_at must be before ends_at"}, status=400)
        if starts_at <= timezone.now():
            return JsonResponse({"detail": "starts_at must be in the future"}, status=400)

        slot = AppointmentSlot.objects.create(doctor=doctor, starts_at=starts_at, ends_at=ends_at)
        return JsonResponse(_slot_payload(slot), status=201)

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
@role_required(UserRole.DOCTOR)
def delete_slot(request, slot_id):
    if request.method != "DELETE":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    doctor = _get_current_doctor(request)

    try:
        slot = AppointmentSlot.objects.get(id=slot_id)
    except AppointmentSlot.DoesNotExist:
        return JsonResponse({"detail": "Slot not found"}, status=404)

    if slot.doctor_id != doctor.id:
        return JsonResponse({"detail": "This slot does not belong to you"}, status=403)

    if slot.patient_id is not None:
        return JsonResponse({"detail": "Cannot delete a booked slot"}, status=409)

    slot.delete()
    return JsonResponse({}, status=204)
