#!/usr/bin/env bash
# Start or stop the DB (Cloud SQL) and backend (Cloud Run) to control cost.
# Usage: ./scripts/gcp-instances.sh start | stop

set -e

GCP_PROJECT="${GCP_PROJECT:-system-quest}"
GCP_REGION="${GCP_REGION:-us-central1}"
CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-systemquest-db}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-systemquest-api}"
CLOUD_RUN_MAX_INSTANCES="${CLOUD_RUN_MAX_INSTANCES:-10}"

usage() {
  echo "Usage: $0 start | stop"
  echo "  start  - Start Cloud SQL DB and allow traffic to Cloud Run backend"
  echo "  stop   - Stop Cloud SQL DB and block traffic to Cloud Run backend"
  exit 1
}

start_db() {
  echo "Starting Cloud SQL: $CLOUD_SQL_INSTANCE ..."
  gcloud sql instances patch "$CLOUD_SQL_INSTANCE" \
    --activation-policy=ALWAYS \
    --project="$GCP_PROJECT" \
    --quiet
  echo "  Cloud SQL is starting (may take a few minutes to become RUNNABLE)."
}

stop_db() {
  echo "Stopping Cloud SQL: $CLOUD_SQL_INSTANCE ..."
  gcloud sql instances patch "$CLOUD_SQL_INSTANCE" \
    --activation-policy=NEVER \
    --project="$GCP_PROJECT" \
    --quiet
  echo "  Cloud SQL stopped."
}

start_backend() {
  echo "Enabling Cloud Run backend: $CLOUD_RUN_SERVICE (max-instances=$CLOUD_RUN_MAX_INSTANCES) ..."
  gcloud run services update "$CLOUD_RUN_SERVICE" \
    --region="$GCP_REGION" \
    --project="$GCP_PROJECT" \
    --max-instances="$CLOUD_RUN_MAX_INSTANCES" \
    --quiet
  echo "  Cloud Run will accept traffic."
}

stop_backend() {
  echo "Disabling Cloud Run backend: $CLOUD_RUN_SERVICE (max-instances=0) ..."
  gcloud run services update "$CLOUD_RUN_SERVICE" \
    --region="$GCP_REGION" \
    --project="$GCP_PROJECT" \
    --max-instances=0 \
    --quiet
  echo "  Cloud Run will not accept traffic."
}

case "${1:-}" in
  start)
    start_db
    start_backend
    echo "Done. DB and backend are on."
    ;;
  stop)
    stop_backend
    stop_db
    echo "Done. DB and backend are off."
    ;;
  *)
    usage
    ;;
esac
