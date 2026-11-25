# Тесты проекта MedCat

## Быстрый запуск всех тестов

Из корня проекта достаточно одной команды:

```bash
make test
```

Команда `make test` запускает backend pytest, frontend Vitest и k6 smoke-тест. Playwright отключён из-за продолжительной загрузки Docker-образа.

Отдельные наборы:

```bash
make test-backend
make test-frontend
make test-load
```

## Уровни тестирования

| Уровень | Назначение | Место |
| --- | --- | --- |
| Unit | Быстрые чистые проверки моделей, сервисов и компонентов | `backend/tests/unit`, `frontend/tests/unit` |
| Integration | Django ORM, auth-сессии и взаимодействие сервисов | `backend/tests/integration` |
| API | HTTP-контракты backend | `backend/tests/api` |
| UI | Поведение React-страниц и компонентов | `frontend/tests/ui` |
| E2E | Полный HTTP-сценарий с реальным API-клиентом | `backend/tests/e2e` |
| Load | Smoke, read, workflow и stress-нагрузка через k6 | `load-tests` |

## Backend

Запуск внутри Docker:

```bash
docker compose exec backend python -m pytest -v
```

Запуск по уровням:

```bash
docker compose exec backend python -m pytest -v -m unit
docker compose exec backend python -m pytest -v -m integration
docker compose exec backend python -m pytest -v -m api
docker compose exec backend python -m pytest -v -m e2e
```

Локальный запуск:

```bash
cd backend
python -m pytest -v
```

Кеш pytest хранится в `backend/.pytest_cache/`. Очистить его:

```bash
cd backend
python -m pytest --cache-clear
```

## Frontend

Установить тестовые зависимости и запустить:

```bash
cd frontend
npm install
npm test
```

Режим наблюдения и покрытие:

```bash
npm run test:watch
npm run test:coverage
```

Дополнительно проверить сборку и lint:

```bash
npm run build
npm run lint
```

## k6 нагрузочные тесты

Локальный k6:

```bash
k6 run load-tests/medcat-smoke.js
k6 run load-tests/medcat-read.js
k6 run load-tests/medcat-workflow.js
k6 run load-tests/medcat-stress.js
```

Через Docker:

```bash
BASE_URL=http://localhost docker run --rm --network host \
  -e BASE_URL=http://localhost \
  -v "$PWD/load-tests:/scripts" grafana/k6 run /scripts/medcat-smoke.js
```

Для другого стенда:

```bash
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-smoke.js
```
