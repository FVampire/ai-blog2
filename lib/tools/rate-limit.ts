const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  if (buckets.size > 5000) for (const [id, value] of buckets) if (value.resetAt <= now) buckets.delete(id);
  return true;
}
