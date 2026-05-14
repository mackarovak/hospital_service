# Task 01 — Project Setup

## Описание

Создать базовую структуру проекта **MedCat MVP Lite**.

---

## Что нужно сделать

### 1. Создать директорию проекта

```bash
mkdir medcat
cd medcat
```

---

### 2. Создать структуру

```bash
mkdir backend frontend docs scripts
touch README.md
touch .gitignore
touch .env.example
```

Итоговая структура:

```text
medcat/
  backend/
  frontend/
  docs/
  scripts/
  README.md
  .gitignore
  .env.example
```

---

### 3. `.gitignore`

```gitignore
# Python
__pycache__/
*.pyc
.venv/
.env

# Node
node_modules/
dist/
.vite/

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Logs
*.log
```

---

### 4. `.env.example`

```env
POSTGRES_DB=medcat
POSTGRES_USER=medcat
POSTGRES_PASSWORD=medcat_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

JWT_SECRET=change_me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

VITE_API_URL=http://localhost:8000/api/v1
```

---

### 5. `README.md`

```md
# MedCat MVP Lite

Минимальная электронная медкарта пациента.

## Stack

- Backend: Python + FastAPI
- Frontend: React + TypeScript + Tailwind CSS
- Database: PostgreSQL

## MVP Lite

- пациент смотрит и заполняет свою медкарту;
- врач смотрит своих пациентов;
- врач добавляет записи в медкарту.
```

---

## Definition of Done

- [x] Создана структура проекта
- [x] Есть `README.md`
- [x] Есть `.gitignore`
- [x] Есть `.env.example`
- [x] Проект готов к разработке backend и frontend

---

## Зависимости

Нет. Это первая задача.
