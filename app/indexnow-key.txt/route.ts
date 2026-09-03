import { NextResponse } from 'next/server';

import { SettingsRepository } from '@/lib/repositories/SettingsRepository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = String(
    process.env.INDEXNOW_KEY ||
    (await SettingsRepository.getSettingValue('distribute_indexnow_key', '')) ||
    '',
  ).trim();

  if (!key) {
    return new NextResponse('IndexNow is not configured', { status: 404 });
  }

  return new NextResponse(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
