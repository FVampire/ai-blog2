#!/bin/bash
# Deploy on server: ~/pencil-blog
# Usage: bash scripts/deploy-pencil-blog.sh

set -eu

export PATH="/home/ubuntu/.nvm/versions/node/v21.5.0/bin:/home/ubuntu/.local/share/pnpm:$PATH"
APP_DIR="${APP_DIR:-$HOME/pencil-blog}"
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
if pm2 describe blog >/dev/null 2>&1; then
  pm2 restart ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save --force
pm2 status

echo "=== Deploy complete $(date) ==="
