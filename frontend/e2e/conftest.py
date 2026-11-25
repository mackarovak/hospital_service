import os

import pytest


@pytest.fixture(scope="session")
def base_url():
    return os.getenv("BASE_URL", "http://frontend:5173")


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {
        **browser_context_args,
        "locale": "ru-RU",
        "timezone_id": "Europe/Moscow",
    }
