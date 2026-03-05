#!/usr/bin/env bash
# Deploy backend to Cloud Run with env vars from .env.local
#
# Usage:
#   1. Ensure backend/.env.local has DATABASE_URL, DEMO_SEED_EMAIL, DEMO_SEED_PASSWORD, etc.
#   2. Run: ./scripts/deploy-cloudrun.sh
#
# Or pass vars explicitly:
#   DEMO_SEED_EMAIL=demo@example.com DEMO_SEED_PASSWORD=xxx ./scripts/deploy-cloudrun.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"
ENV_FILE="$BACKEND_DIR/.env.local"

GCP_PROJECT="${GCP_PROJECT:-system-quest}"
GCP_REGION="${GCP_REGION:-us-central1}"
CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-systemquest-db}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-systemquest-api}"
IMAGE="${IMAGE:-us-central1-docker.pkg.dev/system-quest/systemquest-backend/api:latest}"

# Load .env.local if it exists
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
fi

# Build env vars for gcloud (required for Cloud Run)
# For Cloud Run, DATABASE_URL must use socket format:
#   postgresql://USER:PASS@/DBNAME?host=/cloudsql/PROJECT:REGION:INSTANCE
# Use .env.cloudrun for deploy-specific values, or set CLOUD_RUN_DATABASE_URL to override.
DB_URL="${CLOUD_RUN_DATABASE_URL:-$DATABASE_URL}"
if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL (or CLOUD_RUN_DATABASE_URL) not set. Add to $ENV_FILE or export."
  exit 1
fi

# Use env vars file to handle special chars (e.g. passwords with +, =)
ENV_YAML=$(mktemp)
trap 'rm -f "$ENV_YAML"' EXIT

cat > "$ENV_YAML" << EOF
DATABASE_URL: "$DB_URL"
NODE_ENV: production
EOF
[ -n "$JWT_SECRET" ] && echo "JWT_SECRET: \"$JWT_SECRET\"" >> "$ENV_YAML"
[ -n "$JWT_REFRESH_SECRET" ] && echo "JWT_REFRESH_SECRET: \"$JWT_REFRESH_SECRET\"" >> "$ENV_YAML"
[ -n "$CORS_ORIGIN" ] && echo "CORS_ORIGIN: \"$CORS_ORIGIN\"" >> "$ENV_YAML"
# Demo vars — passed into container, written to .env by entrypoint
[ -n "$DEMO_SEED_EMAIL" ] && echo "DEMO_SEED_EMAIL: \"$DEMO_SEED_EMAIL\"" >> "$ENV_YAML"
[ -n "$DEMO_SEED_PASSWORD" ] && echo "DEMO_SEED_PASSWORD: \"$DEMO_SEED_PASSWORD\"" >> "$ENV_YAML"
[ -n "$DEMO_SEED_USERNAME" ] && echo "DEMO_SEED_USERNAME: \"$DEMO_SEED_USERNAME\"" >> "$ENV_YAML"

echo "Deploying $CLOUD_RUN_SERVICE to Cloud Run..."
echo "  Project: $GCP_PROJECT"
echo "  Region:  $GCP_REGION"
echo "  Image:   $IMAGE"
echo "  Demo:    ${DEMO_SEED_EMAIL:-<not set>}"
echo

gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --image="$IMAGE" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT" \
  --platform=managed \
  --set-cloudsql-instances="${GCP_PROJECT}:${GCP_REGION}:${CLOUD_SQL_INSTANCE}" \
  --env-vars-file="$ENV_YAML" \
  --allow-unauthenticated \
  --quiet

echo
echo "Done. Service URL:"
gcloud run services describe "$CLOUD_RUN_SERVICE" --region="$GCP_REGION" --project="$GCP_PROJECT" --format='value(status.url)'
