// PNG Buffer cache for AI-generated cards. TTL 7 days.
// In-memory — will be replaced by Postgres/Neon in a later phase.

interface CacheEntry {
  buffer: Buffer;
  expiresAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Buffer | null>>();

export function getCachedCard(address: string): Buffer | null {
  const entry = cache.get(address);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(address);
    return null;
  }
  return entry.buffer;
}

export function setCachedCard(address: string, buffer: Buffer): void {
  cache.set(address, { buffer, expiresAt: Date.now() + TTL_MS });
}

/** Coalesce concurrent generations for the same address. */
export async function withInflight(
  address: string,
  task: () => Promise<Buffer | null>
): Promise<Buffer | null> {
  const existing = inflight.get(address);
  if (existing) return existing;
  const promise = task().finally(() => inflight.delete(address));
  inflight.set(address, promise);
  return promise;
}
