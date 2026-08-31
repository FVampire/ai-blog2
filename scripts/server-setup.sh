#!/bin/bash
# 服务器初始化脚本 — 在 Linux 服务器上运行一次
# 配置 bare git 仓库 + post-receive hook + PM2

set -euo pipefail

DEPLOY_DIR="${1:-/var/www/ai-blog2}"
BARE_REPO="${2:-/var/repos/ai-blog2.git}"
BRANCH="${3:-master}"

echo "=== ai-blog2 Server Setup ==="
echo "Deploy dir:  $DEPLOY_DIR"
echo "Bare repo:   $BARE_REPO"
echo "Branch:      $BRANCH"
echo ""

# 1. 创建 bare 仓库
if [ ! -d "$BARE_REPO" ]; then
  mkdir -p "$BARE_REPO"
  git init --bare "$BARE_REPO"
  echo "Created bare repo: $BARE_REPO"
fi

# 2. 安装 post-receive hook
HOOK_FILE="$BARE_REPO/hooks/post-receive"
cp scripts/hooks/post-receive "$HOOK_FILE"
chmod +x "$HOOK_FILE"

# 在 hook 中写入部署目录和目标分支
if sed --version >/dev/null 2>&1; then
  sed -i \
    -e "s|^DEPLOY_DIR=.*|DEPLOY_DIR=\"$DEPLOY_DIR\"|" \
    -e "s|^BRANCH=.*|BRANCH=\"$BRANCH\"|" \
    "$HOOK_FILE"
else
  sed -i '' \
    -e "s|^DEPLOY_DIR=.*|DEPLOY_DIR=\"$DEPLOY_DIR\"|" \
    -e "s|^BRANCH=.*|BRANCH=\"$BRANCH\"|" \
    "$HOOK_FILE"
fi

echo "Installed post-receive hook"

# 3. 首次克隆到部署目录
if [ ! -d "$DEPLOY_DIR" ]; then
  mkdir -p "$DEPLOY_DIR"
  git clone "$BARE_REPO" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
  echo "Cloned to $DEPLOY_DIR"
else
  echo "Deploy dir already exists: $DEPLOY_DIR"
fi

# 4. 提示后续步骤
echo ""
echo "=== Setup Complete ==="
echo ""
echo "本地添加 remote 并 push:"
echo "  git remote add production ssh://user@your-server/$BARE_REPO"
echo "  git push production $BRANCH"
echo ""
echo "服务器首次部署:"
echo "  cd $DEPLOY_DIR"
echo "  cp .env.example .env   # 编辑配置"
echo "  bash scripts/deploy.sh"
echo ""
echo "PM2 状态:"
echo "  pm2 status"
echo "  pm2 logs blog"
