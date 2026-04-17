// /api/card/[address] — Node runtime. Returns the AI card as PNG.
// Falls back to the Satori OG card on missing deps/key or upstream failure.

import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import { generateAICard } from '@/lib/ai-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!address) {
    return NextResponse.json({ error: 'missing address' }, { status: 400 });
  }

  const report = getDemoReport(address) ?? getCachedReport(address);
  if (!report) {
    // No report available — redirect caller to Satori fallback.
    return NextResponse.redirect(new URL(`/api/og/${address}`, _request.url), 302);
  }

  const result = await generateAICard(report);
  if (!result) {
    // Pipeline unavailable (e.g. no FAL_KEY) — fall back.
    return NextResponse.redirect(new URL(`/api/og/${address}`, _request.url), 302);
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-Card-Source': result.source,
      'X-Card-Provider': result.provider,
    },
  });
}
