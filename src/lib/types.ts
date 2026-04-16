// Core types for SolWrapped

export interface HeliusTransaction {
  signature: string;
  description: string;
  type: TransactionType;
  source: string;
  timestamp: number;
  fee: number;
  feePayer: string;
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  accountData: AccountData[];
  events: Record<string, unknown>;
}

export type TransactionType =
  | 'SWAP'
  | 'TRANSFER'
  | 'NFT_SALE'
  | 'NFT_LISTING'
  | 'NFT_MINT'
  | 'NFT_BID'
  | 'NFT_CANCEL_LISTING'
  | 'BURN'
  | 'BURN_NFT'
  | 'STAKE_SOL'
  | 'UNSTAKE_SOL'
  | 'CREATE_ACCOUNT'
  | 'CLOSE_ACCOUNT'
  | 'COMPRESSED_NFT_MINT'
  | 'TOKEN_MINT'
  | 'UNKNOWN';

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number; // lamports
}

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: string;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface TokenBalanceChange {
  userAccount: string;
  tokenAccount: string;
  mint: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
}

// Aggregated wallet profile
export interface WalletProfile {
  address: string;
  analyzedAt: number;

  // Basic stats
  totalTransactions: number;
  totalFeesPaid: number; // in SOL
  activeProtocols: string[];
  firstTransactionDate: number;
  lastTransactionDate: number;
  activeDays: number;

  // Transaction breakdown
  swapCount: number;
  transferCount: number;
  nftCount: number;
  stakeCount: number;
  otherCount: number;

  // Protocol usage
  protocolUsage: Record<string, number>;

  // Token stats
  uniqueTokensTraded: number;
  topTokens: TokenStat[];

  // Behavioral patterns
  tradingFrequency: number; // avg txs per active day
  peakHour: number; // 0-23
  weekdayRatio: number; // 0-1, higher = more weekday trading
  avgTimeBetweenTxs: number; // seconds

  // Volume estimates (approximate)
  estimatedVolumeSOL: number;

  // Coverage
  analyzedTransactionCount: number;
  classifiedPercentage: number; // what % we could classify
}

export interface TokenStat {
  mint: string;
  symbol: string;
  tradeCount: number;
}

// AI-generated report
export interface AIReport {
  personality: string;
  personalityEmoji: string;
  personalityDescription: string;
  themeId: string; // maps to Theme in themes.ts
  insights: string[];
  recommendation: string;
}

// Full report combining profile + AI
export interface FullReport {
  profile: WalletProfile;
  ai: AIReport;
  generatedAt: number;
  version: string;
}

// API response types
export interface AnalyzeResponse {
  status: 'processing' | 'complete' | 'error';
  report?: FullReport;
  quickPreview?: Partial<WalletProfile>;
  error?: string;
  progress?: {
    fetched: number;
    total: number;
  };
}

// Cache entry
export interface CacheEntry {
  address: string;
  report: string; // JSON stringified FullReport
  createdAt: number;
  expiresAt: number;
}
