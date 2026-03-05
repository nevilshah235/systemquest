# Backend ready (GCP)

The API is deployed and healthy.

> **Never commit:** `.env.local`, `.deploy-credentials.txt`, `.db-app-pw.txt`, or any file with real passwords, API keys, or JWT secrets.

**Base URL:** `https://systemquest-api-600847459204.us-central1.run.app`

**Health check:** [https://systemquest-api-600847459204.us-central1.run.app/health](https://systemquest-api-600847459204.us-central1.run.app/health)

**API base for frontend:** `https://systemquest-api-600847459204.us-central1.run.app/api`  
(Use this as `VITE_API_URL` in Vercel.)

## Demo variables in the container

The Docker image uses an entrypoint that writes env vars to `/app/.env` at startup. This lets you:

- Run `docker exec` and use the demo credentials for seeding or testing
- Have `DEMO_SEED_EMAIL`, `DEMO_SEED_PASSWORD`, `DEMO_SEED_USERNAME` available inside the container

Set these when deploying (see below) or when running locally:

```bash
docker run -e DEMO_SEED_EMAIL=demo@example.com -e DEMO_SEED_PASSWORD=xxx ...
```

## Redeploy (with demo vars)

```bash
cd backend
# Ensure .env.local has: DATABASE_URL, DEMO_SEED_EMAIL, DEMO_SEED_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
./scripts/deploy-cloudrun.sh
```

For Cloud Run, `DATABASE_URL` must use the socket format:
`postgresql://USER:PASS@/DBNAME?host=/cloudsql/system-quest:us-central1:systemquest-db`

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
