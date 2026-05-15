from functools import wraps

from django.http import JsonResponse

from medical.models import User, UserRole
from medical.security import decode_access_token


def _error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"detail": message}, status=status)


def get_current_user(request) -> User:
    authorization = request.headers.get("Authorization", "")
    auth_type, _, token = authorization.partition(" ")

    if auth_type.lower() != "bearer" or not token:
        raise PermissionError("Authentication credentials were not provided")

    try:
        payload = decode_access_token(token)
        user_id = payload["sub"]
    except (KeyError, ValueError) as exc:
        raise PermissionError("Invalid authentication credentials") from exc

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist as exc:
        raise PermissionError("Invalid authentication credentials") from exc

    if not user.is_active:
        raise PermissionError("User is inactive")

    return user


def require_patient(user: User) -> User:
    if user.role != UserRole.PATIENT:
        raise PermissionError("Patient role is required")
    return user


def require_doctor(user: User) -> User:
    if user.role != UserRole.DOCTOR:
        raise PermissionError("Doctor role is required")
    return user


def auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            request.current_user = get_current_user(request)
        except PermissionError as exc:
            return _error(str(exc), status=401)

        return view_func(request, *args, **kwargs)

    return wrapper


def role_required(role: UserRole):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                user = get_current_user(request)
                request.current_user = require_patient(user) if role == UserRole.PATIENT else require_doctor(user)
            except PermissionError as exc:
                return _error(str(exc), status=403)

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
