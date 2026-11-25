.PHONY: test test-backend test-frontend test-load

# Единая быстрая команда для тестов проекта
test:
	./test-all.sh

test-backend:
	docker compose exec backend python -m pytest -q

test-frontend:
	docker compose run --rm frontend npm test -- --reporter=dot

test-load:
	docker compose --profile test run --rm k6-smoke
