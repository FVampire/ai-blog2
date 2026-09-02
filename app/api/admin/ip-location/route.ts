import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import {
  isAmapConfigured,
  lookupAmapIp,
  lookupIpWhoIs,
  normalizeIpAddress,
  selectPreferredLocation,
  type IpProviderResult,
} from '@/lib/ip-location';

type LookupMode = 'auto' | 'all' | 'ipwhois' | 'amap';

const MODES = new Set<LookupMode>(['auto', 'all', 'ipwhois', 'amap']);

export async function GET(request: NextRequest) {
  const auth = requireRoles(request, ['admin']);
  if (isAuthError(auth)) return auth;

  const rawIp = request.nextUrl.searchParams.get('ip') || '';
  const ip = normalizeIpAddress(rawIp);
  if (!ip) {
    return NextResponse.json(
      { success: false, message: '请输入有效的 IPv4 或 IPv6 地址' },
      { status: 400 }
    );
  }

  const requestedMode = request.nextUrl.searchParams.get('provider') || 'auto';
  if (!MODES.has(requestedMode as LookupMode)) {
    return NextResponse.json(
      { success: false, message: '不支持的数据源模式' },
      { status: 400 }
    );
  }
  const mode = requestedMode as LookupMode;

  let results: IpProviderResult[];
  if (mode === 'ipwhois') {
    results = [await lookupIpWhoIs(ip)];
  } else if (mode === 'amap') {
    results = [await lookupAmapIp(ip)];
  } else {
    results = await Promise.all([lookupIpWhoIs(ip), lookupAmapIp(ip)]);
  }

  const selected = mode === 'auto' || mode === 'all'
    ? selectPreferredLocation(results)
    : results[0]?.data || null;
  const success = results.some((result) => result.success);

  return NextResponse.json(
    {
      success,
      message: success ? undefined : results.map((result) => result.error).filter(Boolean).join('；') || '查询失败',
      data: {
        ip,
        mode,
        selected,
        results,
        configuration: {
          ipwhois: true,
          amap: isAmapConfigured(),
        },
      },
    },
    {
      status: success ? 200 : results.some((result) => !result.configured) ? 503 : 502,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
