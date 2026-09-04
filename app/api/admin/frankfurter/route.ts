import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import {
  convertWithFrankfurter,
  getFrankfurterCurrencies,
  validateConversionInput,
} from '@/lib/frankfurter';
import { enforceRateLimit } from '@/lib/rate-limit-api';

export async function GET(request: NextRequest) {
  const auth = requireRoles(request, ['admin']);
  if (isAuthError(auth)) return auth;

  const rateLimited = enforceRateLimit(request, 'admin:frankfurter', 60, 60_000);
  if (rateLimited) return rateLimited;

  const action = request.nextUrl.searchParams.get('action') || 'convert';
  try {
    if (action === 'currencies') {
      const currencies = await getFrankfurterCurrencies();
      return NextResponse.json(
        { success: true, data: { currencies } },
        { headers: { 'Cache-Control': 'private, max-age=3600' } },
      );
    }
    if (action !== 'convert') {
      return NextResponse.json({ success: false, message: '不支持的操作' }, { status: 400 });
    }

    const base = (request.nextUrl.searchParams.get('base') || '').trim().toUpperCase();
    const quote = (request.nextUrl.searchParams.get('quote') || '').trim().toUpperCase();
    const amount = Number(request.nextUrl.searchParams.get('amount'));
    const date = (request.nextUrl.searchParams.get('date') || '').trim() || undefined;
    const validationError = validateConversionInput(base, quote, amount, date);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    const conversion = await convertWithFrankfurter(base, quote, amount, date);
    return NextResponse.json(
      { success: true, data: conversion },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Frankfurter 请求失败' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
