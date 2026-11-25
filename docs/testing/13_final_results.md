# Финальные результаты тестового цикла

Дата: 25.11.2026.
Среда: Docker Compose, локальный стенд.

## Результаты автоматических наборов

| Набор | Результат | Детали |
|---|---|---|
| Backend pytest | 46/46 Passed | 22.11 s |
| Frontend Vitest | 4/4 Passed | 956 ms |
| k6 smoke | Thresholds Passed | 915 итераций, p95=222.62 ms, fail rate=0.10% |

## k6 smoke подробности

- max VUs: 20;
- total requests: 2745;
- succeeded checks: 2742;
- failed checks: 3;
- failed checks: по одному сбою в health, specializations и login;
- http_req_failed: 0.10%;
- p95: 222.62 ms; порог `<800 ms` Passed.

## Исследовательские дефекты

- DEF-001: пробельные обязательные поля;
- DEF-002: пересекающиеся слоты;
- DEF-003: бронирование прошедшего slot;
- OBS-001: единичные k6 failed-check в smoke-прогоне.

## Принятое решение

Backend и frontend unit/API-наборы закрыты успешно. k6 thresholdы прошли, однако один failed-check в каждой из трех smoke-групп требует повторного smoke-прогона. Playwright не включается в финальную автоматизацию из-за ненужной тяжёлой загрузки и неидеальной воспроизводимости Docker-образа в данном стенде.

Для защиты достаточно показать pytest, Vitest, k6, ручной exploratory/UI прогон и оформленные артефакты.
