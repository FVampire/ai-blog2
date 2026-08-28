import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface Bucket {
  timestamps: number[];
  windowMs: number;
}

// 进程内内存滑动窗口。Next 多实例 / Serverless 场景下每个实例各自计数，
// 限流只是尽力而为，不保证全局精确；需要严格限流请换 Redis 等共享存储。
const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = Date.now();

function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  for (const [key, bucket] of buckets) {
    const last = bucket.timestamps[bucket.timestamps.length - 1];
    if (last === undefined || now - last > bucket.windowMs) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { timestamps: [], windowMs };
  bucket.windowMs = windowMs;

  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > windowStart);
  buckets.set(key, bucket);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * 按「路由 key + 客户端 IP」限流。
 * 超限时返回 429 响应，未超限返回 null。
 */
export function enforceRateLimit(
  request: NextRequest,
  routeKey: string,
  limit: number,
  windowMs: number,
  message = '请求过于频繁，请稍后再试'
): NextResponse | null {
  const result = checkRateLimit(`${routeKey}:${getClientIp(request)}`, limit, windowMs);

  if (result.allowed) return null;

  return NextResponse.json(
    { success: false, message },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}
