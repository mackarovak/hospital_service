import json
from typing import Optional

from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods

from medical.deps import role_required
from medical.models import Doctor, DoctorPatient, MedicalRecord, Patient, UserRole
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
    return Doctor.objects.get(user=request.current_user)


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
