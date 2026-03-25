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

## Vercel frontend setup

**Deployed frontend URL:** `https://frontend-o5n6nwlnr-nevil-shahs-projects-23a2ffe5.vercel.app`

In Vercel → Project Settings → Environment Variables, add:

| Key | Value | Targets |
|---|---|---|
| `VITE_API_URL` | `https://systemquest-api-600847459204.us-central1.run.app/api` | Production, Preview, Development |

After adding the env var, trigger a redeploy (Deployments → Redeploy).

> The root `vercel.json` (repo root) is the active Vercel config. It sets `buildCommand`, `outputDirectory`, and SPA rewrites. Do not add a second `vercel.json` inside `frontend/`.

## Before going to production

1. **CORS:** Set `CORS_ORIGIN=https://frontend-o5n6nwlnr-nevil-shahs-projects-23a2ffe5.vercel.app` in `backend/.env.local`, then redeploy via `./scripts/deploy-cloudrun.sh`. Multiple origins can be comma-separated.
2. **JWT secrets:** Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with strong random values (`openssl rand -base64 32`) in `backend/.env.local` before redeploying.

## Start/stop (cost control)

```bash
./scripts/gcp-instances.sh stop   # turn off DB + backend
./scripts/gcp-instances.sh start  # turn on again
```

## Apply schema changes (after Prisma changes)

```bash
gcloud run jobs execute systemquest-db-push --region=us-central1 --project=system-quest
```
