#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

PUBLIC_HOST=localhost docker compose up -d db backend frontend >/dev/null

printf '\nBackend pytest\n'
docker compose exec -T backend python -m pytest -q

printf '\nFrontend Vitest\n'
docker compose run --rm frontend npm test -- --reporter=dot

printf '\nk6 smoke\n'
docker compose --profile test run --rm k6-smoke

printf '\nALL TESTS COMPLETED\n'
