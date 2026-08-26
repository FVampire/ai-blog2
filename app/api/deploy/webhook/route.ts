import { NextRequest, NextResponse } from 'next/server';

import { requireDeployAuth } from '@/lib/auth-middleware-app';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Deploy webhook: triggers git pull + build + restart
 *
 * POST /api/deploy/webhook
 * Headers: Authorization: Bearer <DEPLOY_SECRET> or X-Deploy-Secret: <secret>
 */
export async function POST(request: NextRequest) {
  const authResult = requireDeployAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const deployScript = process.env.DEPLOY_SCRIPT || 'scripts/deploy.sh';
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const branch = body.branch || process.env.DEPLOY_BRANCH || 'main';

    console.log(`[Deploy] Starting deployment from branch: ${branch}`);

    const { stdout, stderr } = await execAsync(
      `bash ${deployScript} ${branch}`,
      {
        cwd: process.cwd(),
        timeout: 300000,
        env: { ...process.env, DEPLOY_BRANCH: branch },
      }
    );

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: '部署完成',
      data: {
        branch,
        duration: `${duration}ms`,
        output: stdout.slice(-2000),
        warnings: stderr ? stderr.slice(-500) : null,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Deploy] Deployment failed:', error);

    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({
      success: false,
      message: '部署失败',
      data: {
        duration: `${duration}ms`,
        error: execError.message,
        output: execError.stdout?.slice(-2000),
        stderr: execError.stderr?.slice(-1000),
      },
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = requireDeployAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json({
    success: true,
    message: 'Deploy webhook is ready',
    data: {
      deployScript: process.env.DEPLOY_SCRIPT || 'scripts/deploy.sh',
      deployBranch: process.env.DEPLOY_BRANCH || 'main',
    },
  });
}
