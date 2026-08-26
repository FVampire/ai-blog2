#!/bin/bash
# PM2 部署脚本 — 由 git hook 或手动触发
set -euo pipefail

BRANCH="${1:-${DEPLOY_BRANCH:-main}}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_PREFIX="[Deploy $(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Deploying branch: $BRANCH in $APP_DIR"
cd "$APP_DIR"

# 如果是 bare repo hook 触发，工作目录已经是部署目录，跳过 pull
if [ "${SKIP_GIT_PULL:-}" != "1" ]; then
  echo "$LOG_PREFIX Pulling latest code..."
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
fi

echo "$LOG_PREFIX Installing dependencies..."
if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
else
  npm install
fi

echo "$LOG_PREFIX Running migrations..."
node scripts/migrate.mjs

echo "$LOG_PREFIX Building..."
if command -v pnpm &> /dev/null; then
  pnpm build
else
  npm run build
fi

echo "$LOG_PREFIX Restarting PM2..."
if command -v pm2 &> /dev/null; then
  pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
  pm2 save
else
  echo "$LOG_PREFIX WARNING: pm2 not found. Build complete, restart manually."
fi

echo "$LOG_PREFIX Deployment complete!"
