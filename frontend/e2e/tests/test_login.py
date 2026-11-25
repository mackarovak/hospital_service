import pytest


@pytest.mark.smoke
@pytest.mark.ui
def test_login_page_is_available(page, base_url):
    page.goto(base_url)

    page.wait_for_url("**/login")
    assert page.get_by_role("heading", name="MedCat").is_visible()
    assert page.get_by_label("Логин").is_visible()
    assert page.get_by_label("Пароль").is_visible()


@pytest.mark.ui
def test_patient_can_login(page, base_url):
    page.goto(f"{base_url}/login")

    page.get_by_label("Логин").fill("patient1")
    page.get_by_label("Пароль").fill("password")
    page.get_by_role("button", name="Войти").click()

    page.wait_for_url("**/patient")
    assert page.evaluate("localStorage.getItem('access_token')")
    assert page.evaluate("localStorage.getItem('user_role')") == "PATIENT"


@pytest.mark.ui
def test_invalid_password_shows_error(page, base_url):
    page.goto(f"{base_url}/login")

    page.get_by_label("Логин").fill("patient1")
    page.get_by_label("Пароль").fill("wrong-password")
    page.get_by_role("button", name="Войти").click()

    assert page.get_by_text("Не удалось войти").is_visible()


@pytest.mark.ui
def test_doctor_can_login(page, base_url):
    page.goto(f"{base_url}/login")

    page.get_by_label("Логин").fill("doctor1")
    page.get_by_label("Пароль").fill("password")
    page.get_by_role("button", name="Войти").click()

    page.wait_for_url("**/doctor")
    assert page.evaluate("localStorage.getItem('access_token')")
    assert page.evaluate("localStorage.getItem('user_role')") == "DOCTOR"
