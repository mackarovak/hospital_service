import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
from django.test import Client

django.setup()


def test_health_check():
    client = Client()

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_health_check_uses_configured_database():
    client = Client()

    response = client.get("/api/v1/health/db")

    assert response.status_code == 200
    assert response.json() == {"database": 1}
