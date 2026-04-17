// AI card pipeline entry point.
// Orchestrates: art brief (LLM) → fal.ai FLUX → sharp composition → cached PNG.

import type { FullReport } from '../types';
import { buildArtBrief } from './prompt';
import { generateFalImage } from './fal';
import { composeCard } from './compositor';
import { getCachedCard, setCachedCard, withInflight } from './cache';

export interface GenerateCardResult {
  buffer: Buffer;
  source: 'cache' | 'fresh';
}

/**
 * Produce the AI share card for a wallet report. Returns null if the
 * pipeline can't run (missing FAL_KEY, upstream failure, etc.) — callers
 * should fall back to the Satori OG card in that case.
 */
export async function generateAICard(
  report: FullReport
): Promise<GenerateCardResult | null> {
  const address = report.profile.address;

  const cached = getCachedCard(address);
  if (cached) return { buffer: cached, source: 'cache' };

  const buffer = await withInflight(address, async () => {
    const prompt = await buildArtBrief(report);
    const bg = await generateFalImage({ prompt, address });
    if (!bg) return null;
    return composeCard(bg, report);
  });

  if (!buffer) return null;
  setCachedCard(address, buffer);
  return { buffer, source: 'fresh' };
}

export { getCachedCard } from './cache';
