import type { HeliusTransaction, WalletProfile, TokenStat } from './types';

const KNOWN_TOKENS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'SOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: 'JUP',
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 'mSOL',
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: 'jitoSOL',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'BONK',
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 'POPCAT',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETHER',
  rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof: 'RENDER',
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: 'PYTH',
  hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux: 'HNT',
  '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ': 'W',
};

function resolveTokenSymbol(mint: string): string {
  return KNOWN_TOKENS[mint] || mint.slice(0, 4) + '..';
}

export function analyzeTransactions(
  address: string,
  transactions: HeliusTransaction[]
): WalletProfile {
  if (transactions.length === 0) {
    return emptyProfile(address);
  }

  const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

  let swapCount = 0;
  let transferCount = 0;
  let nftCount = 0;
  let stakeCount = 0;
  let otherCount = 0;

  const protocolCounts: Record<string, number> = {};
  const tokenCounts: Record<string, { mint: string; symbol: string; count: number }> = {};
  const hourCounts = new Array(24).fill(0);
  let weekdayTxs = 0;
  const activeDaysSet = new Set<string>();
  let totalFees = 0;
  let totalNativeVolume = 0;

  for (const tx of sorted) {
    switch (tx.type) {
      case 'SWAP':
        swapCount++;
        break;
      case 'TRANSFER':
        transferCount++;
        break;
      case 'NFT_SALE':
      case 'NFT_LISTING':
      case 'NFT_MINT':
      case 'NFT_BID':
      case 'NFT_CANCEL_LISTING':
      case 'COMPRESSED_NFT_MINT':
      case 'BURN_NFT':
        nftCount++;
        break;
      case 'STAKE_SOL':
      case 'UNSTAKE_SOL':
        stakeCount++;
        break;
      default:
        otherCount++;
    }

    if (tx.source && tx.source !== 'SYSTEM_PROGRAM') {
      const protocol = normalizeProtocolName(tx.source);
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    }

    for (const tt of tx.tokenTransfers || []) {
      if (tt.mint) {
        if (!tokenCounts[tt.mint]) {
          tokenCounts[tt.mint] = { mint: tt.mint, symbol: resolveTokenSymbol(tt.mint), count: 0 };
        }
        tokenCounts[tt.mint].count++;
      }
    }

    const date = new Date(tx.timestamp * 1000);
    hourCounts[date.getUTCHours()]++;
    if (date.getUTCDay() >= 1 && date.getUTCDay() <= 5) weekdayTxs++;
    activeDaysSet.add(date.toISOString().slice(0, 10));

    // Fees are in lamports from Helius
    totalFees += tx.fee || 0;

    for (const nt of tx.nativeTransfers || []) {
      if (nt.fromUserAccount === address || nt.toUserAccount === address) {
        totalNativeVolume += Math.abs(nt.amount);
      }
    }
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const sortedProtocols = Object.entries(protocolCounts).sort(([, a], [, b]) => b - a);

  const topTokens: TokenStat[] = Object.values(tokenCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ mint, symbol, count }) => ({ mint, symbol, tradeCount: count }));

  const timeDiffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    timeDiffs.push(sorted[i].timestamp - sorted[i - 1].timestamp);
  }
  const avgTimeBetween = timeDiffs.length > 0
    ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
    : 0;

  const activeDays = activeDaysSet.size;
  const classified = swapCount + transferCount + nftCount + stakeCount;

  return {
    address,
    analyzedAt: Date.now(),
    totalTransactions: transactions.length,
    totalFeesPaid: totalFees / 1e9, // lamports to SOL
    activeProtocols: sortedProtocols.map(([name]) => name),
    firstTransactionDate: sorted[0].timestamp,
    lastTransactionDate: sorted[sorted.length - 1].timestamp,
    activeDays,
    swapCount,
    transferCount,
    nftCount,
    stakeCount,
    otherCount,
    protocolUsage: Object.fromEntries(sortedProtocols),
    uniqueTokensTraded: Object.keys(tokenCounts).length,
    topTokens,
    tradingFrequency: activeDays > 0 ? transactions.length / activeDays : 0,
    peakHour,
    weekdayRatio: transactions.length > 0 ? weekdayTxs / transactions.length : 0.5,
    avgTimeBetweenTxs: avgTimeBetween,
    estimatedVolumeSOL: totalNativeVolume / 1e9,
    analyzedTransactionCount: transactions.length,
    classifiedPercentage: transactions.length > 0
      ? Math.round((classified / transactions.length) * 100)
      : 0,
  };
}

function normalizeProtocolName(source: string): string {
  const mapping: Record<string, string> = {
    JUPITER: 'Jupiter',
    RAYDIUM: 'Raydium',
    ORCA: 'Orca',
    METEORA: 'Meteora',
    MARINADE: 'Marinade',
    TENSOR: 'Tensor',
    MAGIC_EDEN: 'Magic Eden',
    PUMP_FUN: 'Pump.fun',
    DRIFT: 'Drift',
    MARGINFI: 'MarginFi',
    JITO: 'Jito',
    PHANTOM: 'Phantom',
    SOLEND: 'Solend',
    KAMINO: 'Kamino',
  };
  return mapping[source.toUpperCase()] || source;
}

function emptyProfile(address: string): WalletProfile {
  return {
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
  };
}
