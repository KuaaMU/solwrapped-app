// Style "variants" — rotatable lenses on the same archetype. Gives the AI card
// an "抽卡" feel: same wallet can reroll into CHAOS / GRID / MELT / PULSE and
// each variant produces a visibly different interpretation of the personality.
//
// Cache is keyed on the variant id so every combination is independently cached.
// First-visit variant is deterministic from the wallet address (feels like fate);
// REROLL bumps the index, cycling through the pool.

import type { ThemeId } from './enrichments';

export interface Variant {
  id: string;              // short uppercase label shown in UI
  flavor: string;          // prompt fragment — becomes the archetype seed this turn
  styleHint: string;       // one-line mood/style note
}

export const VARIANTS_BY_THEME: Record<ThemeId, Variant[]> = {
  orange: [
    { id: 'CHAOS', flavor: 'explosive orange plasma shards fragmenting across dark void, volatile high-energy particle storm', styleHint: 'chaotic turbulent energy' },
    { id: 'GRID', flavor: 'orange geometric grid collapsing into a digital glitch field, crt-scanline artifacts over black', styleHint: 'cyber-tactical precision' },
    { id: 'MELT', flavor: 'molten liquid orange flowing viscously across dark void, slow-motion lava drip abstraction', styleHint: 'organic viscous flow' },
    { id: 'PULSE', flavor: 'rhythmic radial orange pulses over dark void, strobing concentric energy rings', styleHint: 'kinetic periodic rhythm' },
  ],
  gold: [
    { id: 'ZEN', flavor: 'serene gold ripples in slow concentric stillness across black void', styleHint: 'meditative minimal' },
    { id: 'LATTICE', flavor: 'golden hexagonal lattice unfolding across dark void, delicate architectural geometry', styleHint: 'architectural precision' },
    { id: 'BLOOM', flavor: 'warm gold particle bloom expanding outward from a single focal point in black', styleHint: 'organic radiance' },
    { id: 'ALLOY', flavor: 'burnished amber metallic surface with fine etched geometric channels, dignified and restrained', styleHint: 'material dignity' },
  ],
  violet: [
    { id: 'SHARDS', flavor: 'violet pixel fragments drifting as a gallery installation across black void', styleHint: 'curated abstraction' },
    { id: 'NEBULA', flavor: 'deep violet nebula dust with slow particle currents, cosmic drift over dark expanse', styleHint: 'cosmic drift' },
    { id: 'MOSAIC', flavor: 'violet tessellated mosaic with glitch dislocations, structured fragmentation', styleHint: 'structured decay' },
    { id: 'PRISM', flavor: 'violet prismatic refractions across a crystalline void, light splitting into geometric spectra', styleHint: 'refractive clarity' },
  ],
  green: [
    { id: 'RADAR', flavor: 'neon green tactical radar rings sweeping across dark void, precision targeting geometry', styleHint: 'scan-lock energy' },
    { id: 'MATRIX', flavor: 'cascading green data stream collapsing into flow-field over black, code-rain abstraction', styleHint: 'code aesthetic' },
    { id: 'BLADE', flavor: 'sharp neon green geometric blades slicing clean lines across dark void', styleHint: 'surgical precision' },
    { id: 'CANOPY', flavor: 'dense emerald particle canopy filtering deep through black, layered organic pattern', styleHint: 'dense organic' },
  ],
  pink: [
    { id: 'AURORA', flavor: 'soft pink aurora waves rolling across dark expanse, gentle cosmic bands', styleHint: 'gentle cosmic' },
    { id: 'BLOOM', flavor: 'pink nebular bloom particles expanding optimistically over black void', styleHint: 'hopeful expansion' },
    { id: 'MIST', flavor: 'pink-magenta mist drifting through slow currents over dark void, dreamlike haze', styleHint: 'dreamlike haze' },
    { id: 'PETAL', flavor: 'pink abstract petal fragments descending in slow motion across black', styleHint: 'ephemeral descent' },
  ],
  cyan: [
    { id: 'ICE', flavor: 'cyan crystalline lattice with frost refractions across dark void, frozen geometry', styleHint: 'frozen precision' },
    { id: 'WAVE', flavor: 'cyan frequency interference wave patterns across black, oscillating signal abstraction', styleHint: 'oscillating clarity' },
    { id: 'GLASS', flavor: 'layered cyan glass planes with subtle refractive distortions over void', styleHint: 'transparent depth' },
    { id: 'STARS', flavor: 'cyan micro-stars scattered across a black crystalline field, astral calm', styleHint: 'astral calm' },
  ],
};

export const VARIANTS_PER_THEME = 4;

/** Deterministic first-visit variant — hash the address so it feels like fate. */
export function defaultVariantIdx(address: string): number {
  let hash = 5381;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) + hash + address.charCodeAt(i)) >>> 0;
  }
  return hash % VARIANTS_PER_THEME;
}

export function getVariant(themeId: ThemeId, idx: number): Variant {
  const pool = VARIANTS_BY_THEME[themeId] ?? VARIANTS_BY_THEME.violet;
  const safeIdx = ((idx % pool.length) + pool.length) % pool.length;
  return pool[safeIdx];
}

export function normalizeVariantIdx(raw: number | string | null | undefined): number {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return -1; // sentinel: use default
  return Math.max(0, Math.floor(n)) % VARIANTS_PER_THEME;
}
