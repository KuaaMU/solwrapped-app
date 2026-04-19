// /api/card/[address] — Node runtime. Returns the AI card as PNG.
// Falls back to the Satori OG card (/api/og/[address]) on missing report or
// upstream generation failure. Volcengine 即梦 4.0 averages ~20s end-to-end;
// we rely on Vercel's function timeout (maxDuration below) to bound waits.
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
export const maxDuration = 60;

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
    return redirectToFallback(request, address);
  }

  let result;
  try {
    result = await generateAICard(report, { mode, variantIdx });
  } catch (err) {
    console.error('[card] generateAICard threw:', err);
    return redirectToFallback(request, address);
  }
  if (!result) {
    return redirectToFallback(request, address);
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-Card-Source': result.source,
      'X-Card-Provider': result.provider,
      'X-Card-Enrichment': encodeURIComponent(result.enrichmentId || 'none'),
      'X-Card-Variant': result.variantId,
      'X-Card-Mode': mode,
    },
  });
}

// Never cache the fallback — a 302 that browsers hang onto would trap the user
// on the Satori OG even after Volcengine recovers.
function redirectToFallback(request: NextRequest, address: string) {
  return NextResponse.redirect(new URL(`/api/og/${address}`, request.url), {
    status: 302,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
