# Backend ready (GCP)

The API is deployed and healthy.

**Base URL:** `https://systemquest-api-600847459204.us-central1.run.app`

**Health check:** [https://systemquest-api-600847459204.us-central1.run.app/health](https://systemquest-api-600847459204.us-central1.run.app/health)

**API base for frontend:** `https://systemquest-api-600847459204.us-central1.run.app/api`  
(Use this as `VITE_API_URL` in Vercel.)

## Before going to production

1. **CORS:** In Cloud Run → systemquest-api → Edit → Variables & secrets, set `CORS_ORIGIN` to your Vercel URL (e.g. `https://your-app.vercel.app`). You can add multiple origins comma-separated.
2. **JWT secrets:** Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with strong random values (e.g. `openssl rand -base64 32`) in the same env vars.

## Start/stop (cost control)

```bash
./scripts/gcp-instances.sh stop   # turn off DB + backend
./scripts/gcp-instances.sh start  # turn on again
```

## Apply schema changes (after Prisma changes)

```bash
gcloud run jobs execute systemquest-db-push --region=us-central1 --project=system-quest
```
