import { requireDeployAuth } from '@/lib/auth-middleware-app';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Deploy webhook: triggers git pull + build + restart
 *
 * POST /api/deploy/webhook
 * Auth: Bearer / X-Deploy-Secret, or Gitee 密码/密钥 (X-Gitee-Token)
 */
function resolveDeployBranch(body: Record<string, unknown>, fallback: string): string {
  if (typeof body.branch === 'string' && body.branch) return body.branch;
  if (typeof body.ref === 'string' && body.ref.startsWith('refs/heads/')) {
    return body.ref.slice('refs/heads/'.length);
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = requireDeployAuth(request, body);
  if (authResult instanceof NextResponse) return authResult;

  const branch = resolveDeployBranch(body, process.env.DEPLOY_BRANCH || 'master');
  // 首字符禁止为 '-',避免成为 git 的选项参数。
  const BRANCH_PATTERN = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,99}$/;
  if (!BRANCH_PATTERN.test(branch) || branch.includes('..')) {
    return NextResponse.json(
      { success: false, message: '分支名无效' },
      { status: 400 }
    );
  }

  const deployScript = process.env.DEPLOY_SCRIPT || 'scripts/deploy.sh';
  const logFile = `${process.cwd()}/deploy.log`;

  console.log(`[Deploy] Trigger async deployment for branch: ${branch}`);

  const appDir = process.cwd();
  const deployEnv = {
    ...process.env,
    APP_DIR: appDir,
    DEPLOY_BRANCH: branch,
    // PATH 应由 deploy.sh 或 systemd/pm2 环境提供。
    PATH: process.env.PATH || '',
    CI: 'true',
  };

  const fd = fs.openSync(logFile, 'a');
  let child;
  try {
    child = spawn('bash', [deployScript, branch], {
      cwd: appDir,
      detached: true,
      stdio: ['ignore', fd, fd],
      env: deployEnv,
    });
  } finally {
    fs.closeSync(fd);
  }
  child.unref();

  return NextResponse.json({
    success: true,
    message: '部署已触发，请稍后查看 deploy.log',
    data: {
      branch,
      deployScript,
      logFile,
    },
  });
}

export async function GET(request: NextRequest) {
  const authResult = requireDeployAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json({
    success: true,
    message: 'Deploy webhook is ready',
    data: {
      deployScript: process.env.DEPLOY_SCRIPT || 'scripts/deploy.sh',
      deployBranch: process.env.DEPLOY_BRANCH || 'master',
    },
  });
}
