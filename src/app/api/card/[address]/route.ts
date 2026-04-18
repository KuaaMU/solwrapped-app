// /api/card/[address] — Node runtime. Returns the AI card as PNG.
// Falls back to the Satori OG card on missing deps/key or upstream failure,
// and (when CARD_TIMEOUT_MS is set) on a soft-timeout so Vercel Hobby's 10s
// function cap doesn't return a 504 to the client.
//
// Query params:
//   mode = on | festival-only | off
//   v    = 0-3 (style variant index; default = address-hashed)
//
// Env:
//   CARD_TIMEOUT_MS — milliseconds before we surrender to the Satori fallback.
//     Unset / 0 → no timeout (local dev, Fly.io, Vercel Pro).
//     8500       → recommended for Vercel Hobby (10s function cap).

import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import { generateAICard } from '@/lib/ai-card';
import { parseMode } from '@/lib/ai-card/enrichments';
import { normalizeVariantIdx } from '@/lib/ai-card/variants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function softTimeoutMs(): number {
  const raw = parseInt(process.env.CARD_TIMEOUT_MS ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function timeoutTag(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!address) {
    return NextResponse.json({ error: 'missing address' }, { status: 400 });
  }

  const mode = parseMode(request.nextUrl.searchParams.get('mode'));
  const variantIdx = normalizeVariantIdx(request.nextUrl.searchParams.get('v'));

  const report = getDemoReport(address) ?? getCachedReport(address);
  if (!report) {
    return NextResponse.redirect(new URL(`/api/og/${address}`, request.url), 302);
  }

  const timeout = softTimeoutMs();
  const generation = generateAICard(report, { mode, variantIdx });
  const result =
    timeout > 0
      ? await Promise.race([generation, timeoutTag(timeout)])
      : await generation;

  if (!result) {
    return NextResponse.redirect(new URL(`/api/og/${address}`, request.url), 302);
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-Card-Source': result.source,
      'X-Card-Provider': result.provider,
      'X-Card-Enrichment': result.enrichmentId || 'none',
      'X-Card-Variant': result.variantId,
      'X-Card-Mode': mode,
    },
  });
}
