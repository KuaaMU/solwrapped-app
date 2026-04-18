// /api/card/[address] — Node runtime. Returns the AI card as PNG.
// Falls back to the Satori OG card on missing deps/key or upstream failure,
// and also on a soft-timeout so Vercel Hobby's 10s function cap doesn't produce
// a 504 to the client.
//
// Query params:
//   mode = on | festival-only | off
//   v    = 0-3 (style variant index; default = address-hashed)

import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import { generateAICard } from '@/lib/ai-card';
import { parseMode } from '@/lib/ai-card/enrichments';
import { normalizeVariantIdx } from '@/lib/ai-card/variants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Hobby plan hard-caps at 10s. `maxDuration` is capped by the platform; setting
// it here is harmless on both Hobby and Pro.
export const maxDuration = 60;

const SOFT_TIMEOUT_MS = 8500;

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

  // Soft timeout: if generation takes too long we surrender to the Satori OG
  // fallback so the caller gets *something* within Vercel's function budget.
  const result = await Promise.race([
    generateAICard(report, { mode, variantIdx }),
    timeoutTag(SOFT_TIMEOUT_MS),
  ]);

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
