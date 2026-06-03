# MedCat

MedCat - учебный сервис электронной медицинской карты и записи к врачу.

Проект покрывает два основных сценария:

- пациент ведет профиль, смотрит медкарту, подбирает специальность по симптомам и записывается на прием;
- врач смотрит своих пациентов, ведет медицинские записи и управляет расписанием.

Дополнительно в проект добавлены мониторинг, нагрузочные тесты, CI/CD и Kubernetes-манифесты.

## Stack

- Backend: Django, Django REST Framework
- Frontend: React, TypeScript, Tailwind CSS, Vite
- Database: PostgreSQL
- Auth: JWT
- Observability: Grafana, Loki, Promtail, Prometheus, kube-state-metrics
- Load tests: k6
- Deploy: Docker Compose, Kubernetes, GitHub Actions, GHCR

## Возможности

### Пациент

- регистрация и вход;
- просмотр личного кабинета;
- заполнение профиля;
- просмотр медицинской карты;
- печатная выписка из медкарты с сохранением в PDF через браузер;
- подбор специальности по симптомам без внешних AI/API;
- запись к врачу;
- просмотр и отмена своих записей.

### Врач

- регистрация и вход;
- просмотр кабинета врача;
- список пациентов с поиском;
- просмотр медкарты пациента;
- добавление и редактирование медицинских записей;
- управление свободными окнами приема.

### Подбор специальности по симптомам

Rule-based triage подбирает специальность по ключевым словам и возвращает:

- рекомендуемую специальность;
- уровень срочности;
- причину рекомендации;
- найденные совпавшие симптомы;
- предупреждение про экстренные случаи.

Поддерживаемые специальности:

- Терапевт
- Хирург
- Кардиолог
- Дерматолог
- Гастроэнтеролог
- Невролог
- ЛОР
- Офтальмолог
- Стоматолог
- Ортопед
- Уролог
- Гинеколог
- Эндокринолог
- Педиатр

## Локальный запуск

### Требования

- Docker + Docker Compose
- Python 3.11+
- Node.js 20+

### Docker Compose

Рекомендуемый способ запуска:

```bash
PUBLIC_HOST=localhost docker compose up -d --build
```

После запуска:

| Сервис | URL |
| --- | --- |
| Frontend | `http://localhost` |
| Backend API | `http://localhost:8000/api/v1` |
| Grafana | `http://localhost:3000` |
| Loki | `http://localhost:3100` |

Grafana локально:

```text
admin / admin
```

Проверка backend:

```bash
curl http://localhost:8000/api/v1/health
```

Остановить проект:

```bash
docker compose down
```

Остановить и удалить локальные volumes:

```bash
docker compose down -v
```

`down -v` удалит локальную PostgreSQL-базу и данные Grafana/Loki.

### Ручной запуск

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python scripts/seed.py
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Демо-аккаунты

Seed создает пользователей:

| Логин | Пароль | Роль |
| --- | --- | --- |
| `patient1` | `password` | Пациент |
| `doctor1` | `password` | Врач |

## Переменные окружения

Основные переменные:

| Переменная | Описание |
| --- | --- |
| `DJANGO_DEBUG` | Debug-режим Django |
| `DJANGO_SECRET_KEY` | Django secret key |
| `JWT_SECRET` | Секрет для JWT |
| `DATABASE_ENGINE` | `sqlite3` или `postgres` |
| `POSTGRES_DB` | Имя PostgreSQL-базы |
| `POSTGRES_USER` | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL |
| `POSTGRES_HOST` | Хост PostgreSQL |
| `POSTGRES_PORT` | Порт PostgreSQL |
| `FRONTEND_URL` | CORS origin frontend |
| `VITE_API_URL` | URL backend API для frontend |
| `PUBLIC_HOST` | Хост для локального Docker Compose |

В dev-режиме секреты могут быть тестовыми. Для production/stage их нужно задавать явно.

## Проверки

Backend tests:

```bash
cd backend
pytest
```

Frontend build:

```bash
cd frontend
npm run build
```

Из корня проекта:

```bash
npm --prefix frontend run build
```

Kubernetes manifests:

```bash
kubectl kustomize k8s
kubectl kustomize k8s/observability
kubectl kustomize k8s/load-tests
```

## CI/CD

В проекте есть GitHub Actions.

### Pull Request CI

`.github/workflows/ci.yml` запускается на PR в `main` и проверяет:

- backend tests;
- frontend build;
- Docker build backend image;
- Docker build frontend image.

### Publish images

`.github/workflows/publish-images.yml` запускается на push в `main` и вручную через `workflow_dispatch`.

Workflow:

1. запускает backend tests;
2. собирает frontend;
3. собирает Docker images;
4. публикует images в GHCR:
   - `ghcr.io/mackarovak/hospital_service-backend:latest`
   - `ghcr.io/mackarovak/hospital_service-frontend:latest`
5. при наличии secret `KUBECONFIG_TEAM_1` перезапускает Kubernetes deployments:
   - `medcat-backend`
   - `medcat-frontend`

## Kubernetes

Основной стенд:

```text
http://medcat-team1.213-165-209-28.nip.io
```

Применить основные манифесты:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml apply -k k8s
```

Перезапустить приложение:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns rollout restart deployment/medcat-backend
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns rollout restart deployment/medcat-frontend
```

Проверить rollout:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns rollout status deployment/medcat-backend
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns rollout status deployment/medcat-frontend
```

## Observability

Локально observability поднимается через `docker compose up`.

В Kubernetes:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml apply -k k8s/observability
```

Публичная Grafana:

```text
http://grafana-medcat-team1.213-165-209-28.nip.io
```

Логин:

```text
admin / medcat-team1-grafana
```

Dashboards:

- `MedCat Logs` - логи backend/frontend и k6;
- `MedCat Load Tests` - k6 runs, problems, p95, request rate, 5xx logs;
- `MedCat Kubernetes Jobs` - CronJob, active jobs, succeeded/failed jobs.

Backend пишет request-логи:

```text
request method=GET path=/api/v1/health status=200 duration_ms=3
```

## Load tests

Локальные сценарии лежат в `load-tests/`.

Smoke test:

```bash
k6 run load-tests/medcat-smoke.js
```

Публичный стенд:

```bash
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-read.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-workflow.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-stress.js
```

Kubernetes CronJob запускает read-нагрузку каждые 2 часа:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml apply -k k8s/load-tests
```

Запустить вручную:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns create job --from=cronjob/medcat-k6-read medcat-k6-read-manual
```

Статус CronJob:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns get cronjob medcat-k6-read
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns get jobs
```

## Структура проекта

```text
backend/                Django backend
frontend/               React frontend
k8s/                    Kubernetes manifests
k8s/observability/      Grafana, Loki, Promtail, Prometheus, kube-state-metrics
k8s/load-tests/         k6 CronJob
load-tests/             local k6 scenarios
monitoring/             local Grafana/Loki/Promtail config
.github/workflows/      CI/CD workflows
```
