from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path
from medical import views as medical_views


def health_check(request):
    return JsonResponse({"status": "ok"})


def database_health_check(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        database_status = cursor.fetchone()[0]

    return JsonResponse({"database": database_status})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health", health_check, name="health"),
    path("api/v1/health/db", database_health_check, name="database-health"),
    path("api/v1/auth/login", medical_views.login, name="auth-login"),
    path("api/v1/me", medical_views.me, name="me"),
    path("api/v1/patient/check", medical_views.patient_check, name="patient-check"),
    path("api/v1/doctor/check", medical_views.doctor_check, name="doctor-check"),
]
