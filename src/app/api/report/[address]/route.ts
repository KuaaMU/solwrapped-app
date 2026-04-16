import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport } from '@/lib/cache';

// SDK endpoint: returns cached report as JSON
// This is the "Moat" layer — developers can call this API
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || address.length < 32) {
    return NextResponse.json(
      { error: 'Invalid Solana address' },
      { status: 400 }
    );
  }

  const report = getCachedReport(address);

  if (!report) {
    return NextResponse.json(
      {
        error: 'Report not found. Call /api/analyze/{address} first.',
        hint: 'GET /api/analyze/{address} to generate a report, then retrieve it here.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    address,
    personality: report.ai.personality,
    personalityEmoji: report.ai.personalityEmoji,
    insights: report.ai.insights,
    profile: {
      totalTransactions: report.profile.totalTransactions,
      activeDays: report.profile.activeDays,
      activeProtocols: report.profile.activeProtocols,
      protocolUsage: report.profile.protocolUsage,
      swapCount: report.profile.swapCount,
      transferCount: report.profile.transferCount,
      nftCount: report.profile.nftCount,
      stakeCount: report.profile.stakeCount,
      estimatedVolumeSOL: report.profile.estimatedVolumeSOL,
      tradingFrequency: report.profile.tradingFrequency,
      peakHour: report.profile.peakHour,
      weekdayRatio: report.profile.weekdayRatio,
    },
    generatedAt: report.generatedAt,
    version: report.version,
  });
}
