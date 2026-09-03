import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import { pingIndexNow } from '@/lib/publish/indexnow';
import { listDistributionJobs, markDistributionJobSent } from '@/lib/publish/jobs';
import { siteBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const jobs = await listDistributionJobs(80);
  return NextResponse.json({ success: true, data: { jobs } });
}

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const key = String(process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    return NextResponse.json({ success: false, message: '尚未配置 IndexNow 密钥' }, { status: 400 });
  }

  const result = await pingIndexNow([`${siteBaseUrl()}/`, `${siteBaseUrl()}/articles`], key);
  return NextResponse.json({
    success: result.ok,
    message: result.message,
  }, { status: result.ok ? 200 : 502 });
}

export async function PATCH(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  let body: { jobId?: unknown };
  try {
    body = await request.json() as { jobId?: unknown };
  } catch {
    return NextResponse.json({ success: false, message: '无效的请求数据' }, { status: 400 });
  }

  const jobId = Number(body.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ success: false, message: '分发记录 ID 无效' }, { status: 400 });
  }

  const updated = await markDistributionJobSent(jobId);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: '记录不存在，或已经处理完成' },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, message: '已标记为人工发布' });
}
