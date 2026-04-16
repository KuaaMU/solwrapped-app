// Theme system for SolWrapped personality-based visual theming

export interface Theme {
  id: string;
  name: string;
  primary: string;       // main accent color
  secondary: string;     // supporting color
  bg: string;            // background tint (used for gradients)
  glow: string;          // glow/bloom color (rgba)
  primaryDim: string;    // low-opacity primary
  barColors: {
    swap: string;
    transfer: string;
    nft: string;
    stake: string;
  };
}

const themes: Record<string, Theme> = {
  cyan: {
    id: 'cyan',
    name: 'Terminal',
    primary: '#22d3ee',
    secondary: '#06b6d4',
    bg: '#041f26',
    glow: 'rgba(34, 211, 238, 0.25)',
    primaryDim: 'rgba(34, 211, 238, 0.15)',
    barColors: { swap: '#22d3ee', transfer: '#f97316', nft: '#a78bfa', stake: '#22c55e' },
  },
  orange: {
    id: 'orange',
    name: 'Degen',
    primary: '#f97316',
    secondary: '#fb923c',
    bg: '#261304',
    glow: 'rgba(249, 115, 22, 0.25)',
    primaryDim: 'rgba(249, 115, 22, 0.15)',
    barColors: { swap: '#f97316', transfer: '#22d3ee', nft: '#a78bfa', stake: '#22c55e' },
  },
  green: {
    id: 'green',
    name: 'Matrix',
    primary: '#22c55e',
    secondary: '#4ade80',
    bg: '#042610',
    glow: 'rgba(34, 197, 94, 0.25)',
    primaryDim: 'rgba(34, 197, 94, 0.15)',
    barColors: { swap: '#22c55e', transfer: '#f97316', nft: '#a78bfa', stake: '#22d3ee' },
  },
  violet: {
    id: 'violet',
    name: 'Phantom',
    primary: '#a78bfa',
    secondary: '#c4b5fd',
    bg: '#1a0e2e',
    glow: 'rgba(167, 139, 250, 0.25)',
    primaryDim: 'rgba(167, 139, 250, 0.15)',
    barColors: { swap: '#a78bfa', transfer: '#f97316', nft: '#22d3ee', stake: '#22c55e' },
  },
  pink: {
    id: 'pink',
    name: 'Neon',
    primary: '#ec4899',
    secondary: '#f472b6',
    bg: '#2e0a1e',
    glow: 'rgba(236, 72, 153, 0.25)',
    primaryDim: 'rgba(236, 72, 153, 0.15)',
    barColors: { swap: '#ec4899', transfer: '#f97316', nft: '#a78bfa', stake: '#22c55e' },
  },
  gold: {
    id: 'gold',
    name: 'Yield',
    primary: '#eab308',
    secondary: '#facc15',
    bg: '#261e04',
    glow: 'rgba(234, 179, 8, 0.25)',
    primaryDim: 'rgba(234, 179, 8, 0.15)',
    barColors: { swap: '#eab308', transfer: '#f97316', nft: '#a78bfa', stake: '#22c55e' },
  },
};

// Map personality keywords to theme IDs
const PERSONALITY_THEME_MAP: [RegExp, string][] = [
  [/degen|ape|gambl|midnight|yolo|maxi/i, 'orange'],
  [/yield|farm|monk|stake|patient|disciplin/i, 'gold'],
  [/nft|art|collect|pixel|hunter|creator/i, 'violet'],
  [/whale|og|veteran|legend|alpha/i, 'green'],
  [/newb|fresh|explore|curious|baby/i, 'pink'],
  [/diamond|hodl|holder|conviction/i, 'cyan'],
];

export function getThemeForPersonality(personality: string): Theme {
  const lower = personality.toLowerCase();
  for (const [pattern, themeId] of PERSONALITY_THEME_MAP) {
    if (pattern.test(lower)) {
      return themes[themeId];
    }
  }
  return themes.cyan; // default
}

export function getThemeById(id: string): Theme {
  return themes[id] || themes.cyan;
}

export const allThemes = themes;
export const defaultTheme = themes.cyan;
