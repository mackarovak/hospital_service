from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path
from medical import doctor_views
from medical import patient_views
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
    path("api/v1/patient/medical-card", patient_views.medical_card, name="patient-medical-card"),
    path("api/v1/patient/profile", patient_views.update_profile, name="patient-profile"),
    path("api/v1/doctor/patients", doctor_views.patients, name="doctor-patients"),
    path(
        "api/v1/doctor/patients/<uuid:patient_id>/medical-card",
        doctor_views.patient_medical_card,
        name="doctor-patient-medical-card",
    ),
    path(
        "api/v1/doctor/patients/<uuid:patient_id>/medical-records",
        doctor_views.create_medical_record,
        name="doctor-create-medical-record",
    ),
    path(
        "api/v1/doctor/medical-records/<uuid:record_id>",
        doctor_views.update_medical_record,
        name="doctor-update-medical-record",
    ),
]
