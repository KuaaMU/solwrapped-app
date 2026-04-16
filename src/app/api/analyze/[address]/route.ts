import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTransactions, fetchQuickPreview } from '@/lib/helius';
import { analyzeTransactions } from '@/lib/analyzer';
import { generateAIReport } from '@/lib/ai';
import { getCachedReport, setCachedReport } from '@/lib/cache';
import { getDemoReport } from '@/lib/demo-data';
import type { FullReport, AnalyzeResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  // Demo mode — instant response with mock data
  const demoReport = getDemoReport(address);
  if (demoReport) {
    setCachedReport(address, demoReport);
    // Simulate brief loading for UX
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({
      status: 'complete',
      report: demoReport,
    } satisfies AnalyzeResponse);
  }

  if (!address || address.length < 32) {
    return NextResponse.json(
      { status: 'error', error: 'Invalid Solana address' } satisfies AnalyzeResponse,
      { status: 400 }
    );
  }

  // Check cache first
  const cached = getCachedReport(address);
  if (cached) {
    return NextResponse.json({
      status: 'complete',
      report: cached,
    } satisfies AnalyzeResponse);
  }

  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) {
    return NextResponse.json(
      { status: 'error', error: 'HELIUS_API_KEY not configured. Try "demo-degen" for a preview.' } satisfies AnalyzeResponse,
      { status: 500 }
    );
  }

  const claudeKey = process.env.ANTHROPIC_API_KEY || '';

  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'full';

    // Fetch transactions
    const transactions =
      mode === 'quick'
        ? await fetchQuickPreview(address, heliusKey)
        : await fetchAllTransactions(address, heliusKey, {
            maxPages: 30,
            maxAgeDays: 365,
          });

    if (transactions.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'No transactions found for this address in the past year',
      } satisfies AnalyzeResponse);
    }

    // Analyze
    const profile = analyzeTransactions(address, transactions);

    // Generate AI report
    const ai = await generateAIReport(profile, claudeKey);

    const report: FullReport = {
      profile,
      ai,
      generatedAt: Date.now(),
      version: '1.0.0',
    };

    // Cache the result
    setCachedReport(address, report);

    return NextResponse.json({
      status: 'complete',
      report,
    } satisfies AnalyzeResponse);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      } satisfies AnalyzeResponse,
      { status: 500 }
    );
  }
}
