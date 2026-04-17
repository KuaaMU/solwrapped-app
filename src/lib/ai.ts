import type { WalletProfile, AIReport } from './types';
import { getThemeForPersonality } from './themes';
import { generateText } from './llm';

const FALLBACK_REPORT: AIReport = {
  personality: 'Solana Explorer',
  personalityEmoji: '🔍',
  personalityDescription: 'A curious explorer navigating the Solana ecosystem.',
  themeId: 'cyan',
  insights: [
    'Your wallet shows diverse activity across the Solana ecosystem.',
    'You have been active across multiple protocols, showing healthy diversification.',
    'Your transaction patterns suggest a methodical approach to DeFi.',
  ],
  recommendation:
    'Keep exploring new protocols and consider setting up DCA strategies for consistent growth.',
};

const VALID_THEMES = ['cyan', 'orange', 'green', 'violet', 'pink', 'gold'];

export async function generateAIReport(profile: WalletProfile): Promise<AIReport> {
  const dataSummary = {
    totalTxs: profile.totalTransactions,
    activeDays: profile.activeDays,
    swaps: profile.swapCount,
    transfers: profile.transferCount,
    nfts: profile.nftCount,
    stakes: profile.stakeCount,
    topProtocols: Object.entries(profile.protocolUsage).slice(0, 5),
    uniqueTokens: profile.uniqueTokensTraded,
    peakHour: profile.peakHour,
    weekdayRatio: Math.round(profile.weekdayRatio * 100),
    avgTxsPerDay: profile.tradingFrequency.toFixed(1),
    totalFeesSOL: profile.totalFeesPaid.toFixed(4),
    volumeSOL: profile.estimatedVolumeSOL.toFixed(2),
    walletAge: profile.firstTransactionDate
      ? `${Math.round((Date.now() / 1000 - profile.firstTransactionDate) / 86400)} days`
      : 'unknown',
  };

  const systemPrompt = `You are a witty on-chain behavior analyst. Given wallet data, generate a personality profile. Be entertaining but data-driven. Use specific numbers from the data. Write in English.

Output ONLY valid JSON matching this schema:
{
  "personality": "max 4 words, catchy label",
  "personalityEmoji": "single emoji",
  "personalityDescription": "one fun sentence describing this wallet personality",
  "themeId": "one of: cyan, orange, green, violet, pink, gold",
  "insights": ["insight 1 with specific data", "insight 2 with specific data", "insight 3 with specific data"],
  "recommendation": "one actionable suggestion"
}

Theme guide — pick the themeId that best matches the personality:
- orange: degen traders, apes, gamblers, high-frequency midnight traders
- gold: yield farmers, stakers, patient DeFi users
- violet: NFT collectors, artists, creators
- green: whales, OGs, veterans, alpha hunters
- pink: newcomers, explorers, curious fresh wallets
- cyan: diamond hands, hodlers, conviction holders

Rules:
- Each insight MUST reference a specific number from the data
- Be playful and slightly provocative
- Insights should feel personal and surprising
- Do NOT invent numbers not present in the data
- Do NOT mention exact dollar amounts unless provided`;

  const userPrompt = `Analyze this Solana wallet:\n${JSON.stringify(dataSummary, null, 2)}`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 512,
    temperature: 0.7,
  });

  if (!text) return FALLBACK_REPORT;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return FALLBACK_REPORT;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AIReport;
    if (!parsed.personality || !parsed.insights || parsed.insights.length < 1) {
      return FALLBACK_REPORT;
    }
    if (!parsed.themeId || !VALID_THEMES.includes(parsed.themeId)) {
      parsed.themeId = getThemeForPersonality(parsed.personality).id;
    }
    return parsed;
  } catch (err) {
    console.error('[ai] JSON parse failed:', err);
    return FALLBACK_REPORT;
  }
}
