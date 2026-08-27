#!/bin/bash
# 一次性在服务器安装 bare 仓库 + post-receive hook（pencil-blog / master）
set -euo pipefail

BARE_REPO="${1:-/home/ubuntu/repos/pencil-blog.git}"
DEPLOY_DIR="${2:-/home/ubuntu/pencil-blog}"
BRANCH="${3:-master}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== pencil-blog hook setup ==="
echo "Bare repo:   $BARE_REPO"
echo "Deploy dir:  $DEPLOY_DIR"
echo "Branch:      $BRANCH"

mkdir -p "$(dirname "$BARE_REPO")"
if [ ! -d "$BARE_REPO" ]; then
  git init --bare "$BARE_REPO"
  echo "Created bare repo"
fi

HOOK="$BARE_REPO/hooks/post-receive"
cp "$SCRIPT_DIR/hooks/post-receive-pencil-blog" "$HOOK"
chmod +x "$HOOK"

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "ERROR: $DEPLOY_DIR not found. Clone repo first."
  exit 1
fi

# 若 bare 仓库为空，从当前工作副本导入 master
if ! git --git-dir="$BARE_REPO" rev-parse "$BRANCH" >/dev/null 2>&1; then
  echo "Bare repo empty — importing $BRANCH from $DEPLOY_DIR ..."
  git --git-dir="$BARE_REPO" fetch "$DEPLOY_DIR/.git" "refs/heads/$BRANCH:refs/heads/$BRANCH"
fi

echo ""
echo "=== Hook installed ==="
echo "Hook: $HOOK"
echo ""
echo "本地添加 production remote 并推送触发部署:"
echo "  git remote add production ssh://ubuntu@43.134.51.79$BARE_REPO"
echo "  git push production master"
echo ""
echo "或 Gitee 添加 Push WebHook（blog 运行后）:"
echo "  POST https://www.fvampire.top/api/deploy/webhook"
echo "  Header: X-Deploy-Secret: <DEPLOY_SECRET in .env>"
