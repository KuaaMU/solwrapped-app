// PNG Buffer cache for AI-generated cards.
//
// Key shape: `${address}|${YYYY-MM-DD}|${enrichmentId||'none'}`.
// Keying by the resolved enrichment (rather than the user's mode toggle) means
// two modes that produce the SAME prompt — e.g. OFF and FESTIVAL-ONLY on a day
// with no festival — share a single cache entry and don't waste generations.
//
// TTL: dated cards (enrichment present) expire at end-of-day CN, matching the
// enrichment layer's 24h horizon. Neutral cards (no enrichment) live 7 days.

type Provider = 'volcengine';

interface CacheEntry {
  buffer: Buffer;
  provider: Provider;
  expiresAt: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CN_TZ_OFFSET_MIN = 480;

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<{ card: Buffer; provider: Provider } | null>>();

export interface CacheKeyParts {
  address: string;
  localDate: string;        // YYYY-MM-DD
  enrichmentId: string;     // '' → neutral (no temporal context)
  variantId: string;        // e.g. 'CHAOS' / 'MELT' — distinct visual interpretation
}

function makeKey(parts: CacheKeyParts): string {
  return `${parts.address}|${parts.localDate}|${parts.enrichmentId || 'none'}|${parts.variantId}`;
}

function expiresAt(parts: CacheKeyParts, now: number): number {
  if (!parts.enrichmentId) return now + SEVEN_DAYS_MS;
  const cn = new Date(now + CN_TZ_OFFSET_MIN * 60_000);
  const eodUtc = Date.UTC(cn.getUTCFullYear(), cn.getUTCMonth(), cn.getUTCDate() + 1, 0, 0, 0);
  return eodUtc - CN_TZ_OFFSET_MIN * 60_000;
}

export function getCachedCard(
  parts: CacheKeyParts
): { buffer: Buffer; provider: Provider } | null {
  const key = makeKey(parts);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return { buffer: entry.buffer, provider: entry.provider };
}

export function setCachedCard(
  parts: CacheKeyParts,
  buffer: Buffer,
  provider: Provider
): void {
  cache.set(makeKey(parts), {
    buffer,
    provider,
    expiresAt: expiresAt(parts, Date.now()),
  });
}

/** Coalesce concurrent generations for the same cache key. */
export async function withInflight(
  parts: CacheKeyParts,
  task: () => Promise<{ card: Buffer; provider: Provider } | null>
): Promise<{ card: Buffer; provider: Provider } | null> {
  const key = makeKey(parts);
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = task().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
