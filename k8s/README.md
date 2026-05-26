# MedCat Kubernetes deployment

These manifests deploy the MVP Lite stack into `team-1-ns`:

- PostgreSQL 16
- Django backend
- Vite React frontend
- public Ingress at `http://medcat-team1.213-165-209-28.nip.io`

Images are published to GitHub Container Registry by
`.github/workflows/publish-images.yml`:

- `ghcr.io/mackarovak/hospital_service-backend:latest`
- `ghcr.io/mackarovak/hospital_service-frontend:latest`

```bash
kubectl --kubeconfig /path/to/kubeconfig apply -k k8s
```

Check:

```bash
kubectl --kubeconfig /path/to/kubeconfig -n team-1-ns get pods,svc,ingress
curl http://medcat-team1.213-165-209-28.nip.io/api/v1/health
```
