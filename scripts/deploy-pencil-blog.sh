#!/bin/bash
# Deploy on server: ~/pencil-blog
# Usage: bash scripts/deploy-pencil-blog.sh

set -eu

export PATH="/home/ubuntu/.nvm/versions/node/v21.5.0/bin:/home/ubuntu/.local/share/pnpm:/usr/bin:/bin"
export CI=true
PM2="/home/ubuntu/.local/share/pnpm/global/5/node_modules/pm2/bin/pm2"
APP_DIR="${APP_DIR:-/home/ubuntu/pencil-blog}"
BRANCH="${BRANCH:-master}"

cd "$APP_DIR"

echo "=== Deploy $(date) ==="
if [ "${SKIP_GIT_PULL:-}" != "1" ]; then
  echo "Pulling origin/$BRANCH ..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
  git log -1 --oneline
else
  echo "SKIP_GIT_PULL=1, using checked-out tree"
  git log -1 --oneline
fi

if ! grep -q '^DATABASE_SSL=' .env 2>/dev/null; then
  echo "DATABASE_SSL=true" >> .env
fi

echo "Installing dependencies ..."
pnpm install --frozen-lockfile

echo "Running migrations ..."
node scripts/migrate.mjs

echo "Building ..."
pnpm build

echo "Restarting PM2 ..."
if "$PM2" describe blog >/dev/null 2>&1; then
  "$PM2" restart ecosystem.config.js --env production
else
  "$PM2" start ecosystem.config.js --env production
fi
"$PM2" save --force
"$PM2" status

echo "=== Deploy complete $(date) ==="
