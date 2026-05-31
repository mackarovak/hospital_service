# MedCat MVP Lite

Минимальная электронная медкарта пациента.

## Stack

- Backend: Python + Django
- Frontend: React + TypeScript + Tailwind CSS
- Database: PostgreSQL

## MVP Lite

- пациент смотрит и заполняет свою медкарту;
- врач смотрит своих пациентов;
- врач добавляет записи в медкарту.

## Локальный запуск

### Предварительные требования

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (для способа 1)

---

### Способ 1 — Docker Compose (рекомендуется)

Поднимает PostgreSQL 16, бэкенд на `http://localhost:8000` и фронтенд на `http://localhost:5173`. Миграции и seed выполняются автоматически.

```bash
docker compose up
```

---

### Способ 2 — Вручную (SQLite, без Docker)

**Backend** (терминал 1):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python scripts/seed.py
python manage.py runserver      # http://localhost:8000
```

**Frontend** (терминал 2):

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

---

### Демо-аккаунты

После seed оба способа создают одинаковых пользователей:

| Логин | Пароль | Роль |
|-------|--------|------|
| `patient1` | `password` | Пациент |
| `doctor1` | `password` | Врач |

---

### Переменные окружения

Скопируйте `.env.example` в `.env` в корне репозитория и при необходимости измените значения.

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `DJANGO_DEBUG` | `False` | Включить debug-режим |
| `DJANGO_SECRET_KEY` | авто в debug | Django signing key |
| `JWT_SECRET` | авто в debug | Секрет для JWT-токенов |
| `DATABASE_ENGINE` | `sqlite3` | Установить `postgres` для PostgreSQL |
| `POSTGRES_DB` | `medcat` | Имя базы данных |
| `POSTGRES_USER` | `medcat` | Пользователь БД |
| `POSTGRES_PASSWORD` | `medcat_password` | Пароль БД |
| `POSTGRES_HOST` | `localhost` | Хост БД |
| `POSTGRES_PORT` | `5432` | Порт БД |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin для фронтенда |

В dev-режиме (`DJANGO_DEBUG=True`) `DJANGO_SECRET_KEY` и `JWT_SECRET` генерируются автоматически — файл `.env` не обязателен.

---

### Тесты

```bash
cd backend
pytest
```

---

### Логи и Grafana

`docker compose up` также поднимает:

| Сервис | URL |
|--------|-----|
| Grafana | `http://localhost:3000` |
| Loki | `http://localhost:3100` |

Логин Grafana: `admin`, пароль: `admin`.

В Grafana уже настроен datasource `Loki` и dashboard `MedCat Logs`.
Promtail собирает stdout-логи контейнеров `backend` и `frontend`, а backend пишет request-логи вида:

```text
request method=GET path=/api/v1/health status=200 duration_ms=3
```

### Нагрузочный smoke-тест

Установите k6 и запустите короткий сценарий:

```bash
k6 run load-tests/medcat-smoke.js
```

Для проверки публичного стенда:

```bash
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-smoke.js
```

Более подробные сценарии лежат в `load-tests/README.md`:

```bash
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-read.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-workflow.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-stress.js
```

После запуска теста откройте Grafana и dashboard `MedCat Logs`.

Автоматический запуск read-нагрузки каждые 2 часа в Kubernetes:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml apply -k k8s/load-tests
```

Запустить такой же тест вручную вне расписания:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns create job --from=cronjob/medcat-k6-read medcat-k6-read-manual
```

Логи и графики этих запусков видны в Grafana в dashboard `MedCat Load Tests`.

Статус Kubernetes CronJob и связанных Jobs виден в dashboard `MedCat Kubernetes Jobs`:

```text
http://grafana-medcat-team1.213-165-209-28.nip.io/d/medcat-kubernetes-jobs/medcat-kubernetes-jobs
```

### Grafana и Loki в Kubernetes

Наблюдаемость можно поставить в текущий namespace `team-1-ns` отдельным kustomize-пакетом:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml apply -k k8s/observability
```

Grafana для команды доступна публично:

```text
http://grafana-medcat-team1.213-165-209-28.nip.io
```

Логин `admin`, пароль `medcat-team1-grafana`.

Если публичный Ingress недоступен, откройте ее через port-forward:

```bash
kubectl --kubeconfig /Users/ksenia/Downloads/kubeconfig-team-1.yaml -n team-1-ns port-forward svc/grafana 3000:3000
```

После этого Grafana будет доступна на `http://localhost:3000`.
