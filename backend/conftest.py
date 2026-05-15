import os

os.environ.setdefault("DJANGO_DEBUG", "True")
os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-insecure-secret-key")
os.environ.setdefault("JWT_SECRET", "test-only-insecure-jwt-secret")
