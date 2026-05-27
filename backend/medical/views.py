import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from medical.deps import auth_required, role_required
from medical.models import Doctor, Patient, Specialization, User, UserRole
from medical.security import create_access_token


def _user_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "login": user.login,
        "role": user.role,
    }


def _auth_response(user: User) -> JsonResponse:
    return JsonResponse({
        "access_token": create_access_token(str(user.id), user.role),
        "token_type": "bearer",
        "user": _user_payload(user),
    })


@csrf_exempt
@require_POST
def login(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    login_value = payload.get("login")
    password = payload.get("password")

    if not login_value or not password:
        return JsonResponse({"detail": "Login and password are required"}, status=400)

    try:
        user = User.objects.get(login=login_value)
    except User.DoesNotExist:
        return JsonResponse({"detail": "Invalid login or password"}, status=401)

    if not user.is_active:
        return JsonResponse({"detail": "User is inactive"}, status=403)

    if not user.check_password(password):
        return JsonResponse({"detail": "Invalid login or password"}, status=401)

    return _auth_response(user)


@csrf_exempt
@require_POST
def register_patient(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    login_value = payload.get("login", "").strip()
    password = payload.get("password", "")
    first_name = payload.get("first_name", "").strip()
    last_name = payload.get("last_name", "").strip()

    if not all([login_value, password, first_name, last_name]):
        return JsonResponse(
            {"detail": "login, password, first_name, last_name are required"},
            status=400,
        )

    if User.objects.filter(login=login_value).exists():
        return JsonResponse({"detail": "Login already taken"}, status=400)

    user = User.objects.create_user(login_value, UserRole.PATIENT, password)
    Patient.objects.create(
        user=user,
        first_name=first_name,
        last_name=last_name,
        middle_name=payload.get("middle_name") or None,
    )

    return _auth_response(user)


@csrf_exempt
@require_POST
def register_doctor(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    login_value = payload.get("login", "").strip()
    password = payload.get("password", "")
    first_name = payload.get("first_name", "").strip()
    last_name = payload.get("last_name", "").strip()
    specialization_id = payload.get("specialization_id", "")

    if not all([login_value, password, first_name, last_name, specialization_id]):
        return JsonResponse(
            {"detail": "login, password, first_name, last_name, specialization_id are required"},
            status=400,
        )

    if User.objects.filter(login=login_value).exists():
        return JsonResponse({"detail": "Login already taken"}, status=400)

    try:
        specialization = Specialization.objects.get(id=specialization_id)
    except (Specialization.DoesNotExist, Exception):
        return JsonResponse({"detail": "Specialization not found"}, status=400)

    user = User.objects.create_user(login_value, UserRole.DOCTOR, password)
    Doctor.objects.create(
        user=user,
        first_name=first_name,
        last_name=last_name,
        middle_name=payload.get("middle_name") or None,
        specialization=specialization,
        office_number=payload.get("office_number") or None,
    )

    return _auth_response(user)


@require_GET
@auth_required
def me(request):
    user = request.current_user
    return JsonResponse({
        **_user_payload(user),
        "is_active": user.is_active,
    })


@require_GET
@role_required(UserRole.PATIENT)
def patient_check(request):
    return JsonResponse({"role": request.current_user.role})


@require_GET
@role_required(UserRole.DOCTOR)
def doctor_check(request):
    return JsonResponse({"role": request.current_user.role})


@require_GET
def specializations(request):
    specs = Specialization.objects.order_by("name")
    return JsonResponse(
        [{"id": str(s.id), "name": s.name} for s in specs],
        safe=False,
    )


@require_GET
def specialization_doctors(request, specialization_id):
    doctors = (
        Doctor.objects.select_related("specialization")
        .filter(specialization_id=specialization_id)
        .order_by("last_name", "first_name")
    )
    result = []
    for doctor in doctors:
        parts = [doctor.last_name, doctor.first_name, doctor.middle_name]
        full_name = " ".join(p for p in parts if p)
        result.append({
            "id": str(doctor.id),
            "full_name": full_name,
            "office_number": doctor.office_number,
            "specialization_name": doctor.specialization.name if doctor.specialization else None,
        })
    return JsonResponse(result, safe=False)
