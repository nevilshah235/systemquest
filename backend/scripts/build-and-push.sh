#!/usr/bin/env bash
# Build the backend image for linux/amd64 (required by Cloud Run) and push to Artifact Registry.
# Usage: ./scripts/build-and-push.sh

set -e

IMAGE="${IMAGE:-us-central1-docker.pkg.dev/system-quest/systemquest-backend/api:latest}"

echo "Building for linux/amd64 (Cloud Run)..."
docker build --platform linux/amd64 -t "$IMAGE" .

echo "Pushing $IMAGE ..."
docker push "$IMAGE"

echo "Done. Deploy with: ./scripts/deploy-cloudrun.sh"
