from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path


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
]
