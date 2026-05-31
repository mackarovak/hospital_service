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
