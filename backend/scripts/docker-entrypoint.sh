#!/bin/sh
set -e

# Write demo + common env vars to .env so they're available for scripts
# (e.g. npm run prisma:seed-demo, or when exec'ing into the container)
ENV_FILE="/app/.env"
: > "$ENV_FILE"

for var in DEMO_SEED_EMAIL DEMO_SEED_PASSWORD DEMO_SEED_USERNAME DATABASE_URL PORT NODE_ENV CORS_ORIGIN; do
  eval "val=\$$var"
  if [ -n "$val" ]; then
    printf '%s=%s\n' "$var" "$val" >> "$ENV_FILE"
  fi
done

exec "$@"
