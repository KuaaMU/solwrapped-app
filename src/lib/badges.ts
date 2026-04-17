// Badge system — achievements + rarity (bronze/silver/gold)
// Colors map to DESIGN-SPEC.md:
//   bronze = white (#e0e0e0)   — common achievement
//   silver = purple (#9945FF)  — notable achievement
//   gold   = teal (#14F195)    — elite achievement

import type { WalletProfile, Badge } from './types';

// Colosseum Frontier 2026 event window (UTC)
const FRONTIER_START = new Date('2026-04-06T00:00:00Z').getTime();
const FRONTIER_END = new Date('2026-05-11T23:59:59Z').getTime();

export const BADGE_COLORS: Record<'bronze' | 'silver' | 'gold', string> = {
  bronze: '#e0e0e0',
  silver: '#9945FF',
  gold: '#14F195',
};

export function computeBadges(profile: WalletProfile, now: number = Date.now()): Badge[] {
  const badges: Badge[] = [];

  // --- TRADER: total transaction count ---
  if (profile.totalTransactions >= 5000) {
    badges.push({ id: 'trader', label: 'TRADER', rarity: 'gold', description: '5000+ transactions — top 1% of active wallets.' });
  } else if (profile.totalTransactions >= 1000) {
    badges.push({ id: 'trader', label: 'TRADER', rarity: 'silver', description: '1000+ transactions — a seasoned operator.' });
  } else if (profile.totalTransactions >= 100) {
    badges.push({ id: 'trader', label: 'TRADER', rarity: 'bronze', description: '100+ transactions — actively engaged.' });
  }

  // --- DIAMOND: staking activity ---
  if (profile.stakeCount >= 50) {
    badges.push({ id: 'diamond', label: 'DIAMOND', rarity: 'gold', description: '50+ staking operations — serious conviction.' });
  } else if (profile.stakeCount >= 20) {
    badges.push({ id: 'diamond', label: 'DIAMOND', rarity: 'silver', description: '20+ stakes — disciplined yield seeker.' });
  } else if (profile.stakeCount >= 5) {
    badges.push({ id: 'diamond', label: 'DIAMOND', rarity: 'bronze', description: '5+ stakes — you believe in the long game.' });
  }

  // --- EXPLORER: protocol diversity ---
  if (profile.activeProtocols.length >= 10) {
    badges.push({ id: 'explorer', label: 'EXPLORER', rarity: 'gold', description: '10+ protocols used — a true ecosystem explorer.' });
  } else if (profile.activeProtocols.length >= 5) {
    badges.push({ id: 'explorer', label: 'EXPLORER', rarity: 'silver', description: '5+ protocols used — you know your way around.' });
  } else if (profile.activeProtocols.length >= 3) {
    badges.push({ id: 'explorer', label: 'EXPLORER', rarity: 'bronze', description: '3+ protocols used — branching out.' });
  }

  // --- NFT ---
  if (profile.nftCount >= 100) {
    badges.push({ id: 'nft', label: 'COLLECTOR', rarity: 'gold', description: '100+ NFT transactions — serious collector energy.' });
  } else if (profile.nftCount >= 50) {
    badges.push({ id: 'nft', label: 'COLLECTOR', rarity: 'silver', description: '50+ NFT transactions — an active collector.' });
  } else if (profile.nftCount >= 10) {
    badges.push({ id: 'nft', label: 'COLLECTOR', rarity: 'bronze', description: '10+ NFT transactions — dipping into digital art.' });
  }

  // --- NIGHT OWL: peak trading hour in 0-5 UTC range ---
  if (profile.peakHour >= 0 && profile.peakHour <= 5) {
    badges.push({ id: 'night-owl', label: 'NIGHT OWL', rarity: 'bronze', description: `Peak trading hour: ${String(profile.peakHour).padStart(2, '0')}:00 UTC — you trade while the world sleeps.` });
  }

  // --- PUMP SURVIVOR ---
  const pumpUsage = profile.protocolUsage['Pump.fun'] ?? 0;
  if (pumpUsage >= 10) {
    badges.push({ id: 'pump-survivor', label: 'PUMP', rarity: 'silver', description: `${pumpUsage} Pump.fun transactions — you've seen things.` });
  }

  // --- FRONTIER 2026: limited edition during hackathon window ---
  if (now >= FRONTIER_START && now <= FRONTIER_END) {
    badges.push({ id: 'frontier-26', label: 'FRONTIER 26', rarity: 'gold', description: 'Generated during Colosseum Frontier 2026 — a limited commemorative badge.' });
  }

  // Sort: gold → silver → bronze
  const rarityOrder = { gold: 0, silver: 1, bronze: 2 };
  badges.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  return badges;
}
