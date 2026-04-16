import type { FullReport } from './types';

const cache = new Map<string, { report: FullReport; expiresAt: number }>();
const TTL = 24 * 60 * 60 * 1000;

export function getCachedReport(address: string): FullReport | null {
  const normalized = address.toLowerCase();
  const entry = cache.get(normalized);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(normalized);
    return null;
  }
  return entry.report;
}

export function setCachedReport(address: string, report: FullReport): void {
  cache.set(address.toLowerCase(), { report, expiresAt: Date.now() + TTL });
}

export function clearCache(): void {
  cache.clear();
}
