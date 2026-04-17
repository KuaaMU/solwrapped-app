// SolWrapped theme system
// Per DESIGN-SPEC.md: unified dark base + subtle personality accent tint
// Primary visual identity = logo + Solana purple/teal
// Theme colors here act as MINOR personality flavor, not dominant color

export interface Theme {
  id: string;
  name: string;
  archetype: string;
  accent: string;          // subtle personality tint (15% opacity effective use)
  accentFaint: string;     // 10-15% opacity for backgrounds
  accentGlow: string;      // 15-20% opacity for glows
  // Data-driven logo gets a hint of this color mixed with purple/teal base
}

const themes: Record<string, Theme> = {
  cyan: {
    id: 'cyan',
    name: 'Terminal',
    archetype: 'DIAMOND HANDS',
    accent: '#22d3ee',
    accentFaint: 'rgba(34, 211, 238, 0.1)',
    accentGlow: 'rgba(34, 211, 238, 0.15)',
  },
  orange: {
    id: 'orange',
    name: 'Degen',
    archetype: 'MIDNIGHT DEGEN',
    accent: '#f97316',
    accentFaint: 'rgba(249, 115, 22, 0.1)',
    accentGlow: 'rgba(249, 115, 22, 0.15)',
  },
  green: {
    id: 'green',
    name: 'Matrix',
    archetype: 'ALPHA SNIPER',
    accent: '#14F195', // aligns with Solana teal
    accentFaint: 'rgba(20, 241, 149, 0.1)',
    accentGlow: 'rgba(20, 241, 149, 0.15)',
  },
  violet: {
    id: 'violet',
    name: 'Phantom',
    archetype: 'PIXEL HUNTER',
    accent: '#9945FF', // aligns with Solana purple
    accentFaint: 'rgba(153, 69, 255, 0.1)',
    accentGlow: 'rgba(153, 69, 255, 0.15)',
  },
  pink: {
    id: 'pink',
    name: 'Neon',
    archetype: 'FRESH EXPLORER',
    accent: '#ec4899',
    accentFaint: 'rgba(236, 72, 153, 0.1)',
    accentGlow: 'rgba(236, 72, 153, 0.15)',
  },
  gold: {
    id: 'gold',
    name: 'Yield',
    archetype: 'YIELD MONK',
    accent: '#eab308',
    accentFaint: 'rgba(234, 179, 8, 0.1)',
    accentGlow: 'rgba(234, 179, 8, 0.15)',
  },
};

// Regex patterns — kept from previous iteration, routing personality → theme
const PERSONALITY_THEME_MAP: [RegExp, string][] = [
  [/degen|ape|gambl|midnight|yolo|maxi/i, 'orange'],
  [/yield|farm|monk|stake|patient|disciplin/i, 'gold'],
  [/nft|art|collect|pixel|hunter|creator/i, 'violet'],
  [/whale|og|veteran|legend|alpha|sniper|matrix/i, 'green'],
  [/newb|fresh|explore|curious|baby/i, 'pink'],
  [/diamond|hodl|holder|conviction/i, 'cyan'],
];

export function getThemeForPersonality(personality: string): Theme {
  const lower = personality.toLowerCase();
  for (const [pattern, themeId] of PERSONALITY_THEME_MAP) {
    if (pattern.test(lower)) return themes[themeId];
  }
  return themes.violet; // default → Solana purple
}

export function getThemeById(id: string): Theme {
  return themes[id] || themes.violet;
}

export const allThemes = themes;
export const defaultTheme = themes.violet;
