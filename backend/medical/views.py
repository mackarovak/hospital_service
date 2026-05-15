import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from medical.deps import auth_required, role_required
from medical.models import User, UserRole
from medical.security import create_access_token


def _user_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "login": user.login,
        "role": user.role,
    }


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

    return JsonResponse(
        {
            "access_token": create_access_token(str(user.id), user.role),
            "token_type": "bearer",
            "user": _user_payload(user),
        }
    )


@require_GET
@auth_required
def me(request):
    user = request.current_user
    return JsonResponse(
        {
            **_user_payload(user),
            "is_active": user.is_active,
        }
    )


@require_GET
@role_required(UserRole.PATIENT)
def patient_check(request):
    return JsonResponse({"role": request.current_user.role})


@require_GET
@role_required(UserRole.DOCTOR)
def doctor_check(request):
    return JsonResponse({"role": request.current_user.role})
