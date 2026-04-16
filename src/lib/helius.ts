import type { HeliusTransaction } from './types';

const HELIUS_API_BASE = 'https://api.helius.xyz';

export async function fetchTransactions(
  address: string,
  apiKey: string,
  options: {
    limit?: number;
    beforeSignature?: string;
  } = {}
): Promise<{ transactions: HeliusTransaction[]; hasMore: boolean }> {
  const { limit = 100, beforeSignature } = options;

  const params = new URLSearchParams({
    'api-key': apiKey,
    limit: String(limit),
  });

  if (beforeSignature) {
    params.set('before', beforeSignature);
  }

  const url = `${HELIUS_API_BASE}/v0/addresses/${address}/transactions?${params}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Helius API error ${res.status}: ${text}`);
  }

  const transactions: HeliusTransaction[] = await res.json();

  return {
    transactions,
    hasMore: transactions.length === limit,
  };
}

export async function fetchAllTransactions(
  address: string,
  apiKey: string,
  options: {
    maxPages?: number;
    maxAgeDays?: number;
    onProgress?: (fetched: number) => void;
  } = {}
): Promise<HeliusTransaction[]> {
  const { maxPages = 50, maxAgeDays = 365, onProgress } = options;
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - maxAgeDays * 86400;
  const allTransactions: HeliusTransaction[] = [];
  let beforeSignature: string | undefined;
  let page = 0;

  while (page < maxPages) {
    const { transactions, hasMore } = await fetchTransactions(address, apiKey, {
      limit: 100,
      beforeSignature,
    });

    // Filter out transactions older than cutoff
    const filtered = transactions.filter((tx) => tx.timestamp >= cutoffTimestamp);
    allTransactions.push(...filtered);
    onProgress?.(allTransactions.length);

    // Stop if we've gone past our time window or no more data
    if (!hasMore || transactions.length === 0 || filtered.length < transactions.length) break;

    beforeSignature = transactions[transactions.length - 1].signature;
    page++;

    if (page < maxPages) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return allTransactions;
}

export async function fetchQuickPreview(
  address: string,
  apiKey: string
): Promise<HeliusTransaction[]> {
  return fetchAllTransactions(address, apiKey, {
    maxPages: 3,
    maxAgeDays: 90,
  });
}
