import { requireDeployAuth } from '@/lib/auth-middleware-app';
import { spawn } from 'child_process';
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

  const deployScript = process.env.DEPLOY_SCRIPT || 'scripts/deploy.sh';
  const branch = resolveDeployBranch(body, process.env.DEPLOY_BRANCH || 'master');
  const logFile = `${process.cwd()}/deploy.log`;

  console.log(`[Deploy] Trigger async deployment for branch: ${branch}`);

  const appDir = process.cwd();
  const deployEnv = {
    ...process.env,
    HOME: process.env.HOME || '/home/ubuntu',
    APP_DIR: appDir,
    DEPLOY_BRANCH: branch,
    PATH: `/home/ubuntu/.nvm/versions/node/v21.5.0/bin:/home/ubuntu/.local/share/pnpm:/usr/bin:/bin:${process.env.PATH || ''}`,
    CI: 'true',
  };

  const child = spawn('bash', ['-lc', `bash ${deployScript} ${branch} >> ${logFile} 2>&1`], {
    cwd: appDir,
    detached: true,
    stdio: 'ignore',
    env: deployEnv,
  });
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
