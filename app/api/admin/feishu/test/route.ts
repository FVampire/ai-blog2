import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import { sendTestFeishuNotification } from '@/lib/feishu-notify';

export async function POST(request: NextRequest) {
  const auth = requireRoles(request, ['admin']);
  if (isAuthError(auth)) return auth;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    body = {};
  }

  const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
  const webhookSecret = typeof body.webhookSecret === 'string' ? body.webhookSecret : undefined;

  const result = await sendTestFeishuNotification({
    webhookUrl: webhookUrl || undefined,
    webhookSecret,
  });

  return NextResponse.json(
    { success: result.ok, message: result.message },
    { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } },
  );
}
