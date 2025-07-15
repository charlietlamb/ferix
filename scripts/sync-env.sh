#!/bin/bash

# Exit on error
set -e

ROOT_ENV=".env"
APPS=("apps/api" "apps/web" "packages/database")

if [ ! -f "$ROOT_ENV" ]; then
  echo "No .env file found in the root directory. Aborting."
  exit 1
fi

for APP in "${APPS[@]}"; do
  TARGET="$APP/.env"
  cp "$ROOT_ENV" "$TARGET"
  echo "Copied $ROOT_ENV to $TARGET"
done 