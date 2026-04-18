// AI card pipeline entry point.
// Orchestrates: art brief (LLM, with enrichment registry + style variant) →
// image provider (Volcengine 即梦 4.0 preferred, fal.ai fallback) →
// sharp composition → cached PNG.

import type { FullReport } from '../types';
import { buildArtBrief, resolveEnrichmentIdFor, resolveVariantIdFor } from './prompt';
import { generateVolcImage, hasVolcCredentials } from './volcengine';
import { generateFalImage } from './fal';
import { composeCard } from './compositor';
import { getCachedCard, setCachedCard, withInflight, type CacheKeyParts } from './cache';
import { buildTemporalContext, type EnrichmentMode } from './enrichments';

export interface GenerateCardResult {
  buffer: Buffer;
  source: 'cache' | 'fresh';
  provider: 'volcengine' | 'fal';
  enrichmentId: string;
  variantId: string;
}

export interface GenerateCardOptions {
  mode?: EnrichmentMode;
  now?: Date;
  variantIdx?: number;   // undefined / -1 → default (address-hashed)
}

async function generateBackground(
  prompt: string,
  address: string
): Promise<{ buffer: Buffer; provider: 'volcengine' | 'fal' } | null> {
  if (hasVolcCredentials()) {
    const buffer = await generateVolcImage({ prompt, address });
    if (buffer) return { buffer, provider: 'volcengine' };
  }
  const buffer = await generateFalImage({ prompt, address });
  if (buffer) return { buffer, provider: 'fal' };
  return null;
}

/**
 * Produce the AI share card for a wallet report. Returns null if the pipeline
 * can't run (no image provider configured, upstream failure, etc.) — callers
 * should fall back to the Satori OG card in that case.
 */
export async function generateAICard(
  report: FullReport,
  opts: GenerateCardOptions = {}
): Promise<GenerateCardResult | null> {
  const mode = opts.mode ?? 'on';
  const now = opts.now ?? new Date();
  const address = report.profile.address;

  const temporal = buildTemporalContext(now);
  const enrichmentId = resolveEnrichmentIdFor(report, mode, now);
  const variantId = resolveVariantIdFor(report, opts.variantIdx);

  const cacheKey: CacheKeyParts = {
    address,
    localDate: temporal.localDate,
    enrichmentId,
    variantId,
  };

  const cached = getCachedCard(cacheKey);
  if (cached) {
    return {
      buffer: cached.buffer,
      source: 'cache',
      provider: cached.provider,
      enrichmentId,
      variantId,
    };
  }

  const result = await withInflight(cacheKey, async () => {
    const prompt = await buildArtBrief(report, {
      mode,
      now,
      variantIdx: opts.variantIdx,
    });
    const bg = await generateBackground(prompt, address);
    if (!bg) return null;
    const card = await composeCard(bg.buffer, report);
    return { card, provider: bg.provider };
  });

  if (!result) return null;
  setCachedCard(cacheKey, result.card, result.provider);
  return {
    buffer: result.card,
    source: 'fresh',
    provider: result.provider,
    enrichmentId,
    variantId,
  };
}
