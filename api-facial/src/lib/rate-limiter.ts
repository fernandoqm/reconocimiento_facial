/**
 * Rate limiter en memoria por API key.
 * Suficiente para un servidor dedicado single-instance.
 * Para multi-instancia migrar a Redis.
 */

interface Bucket {
  count:   number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limitPerHour: number): boolean {
  const now    = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }

  if (bucket.count >= limitPerHour) return false;
  bucket.count++;
  return true;
}

export function getRemainingRequests(key: string, limitPerHour: number): number {
  const bucket = buckets.get(key);
  if (!bucket || Date.now() >= bucket.resetAt) return limitPerHour;
  return Math.max(0, limitPerHour - bucket.count);
}
