// Wallet-centric enrichments — priority 90. Based on `profile` data passed
// through the runtime context. Currently: N-year on-chain anniversary bloom.

import type { PromptEnrichment } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** True if a nearby-year boundary was crossed recently. `firstMs` is milliseconds. */
function nearAnniversary(firstMs: number, nowMs: number, windowDays = 2): number | null {
  if (!firstMs || firstMs >= nowMs) return null;
  const yearsExact = (nowMs - firstMs) / (365.25 * DAY_MS);
  const rounded = Math.round(yearsExact);
  if (rounded < 1) return null;
  const diffDays = Math.abs(yearsExact - rounded) * 365.25;
  return diffDays <= windowDays ? rounded : null;
}

export const WALLET_EVENTS: PromptEnrichment[] = [
  {
    id: 'wallet-anniversary',
    priority: 90,
    intensity: 'primary',
    matches: (ctx) => {
      const firstSeconds = ctx.profile?.firstTransactionDate;
      if (!firstSeconds) return false;
      // WalletProfile stores timestamp in UNIX seconds; convert to ms here.
      return nearAnniversary(firstSeconds * 1000, ctx.temporal.now.getTime()) !== null;
    },
    positive: [
      'firework-burst particle bloom at focal center',
      'radial concentric rings expanding outward, commemorative energy',
      'luminous gold-violet confetti abstracted into flow-field',
      'celebratory anniversary aura over dark void',
    ],
    forbidden: ['literal number digits', 'balloons', 'cake', 'crowds'],
    styleNotes: ['celebratory but tasteful, focal radial composition'],
  },
];
