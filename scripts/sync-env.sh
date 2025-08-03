#!/bin/bash

# Exit on error
set -e

ROOT_ENV=".env"
APPS=("packages/api/.env" "apps/web/.env" "packages/backend/.env.local")

if [ ! -f "$ROOT_ENV" ]; then
  echo "No .env file found in the root directory. Aborting."
  exit 1
fi

for APP in "${APPS[@]}"; do
  TARGET="$APP"
  cp "$ROOT_ENV" "$TARGET"
  echo "Copied $ROOT_ENV to $TARGET"
done 