#!/usr/bin/env bash
# Sync Prisma schema to Supabase backup database.
# Usage: npm run db:push:supabase
#
# Temporarily overrides DATABASE_URL so that `prisma db push`
# targets the Supabase database instead of Neon.

set -euo pipefail

# Load SUPABASE_DATABASE_URL from .env.local if present
if [ -f .env.local ]; then
  export $(grep -E '^SUPABASE_DATABASE_URL=' .env.local | xargs)
fi

if [ -z "${SUPABASE_DATABASE_URL:-}" ]; then
  echo "ERROR: SUPABASE_DATABASE_URL is not set."
  echo "Set it in .env.local or export it before running this script."
  exit 1
fi

echo "Pushing Prisma schema to Supabase..."
echo "Target: ${SUPABASE_DATABASE_URL%%@*}@****"

# Append sslmode=require if not already present (Prisma CLI needs it in the URL)
PUSH_URL="$SUPABASE_DATABASE_URL"
if [[ "$PUSH_URL" != *"sslmode="* ]]; then
  if [[ "$PUSH_URL" == *"?"* ]]; then
    PUSH_URL="${PUSH_URL}&sslmode=require"
  else
    PUSH_URL="${PUSH_URL}?sslmode=require"
  fi
fi

DATABASE_URL="$PUSH_URL" npx prisma db push --accept-data-loss

echo ""
echo "Done. Supabase tables now match prisma/schema.prisma."
