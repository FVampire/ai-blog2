import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import { SettingsRepository } from '@/lib/repositories/SettingsRepository';
import { pingIndexNow } from '@/lib/publish/indexnow';
import { listDistributionJobs } from '@/lib/publish/jobs';
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

  const key = String(
    process.env.INDEXNOW_KEY ||
    (await SettingsRepository.getSettingValue('distribute_indexnow_key', '')) ||
    '',
  ).trim();
  if (!key) {
    return NextResponse.json({ success: false, message: '尚未配置 IndexNow 密钥' }, { status: 400 });
  }

  const result = await pingIndexNow([`${siteBaseUrl()}/`, `${siteBaseUrl()}/articles`], key);
  return NextResponse.json({
    success: result.ok,
    message: result.message,
  }, { status: result.ok ? 200 : 502 });
}
