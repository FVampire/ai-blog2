import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import {
  generateGeminiContent,
  getGeminiConfiguration,
  validateGeminiInput,
  type GeminiInput,
} from '@/lib/gemini';
import { enforceRateLimit } from '@/lib/rate-limit-api';

export async function GET(request: NextRequest) {
  const auth = requireRoles(request, ['admin']);
  if (isAuthError(auth)) return auth;

  return NextResponse.json(
    { success: true, data: getGeminiConfiguration() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: NextRequest) {
  const auth = requireRoles(request, ['admin']);
  if (isAuthError(auth)) return auth;

  const rateLimited = enforceRateLimit(request, 'admin:gemini', 20, 60_000);
  if (rateLimited) return rateLimited;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: '请求 JSON 无效' }, { status: 400 });
  }

  const temperature = typeof body.temperature === 'number' ? body.temperature : undefined;
  const maxOutputTokens = typeof body.maxOutputTokens === 'number' ? body.maxOutputTokens : undefined;
  const input: GeminiInput = {
    prompt: typeof body.prompt === 'string' ? body.prompt : '',
    systemInstruction: typeof body.systemInstruction === 'string' ? body.systemInstruction : undefined,
    model: typeof body.model === 'string' ? body.model.trim() : undefined,
    temperature,
    maxOutputTokens,
  };
  const validationError = validateGeminiInput(input);
  if (validationError) {
    return NextResponse.json({ success: false, message: validationError }, { status: 400 });
  }
  if (!getGeminiConfiguration().configured) {
    return NextResponse.json(
      { success: false, message: 'Gemini API 未配置，请设置 GEMINI_API_KEY' },
      { status: 503 },
    );
  }

  try {
    const result = await generateGeminiContent(input);
    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Gemini 请求失败' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
