// PNG Buffer cache for AI-generated cards. TTL 7 days.
// In-memory — will be replaced by Postgres/Neon in a later phase.

type Provider = 'volcengine' | 'fal';

interface CacheEntry {
  buffer: Buffer;
  provider: Provider;
  expiresAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<{ card: Buffer; provider: Provider } | null>>();

export function getCachedCard(
  address: string
): { buffer: Buffer; provider: Provider } | null {
  const entry = cache.get(address);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(address);
    return null;
  }
  return { buffer: entry.buffer, provider: entry.provider };
}

export function setCachedCard(
  address: string,
  buffer: Buffer,
  provider: Provider
): void {
  cache.set(address, { buffer, provider, expiresAt: Date.now() + TTL_MS });
}

/** Coalesce concurrent generations for the same address. */
export async function withInflight(
  address: string,
  task: () => Promise<{ card: Buffer; provider: Provider } | null>
): Promise<{ card: Buffer; provider: Provider } | null> {
  const existing = inflight.get(address);
  if (existing) return existing;
  const promise = task().finally(() => inflight.delete(address));
  inflight.set(address, promise);
  return promise;
}
