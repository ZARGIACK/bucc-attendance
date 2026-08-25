/**
 * Sliding-window rate limiter. In-memory by design: fine for a single
 * Node instance (Railway/Render/self-hosted). If you deploy serverless
 * or multi-instance, swap the store for Upstash Redis — the interface
 * below stays the same.
 */
type Bucket = number[]; // timestamps (ms) of recent hits

const globalForRl = globalThis as unknown as { rlStore?: Map<string, Bucket> };
const store = (globalForRl.rlStore ??= new Map());

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = (store.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (bucket.length >= limit) {
    const retryAfterSeconds = Math.ceil((bucket[0] + windowMs - now) / 1000);
    store.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  bucket.push(now);
  store.set(key, bucket);
  return { ok: true, remaining: limit - bucket.length, retryAfterSeconds: 0 };
}

/**
 * Manual/self check-in only. QR scanning is deliberately NOT rate limited —
 * an HR SE clearing a queue must never be throttled mid-event.
 */
export const ATTENDANCE_LIMIT = { limit: 100, windowMs: 5 * 60 * 1000 };
