import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import {
  getTranslationConfiguration,
  TRANSLATION_PROVIDERS,
  translateWithProvider,
  validateTranslationInput,
  type TranslationInput,
  type TranslationProvider,
} from '@/lib/translation';

function requireAdmin(request: NextRequest) {
  return requireRoles(request, ['admin']);
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (isAuthError(auth)) return auth;

  return NextResponse.json(
    { success: true, data: { configuration: getTranslationConfiguration() } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (isAuthError(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: '请求 JSON 无效' }, { status: 400 });
  }

  const input: TranslationInput = {
    text: typeof body.text === 'string' ? body.text : '',
    source: typeof body.source === 'string' ? body.source : '',
    target: typeof body.target === 'string' ? body.target : '',
  };
  const validationError = validateTranslationInput(input);
  if (validationError) {
    return NextResponse.json({ success: false, message: validationError }, { status: 400 });
  }

  const requested = Array.isArray(body.providers) ? body.providers : [];
  const providers = [...new Set(requested.filter((provider): provider is TranslationProvider =>
    typeof provider === 'string' && TRANSLATION_PROVIDERS.includes(provider as TranslationProvider)
  ))];
  if (providers.length === 0) {
    return NextResponse.json({ success: false, message: '请至少选择一个翻译服务' }, { status: 400 });
  }

  const results = await Promise.all(providers.map((provider) => translateWithProvider(provider, input)));
  const success = results.some((result) => result.success);
  return NextResponse.json(
    {
      success,
      message: success ? undefined : results.map((result) => result.error).filter(Boolean).join('；') || '翻译失败',
      data: { input, results, configuration: getTranslationConfiguration() },
    },
    {
      status: success ? 200 : results.some((result) => !result.configured) ? 503 : 502,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
