// fal.ai FLUX.1 schnell wrapper — deterministic seed per address, fast ~1-3s/image.

import { fal } from '@fal-ai/client';
import { hashSeed } from '../logo-svg';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const key = process.env.FAL_KEY;
  if (!key) return false;
  fal.config({ credentials: key });
  configured = true;
  return true;
}

export interface FalImageRequest {
  prompt: string;
  address: string; // used to derive deterministic seed
}

/**
 * Generate an image via fal.ai FLUX.1 schnell. Returns raw PNG bytes or null.
 * landscape_16_9 = 1344x768 — wider than our target 1200x630, so we can crop cleanly.
 */
export async function generateFalImage(req: FalImageRequest): Promise<Buffer | null> {
  if (!ensureConfigured()) return null;

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: req.prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
        seed: hashSeed(req.address) % 2_147_483_647,
      },
      logs: false,
    });

    const url = (result as { data?: { images?: Array<{ url?: string }> } }).data?.images?.[0]?.url;
    if (!url) {
      console.error('[fal] no image URL in response');
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error('[fal] image fetch failed:', res.status);
      return null;
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    console.error('[fal] generation failed:', err);
    return null;
  }
}
