import pytest
from django.test import Client


def test_health_check():
    client = Client()

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
def test_database_health_check_uses_configured_database():
    client = Client()

    response = client.get("/api/v1/health/db")

    assert response.status_code == 200
    assert response.json() == {"database": 1}
