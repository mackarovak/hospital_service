import os
import pytest

os.environ.setdefault("DJANGO_DEBUG", "True")
os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-insecure-secret-key")
os.environ.setdefault("JWT_SECRET", "test-only-insecure-jwt-secret")
os.environ.setdefault("DATABASE_ENGINE", "sqlite")


def pytest_collection_modifyitems(items):
    for item in items:
        node_path = str(item.fspath).replace("\\", "/")
        for suite in ("unit", "integration", "api", "e2e"):
            if f"/tests/{suite}/" in node_path:
                item.add_marker(getattr(pytest.mark, suite))
                break
