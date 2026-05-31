# MedCat load tests

These k6 scenarios generate traffic for the public stand and for Grafana/Loki checks.

## Scenarios

| File | Purpose |
|------|---------|
| `medcat-smoke.js` | Quick availability check |
| `medcat-read.js` | Regular read-heavy API load |
| `medcat-workflow.js` | Mixed patient and doctor journeys |
| `medcat-stress.js` | Gradually increasing stress test |

## Public stand

```bash
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-smoke.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-read.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-workflow.js
BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-stress.js
```

## Docker without local k6

Run from the repository root:

```bash
docker run --rm \
  -e BASE_URL=http://medcat-team1.213-165-209-28.nip.io \
  -v "$PWD/load-tests:/scripts" \
  grafana/k6 run /scripts/medcat-read.js
```

## Useful overrides

```bash
DURATION=5m PATIENT_VUS=15 DOCTOR_VUS=5 BASE_URL=http://medcat-team1.213-165-209-28.nip.io k6 run load-tests/medcat-workflow.js
```

## Grafana queries

Backend logs:

```logql
{namespace="team-1-ns", filename=~".*medcat-backend.*"}
```

HTTP 5xx logs:

```logql
{namespace="team-1-ns", filename=~".*medcat-backend.*"} |= " 5"
```

