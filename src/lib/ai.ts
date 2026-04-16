import type { WalletProfile, AIReport } from './types';
import { getThemeForPersonality } from './themes';

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

export async function generateAIReport(
  profile: WalletProfile,
  apiKey: string
): Promise<AIReport> {
  if (!apiKey) {
    return FALLBACK_REPORT;
  }

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

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      console.error('Claude API error:', res.status, await res.text());
      return FALLBACK_REPORT;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) return FALLBACK_REPORT;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return FALLBACK_REPORT;

    const parsed = JSON.parse(jsonMatch[0]) as AIReport;
    if (!parsed.personality || !parsed.insights || parsed.insights.length < 1) {
      return FALLBACK_REPORT;
    }

    // Ensure themeId is valid, fall back to personality-based matching
    const validThemes = ['cyan', 'orange', 'green', 'violet', 'pink', 'gold'];
    if (!parsed.themeId || !validThemes.includes(parsed.themeId)) {
      parsed.themeId = getThemeForPersonality(parsed.personality).id;
    }

    return parsed;
  } catch (err) {
    console.error('AI generation failed:', err);
    return FALLBACK_REPORT;
  }
}
