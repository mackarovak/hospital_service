# Пакет документов для защиты итогового проекта

## Основные документы

1. `01_subject.md` — предмет, границы и пользователи приложения;
2. `02_exploratory.md` — исследовательское тестирование;
3. `03_strategy_risks.md` — стратегия и риски;
4. `04_test_cases.md` — тест-кейсы;
5. `04_checklist.md` — чек-лист;
6. `05_plan.md` — план тестирования;
7. `06_pmi.md` — программа и методика испытаний;
8. `07_test_report.md` — отчёт о тестировании;
9. `bug_report.md` — баг-репорт;
10. `09_traceability.csv` — матрица трассируемости;
11. `11_defect_tracker.csv` — таблица дефектов;
12. `12_demo_screencast_script.md` — сценарий скринкаста;
13. `13_final_results.md` — финальные фактические результаты;
14. `10_final_presentation_7min.md` — презентация ровно на 7 минут;
15. `14_testing_artifacts_catalog.md` — полный каталог тестовых артефактов и инструкция к защите.

## Команда запуска

```bash
cd /Users/ksenia/go/hospital/hospital_service
make test
```

Отдельные наборы:

```bash
make test-backend
make test-frontend
make test-load
```

## Перед защитой

- Сделать screenshot bug_report дефектов;
- Записать 3–5-минутный скринкаст;
- Показать backend 46/46 и frontend 4/4;
- Показать k6 p95=222.62 ms и 915 итераций;
- Экспортировать презентацию в PDF;
- Оставить таблицы test cases и defects в одном пакете.
