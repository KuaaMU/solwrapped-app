import type { FullReport, WalletProfile, AIReport } from './types';
import { computeBadges } from './badges';

// Demo wallet reports for development and hackathon demo
// These bypass the API and load instantly

const DEMO_PROFILES: Record<string, { profile: Partial<WalletProfile>; ai: AIReport }> = {
  // Degen trader - high activity
  degen: {
    profile: {
      totalTransactions: 4287,
      totalFeesPaid: 2.847,
      activeProtocols: ['Jupiter', 'Raydium', 'Pump.fun', 'Orca', 'Meteora', 'Tensor'],
      firstTransactionDate: Math.floor(Date.now() / 1000) - 365 * 86400,
      lastTransactionDate: Math.floor(Date.now() / 1000) - 3600,
      activeDays: 312,
      swapCount: 3102,
      transferCount: 620,
      nftCount: 89,
      stakeCount: 15,
      otherCount: 461,
      protocolUsage: { Jupiter: 1820, Raydium: 680, 'Pump.fun': 420, Orca: 182, Meteora: 95, Tensor: 89 },
      uniqueTokensTraded: 284,
      topTokens: [
        { mint: 'So11...', symbol: 'SOL', tradeCount: 1240 },
        { mint: 'EPjF...', symbol: 'USDC', tradeCount: 890 },
        { mint: 'JUP...', symbol: 'JUP', tradeCount: 320 },
      ],
      tradingFrequency: 13.7,
      peakHour: 3,
      weekdayRatio: 0.48,
      avgTimeBetweenTxs: 7200,
      estimatedVolumeSOL: 18420,
      analyzedTransactionCount: 4287,
      classifiedPercentage: 89,
    },
    ai: {
      personality: 'MIDNIGHT DEGEN',
      personalityEmoji: '🌙',
      personalityDescription: 'A relentless trader who never sleeps. 3AM is your prime time.',
      themeId: 'orange',
      insights: [
        'You averaged 13.7 transactions per day across 312 active days — that is more active than 97% of Solana wallets.',
        'Your peak trading hour is 03:00 UTC. You made 420 trades on Pump.fun — your late-night degen sessions are statistically significant.',
        'You burned 2.847 SOL in fees alone. If SOL is at $150, that is $427 in gas — enough for a nice dinner, every month.',
      ],
      recommendation: 'Set a 1AM trading curfew. Your win rate drops 23% after midnight based on your transaction patterns.',
    },
  },

  // Conservative yield farmer
  farmer: {
    profile: {
      totalTransactions: 342,
      totalFeesPaid: 0.156,
      activeProtocols: ['Marinade', 'Jito', 'MarginFi', 'Kamino', 'Jupiter'],
      firstTransactionDate: Math.floor(Date.now() / 1000) - 540 * 86400,
      lastTransactionDate: Math.floor(Date.now() / 1000) - 86400,
      activeDays: 89,
      swapCount: 78,
      transferCount: 145,
      nftCount: 3,
      stakeCount: 98,
      otherCount: 18,
      protocolUsage: { Marinade: 82, Jito: 65, MarginFi: 54, Kamino: 48, Jupiter: 78 },
      uniqueTokensTraded: 12,
      topTokens: [
        { mint: 'So11...', symbol: 'SOL', tradeCount: 78 },
        { mint: 'mSol...', symbol: 'mSOL', tradeCount: 56 },
        { mint: 'jitoSOL...', symbol: 'jitoSOL', tradeCount: 42 },
      ],
      tradingFrequency: 3.8,
      peakHour: 14,
      weekdayRatio: 0.82,
      avgTimeBetweenTxs: 86400,
      estimatedVolumeSOL: 2840,
      analyzedTransactionCount: 342,
      classifiedPercentage: 95,
    },
    ai: {
      personality: 'YIELD MONK',
      personalityEmoji: '🧘',
      personalityDescription: 'Patient, disciplined, and laser-focused on sustainable yield.',
      themeId: 'gold',
      insights: [
        'You staked 98 times across Marinade and Jito — 29% of all your transactions are staking operations. True conviction.',
        'Only 12 unique tokens ever touched your wallet. While others chase memecoins, you stick to blue chips.',
        '82% of your trades happen on weekdays during business hours. This is a day job for you, not a casino.',
      ],
      recommendation: 'Explore Kamino multiply vaults — your disciplined style is perfect for leveraged yield strategies with defined risk.',
    },
  },

  // NFT collector / newcomer
  collector: {
    profile: {
      totalTransactions: 67,
      totalFeesPaid: 0.031,
      activeProtocols: ['Tensor', 'Magic Eden', 'Jupiter'],
      firstTransactionDate: Math.floor(Date.now() / 1000) - 45 * 86400,
      lastTransactionDate: Math.floor(Date.now() / 1000) - 7200,
      activeDays: 18,
      swapCount: 12,
      transferCount: 23,
      nftCount: 28,
      stakeCount: 0,
      otherCount: 4,
      protocolUsage: { Tensor: 18, 'Magic Eden': 10, Jupiter: 12 },
      uniqueTokensTraded: 5,
      topTokens: [
        { mint: 'So11...', symbol: 'SOL', tradeCount: 12 },
        { mint: 'EPjF...', symbol: 'USDC', tradeCount: 8 },
      ],
      tradingFrequency: 3.7,
      peakHour: 20,
      weekdayRatio: 0.35,
      avgTimeBetweenTxs: 43200,
      estimatedVolumeSOL: 34,
      analyzedTransactionCount: 67,
      classifiedPercentage: 94,
    },
    ai: {
      personality: 'PIXEL HUNTER',
      personalityEmoji: '🎨',
      personalityDescription: 'A fresh face in the ecosystem with a sharp eye for digital art.',
      themeId: 'violet',
      insights: [
        '42% of your transactions are NFT-related — you clearly came to Solana for the art, not the charts.',
        'Your wallet is only 45 days old but you have already explored 3 protocols. Fast learner.',
        'Weekend warrior: 65% of your activity is on Saturday and Sunday. Collecting art is your weekend hobby.',
      ],
      recommendation: 'Try Tensor cNFT collections — compressed NFTs cost under $0.01 to mint and trade, perfect for exploring.',
    },
  },
};

export function getDemoReport(address: string): FullReport | null {
  // Check if it's a known demo address
  const demoKey = getDemoKey(address);
  if (!demoKey) return null;

  const demo = DEMO_PROFILES[demoKey];
  if (!demo) return null;

  const profile: WalletProfile = {
    address,
    analyzedAt: Date.now(),
    totalTransactions: 0,
    totalFeesPaid: 0,
    activeProtocols: [],
    firstTransactionDate: 0,
    lastTransactionDate: 0,
    activeDays: 0,
    swapCount: 0,
    transferCount: 0,
    nftCount: 0,
    stakeCount: 0,
    otherCount: 0,
    protocolUsage: {},
    uniqueTokensTraded: 0,
    topTokens: [],
    tradingFrequency: 0,
    peakHour: 0,
    weekdayRatio: 0.5,
    avgTimeBetweenTxs: 0,
    estimatedVolumeSOL: 0,
    analyzedTransactionCount: 0,
    classifiedPercentage: 0,
    ...demo.profile,
  };

  return {
    profile,
    ai: demo.ai,
    badges: computeBadges(profile),
    generatedAt: Date.now(),
    version: '1.0.0-demo',
  };
}

function getDemoKey(address: string): string | null {
  // Use special prefixes for demo mode
  if (address === 'demo-degen' || address.startsWith('DEGEN')) return 'degen';
  if (address === 'demo-farmer' || address.startsWith('FARM')) return 'farmer';
  if (address === 'demo-collector' || address.startsWith('PIXEL')) return 'collector';
  // Also support "demo" as a generic trigger
  if (address.toLowerCase() === 'demo') return 'degen';
  return null;
}

export const DEMO_ADDRESSES = {
  degen: 'demo-degen',
  farmer: 'demo-farmer',
  collector: 'demo-collector',
};
