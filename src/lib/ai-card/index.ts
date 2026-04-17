// AI card pipeline entry point.
// Orchestrates: art brief (LLM) → image provider (Volcengine 即梦 4.0 preferred,
// fal.ai fallback) → sharp composition → cached PNG.

import type { FullReport } from '../types';
import { buildArtBrief } from './prompt';
import { generateVolcImage, hasVolcCredentials } from './volcengine';
import { generateFalImage } from './fal';
import { composeCard } from './compositor';
import { getCachedCard, setCachedCard, withInflight } from './cache';

export interface GenerateCardResult {
  buffer: Buffer;
  source: 'cache' | 'fresh';
  provider: 'volcengine' | 'fal';
}

async function generateBackground(
  prompt: string,
  address: string
): Promise<{ buffer: Buffer; provider: 'volcengine' | 'fal' } | null> {
  // Prefer Volcengine 即梦 4.0 when credentials are set.
  if (hasVolcCredentials()) {
    const buffer = await generateVolcImage({ prompt, address });
    if (buffer) return { buffer, provider: 'volcengine' };
  }
  // Fall back to fal.ai FLUX.1 schnell.
  const buffer = await generateFalImage({ prompt, address });
  if (buffer) return { buffer, provider: 'fal' };
  return null;
}

/**
 * Produce the AI share card for a wallet report. Returns null if the
 * pipeline can't run (no image provider configured, upstream failure, etc.)
 * — callers should fall back to the Satori OG card in that case.
 */
export async function generateAICard(
  report: FullReport
): Promise<GenerateCardResult | null> {
  const address = report.profile.address;

  const cached = getCachedCard(address);
  if (cached) {
    return { buffer: cached.buffer, source: 'cache', provider: cached.provider };
  }

  const result = await withInflight(address, async () => {
    const prompt = await buildArtBrief(report);
    const bg = await generateBackground(prompt, address);
    if (!bg) return null;
    const card = await composeCard(bg.buffer, report);
    return { card, provider: bg.provider };
  });

  if (!result) return null;
  setCachedCard(address, result.card, result.provider);
  return { buffer: result.card, source: 'fresh', provider: result.provider };
}
