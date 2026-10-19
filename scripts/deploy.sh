#!/bin/bash
# PM2 部署脚本 — 由 git hook 或手动触发
set -euo pipefail

BRANCH="${1:-${DEPLOY_BRANCH:-master}}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_PREFIX="[Deploy $(date '+%Y-%m-%d %H:%M:%S')]"

# webhook 和 git hook 都以非登录 shell 调用本脚本，不会读取 ~/.bash_profile，
# 因此在这里自行加载 nvm（node、pnpm）和 PNPM_HOME（pm2 等全局命令）。
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # nvm.sh 与 set -eu 不兼容，加载期间临时关闭
  set +eu
  . "$NVM_DIR/nvm.sh"
  set -eu
fi
export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$PNPM_HOME:$PATH"

for cmd in node pnpm pm2; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "$LOG_PREFIX ERROR: 找不到 $cmd，PATH=$PATH" >&2
    exit 1
  fi
done

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
pnpm install --frozen-lockfile

echo "$LOG_PREFIX Running migrations..."
node scripts/migrate.mjs

echo "$LOG_PREFIX Building..."
pnpm build

echo "$LOG_PREFIX Restarting PM2..."
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
pm2 save

echo "$LOG_PREFIX Deployment complete!"
