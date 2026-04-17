// Parametric SolWrapped Logo SVG generator
// ============================================
// Core innovation: the logo is data-driven. Each wallet's Logo is a visual
// fingerprint of its on-chain behavior.
//
// Mappings:
//   txCount           → particle ring density + core brightness (vitality)
//   tradingFrequency  → dashed ring dash pattern (cadence)
//   protocolCount     → RGB channel offset distance (diversity)
//   swapRatio         → glitch slice count (chaos)
//   peakHour (0-5)    → top-right corner "unwrap" glow (nocturnality)
//   accent color      → subtle tint on highlights
//   seed              → deterministic jitter in particle positions
//
// Output: raw SVG string, viewBox 800x800. Used by both React (Logo.tsx)
// and the sharp-based OG card generator.

export interface LogoParams {
  /** 0-1: particle density + core glow intensity */
  vitality?: number;
  /** 0-1: dashed circle dash pattern density */
  frequency?: number;
  /** 0-1: RGB channel offset distance (2-8px) */
  diversity?: number;
  /** 0-1: glitch slice count and intensity */
  chaos?: number;
  /** 0-1: top-right corner glow intensity (midnight degen signal) */
  nocturne?: number;
  /** Personality accent color (subtle, mixed with purple/teal base) */
  accent?: string;
  /** Deterministic seed (number) — drives particle jitter */
  seed?: number;
  /** Whether to show textual labels below the logo */
  showText?: boolean;
  /** Text content shown below (defaults: "SolWrapped" + tagline) */
  title?: string;
  /** Tagline shown below title */
  tagline?: string;
  /** Overall color mode — default follows design spec */
  mono?: boolean;
}

const CLAMP = (x: number, min = 0, max = 1) => Math.max(min, Math.min(max, x));

/** Seeded PRNG — deterministic jitter for particles */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** hash a string → seed integer */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Particle { x: number; y: number; r: number; opacity: number; }

/** Generate particle positions for one ring */
function generateRing(
  count: number,
  radius: number,
  baseR: number,
  baseOpacity: number,
  rnd: () => number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.15;
    const rJitter = radius + (rnd() - 0.5) * radius * 0.12;
    particles.push({
      x: Math.cos(angle) * rJitter,
      y: Math.sin(angle) * rJitter,
      r: baseR + (rnd() - 0.5) * 0.3,
      opacity: baseOpacity,
    });
  }
  return particles;
}

function particlesToSvg(parts: Particle[], fill: string): string {
  return parts
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${fill}" opacity="${p.opacity.toFixed(2)}"/>`)
    .join('');
}

/**
 * Build the inner contour + particle pupil group for one channel layer
 * Used for both color channels (purple/teal offset) and main white layer
 */
function buildChannelGroup(opts: {
  translateX: number;
  translateY: number;
  opacity: number;
  filter?: string;
  stroke: string; // channel color
  params: Required<Omit<LogoParams, 'accent' | 'title' | 'tagline' | 'mono' | 'showText'>>;
  isMain: boolean;
}): string {
  const { translateX, translateY, opacity, filter, stroke, params, isMain } = opts;
  const { vitality, frequency, diversity, chaos, nocturne } = params;
  const rnd = mulberry32(params.seed);

  // Dashed circle dash pattern — higher frequency = tighter dashes
  const bigDash = `${Math.round(10 + (1 - frequency) * 10)} ${Math.round(5 + (1 - frequency) * 6)}`;
  const innerDash = `${Math.round(8 + (1 - frequency) * 8)} ${Math.round(4 + (1 - frequency) * 5)}`;

  // Particle ring counts — scale with vitality
  const outerCount = Math.round(8 + vitality * 14);   // 8-22
  const midCount = Math.round(6 + vitality * 12);     // 6-18
  const innerCount = Math.round(4 + vitality * 8);    // 4-12

  // Particle radii / opacities — bumped for visibility
  const baseR = isMain ? 1.9 : 1.6;
  const outerOp = isMain ? 0.55 + vitality * 0.2 : 0.5;
  const midOp = isMain ? 0.78 + vitality * 0.15 : 0.68;
  const innerOp = isMain ? 0.95 : 0.8;

  const outerParts = generateRing(outerCount, 38, baseR, outerOp, rnd);
  const midParts = generateRing(midCount, 25, baseR + 0.3, midOp, rnd);
  const innerParts = generateRing(innerCount, 14, baseR + 0.6, innerOp, rnd);

  // Core pupil size scales with vitality
  const coreR = 8 + vitality * 3;         // 8-11
  const coreOp = 0.88 + vitality * 0.1;    // 0.88-0.98

  // Corner glow for nocturne (top-right unwrap)
  const cornerGlowR = isMain ? 6 + nocturne * 8 : 4 + nocturne * 5;
  const cornerGlowOp = isMain ? 0.18 + nocturne * 0.35 : 0.22 + nocturne * 0.3;

  // Stroke width scaling — thicker lines overall
  const sw = (base: number) => isMain ? base * 1.25 : base * 0.9;

  const filterAttr = filter ? ` filter="url(#${filter})"` : '';
  const particleFill = stroke;

  return `
    <g transform="translate(${400 + translateX}, ${355 + translateY})" opacity="${opacity}"${filterAttr}>
      <!-- Topographic contour: 4 nested rects, high contrast -->
      <rect x="-200" y="-200" width="400" height="400" rx="20" fill="none" stroke="${stroke}" stroke-width="${sw(2.2)}" opacity="${isMain ? 0.55 : 0.45}" stroke-dasharray="380 20"/>
      <rect x="-185" y="-185" width="370" height="370" rx="18" fill="none" stroke="${stroke}" stroke-width="${sw(3.2)}" opacity="${isMain ? 0.7 : 0.55}" stroke-dasharray="355 20"/>
      <rect x="-170" y="-170" width="340" height="340" rx="17" fill="none" stroke="${stroke}" stroke-width="${sw(4)}" opacity="${isMain ? 0.85 : 0.65}" stroke-dasharray="325 20"/>
      <rect x="-155" y="-155" width="310" height="310" rx="16" fill="none" stroke="${stroke}" stroke-width="${sw(6.5)}" opacity="${isMain ? 0.98 : 0.8}"/>
      <!-- Top-right unwrap arc -->
      <path d="M 140,-155 Q 155,-155 155,-140" fill="none" stroke="${stroke}" stroke-width="${sw(6.5)}" opacity="${isMain ? 0.98 : 0.8}"/>
      <!-- Corner glow (nocturne) -->
      ${nocturne > 0.1 ? `<circle cx="158" cy="-148" r="${cornerGlowR.toFixed(1)}" fill="${stroke}" opacity="${cornerGlowOp.toFixed(2)}"/>` : ''}

      <!-- Large dashed circle (stays FIXED — the blockchain layer) -->
      <circle cx="0" cy="0" r="112" fill="none" stroke="${stroke}" stroke-width="${sw(7)}" stroke-dasharray="${bigDash}" opacity="${isMain ? 1 : 0.78}"/>

      <!-- IRIS GROUP: inner dashed circle only — tracks at smaller magnitude -->
      <g class="logo-iris">
        <circle cx="-25" cy="0" r="62" fill="none" stroke="${stroke}" stroke-width="${sw(6)}" stroke-dasharray="${innerDash}" opacity="${isMain ? 0.95 : 0.78}"/>
      </g>

      <!-- PUPIL GROUP: particles + core — base offset (-25, 0) centers on iris; inner group tracks cursor -->
      <g transform="translate(-25, 0)">
        <g class="logo-pupil">
          <g fill="${particleFill}">${particlesToSvg(outerParts, particleFill)}</g>
          <g fill="${particleFill}">${particlesToSvg(midParts, particleFill)}</g>
          <g fill="${particleFill}">${particlesToSvg(innerParts, particleFill)}</g>
          <circle cx="0" cy="0" r="${coreR.toFixed(1)}" fill="${stroke}" opacity="${coreOp.toFixed(2)}"/>
          <circle cx="0" cy="0" r="${(coreR * 0.42).toFixed(1)}" fill="${stroke}" opacity="1"/>
          ${isMain ? '<circle cx="-2" cy="-3" r="2.2" fill="#ffffff" opacity="0.85"/>' : ''}
        </g>
      </g>
    </g>
  `;
}

/** Build a set of glitch slice rects scaled by chaos parameter */
function buildGlitchSlices(chaos: number, seed: number): string {
  const rnd = mulberry32(seed + 1337);
  const count = Math.round(4 + chaos * 10); // 4-14 slices
  const slices: string[] = [];
  for (let i = 0; i < count; i++) {
    const y = 240 + rnd() * 360;
    const x = 120 + rnd() * 520;
    const w = 60 + rnd() * 180;
    const h = 1 + rnd() * 3;
    const isPurple = rnd() > 0.5;
    const color = isPurple ? '#9945FF' : '#14F195';
    const op = 0.2 + rnd() * 0.3;
    slices.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(1)}" fill="${color}" opacity="${op.toFixed(2)}"/>`);
  }
  return `<g opacity="${(0.3 + chaos * 0.4).toFixed(2)}">${slices.join('')}</g>`;
}

/**
 * Generate the SolWrapped logo as an SVG string.
 * Output viewBox: 0 0 800 800
 */
export function generateLogo(params: LogoParams = {}): string {
  const {
    vitality = 0.5,
    frequency = 0.5,
    diversity = 0.5,
    chaos = 0.3,
    nocturne = 0.3,
    seed = 42,
    accent = '#e0e0e0',
    showText = false,
    title = 'SolWrapped',
    tagline = 'YOUR WALLET TELLS A STORY',
  } = params;

  // Normalize & clamp all inputs
  const p = {
    vitality: CLAMP(vitality),
    frequency: CLAMP(frequency),
    diversity: CLAMP(diversity),
    chaos: CLAMP(chaos),
    nocturne: CLAMP(nocturne),
    seed: Math.abs(Math.floor(seed)) || 1,
  };

  // RGB channel offset scales with diversity (3-10px)
  const rgbOffset = 3 + p.diversity * 7;

  // Purple channel (left offset)
  const purpleLayer = buildChannelGroup({
    translateX: -rgbOffset,
    translateY: 0,
    opacity: 0.62,
    filter: 'sg',
    stroke: '#9945FF',
    params: p,
    isMain: false,
  });

  // Teal channel (right offset)
  const tealLayer = buildChannelGroup({
    translateX: rgbOffset,
    translateY: 0,
    opacity: 0.62,
    filter: 'sg',
    stroke: '#14F195',
    params: p,
    isMain: false,
  });

  // Main white/grey layer (center)
  const mainLayer = buildChannelGroup({
    translateX: 0,
    translateY: 0,
    opacity: 1,
    filter: 'glow',
    stroke: '#eeeeee',
    params: p,
    isMain: true,
  });

  const glitchSlices = buildGlitchSlices(p.chaos, p.seed);

  // Scan lines (decorative ambient)
  const scanLines = [
    80, 140, 200, 260, 320, 380, 440, 500, 560, 620, 680, 740,
  ]
    .map((y) => `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="#ffffff" stroke-width="0.8" opacity="0.04"/>`)
    .join('');

  // Typography (only if showText, for hero/OG uses)
  const typography = showText
    ? `
    <text x="400" y="665" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="48" font-weight="200" fill="#e0e0e0" letter-spacing="16" opacity="0.9">${title}</text>
    <text x="400" y="700" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="14" fill="#666" letter-spacing="6" opacity="0.6">${tagline}</text>
  `
    : '';

  // Subtle accent tint overlay on top-right (personality nuance)
  const accentTint = accent && accent !== '#e0e0e0'
    ? `<circle cx="620" cy="180" r="120" fill="${accent}" opacity="0.04" filter="url(#glow)"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <filter id="glow" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feFlood flood-color="#ffffff" flood-opacity="0.3"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="sg" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  ${accentTint}
  ${purpleLayer}
  ${tealLayer}
  ${mainLayer}
  ${glitchSlices}
  <g opacity="0.04">${scanLines}</g>
  <rect x="0" y="375" width="800" height="8" fill="#ffffff" opacity="0.035" filter="url(#glow)"/>
  <line x1="0" y1="379" x2="800" y2="379" stroke="#ffffff" stroke-width="1.5" opacity="0.09"/>
  ${typography}
</svg>`;
}

/**
 * Convert a WalletProfile-like object into LogoParams.
 * Import-free (takes a minimal shape) so it works everywhere.
 */
export function profileToLogoParams(profile: {
  totalTransactions: number;
  tradingFrequency: number;
  activeProtocols: string[];
  swapCount: number;
  peakHour: number;
  address: string;
}, accent?: string): LogoParams {
  const txScale = Math.log10(profile.totalTransactions + 1) / Math.log10(5001); // 0-1
  const freqScale = Math.min(profile.tradingFrequency / 20, 1);
  const divScale = Math.min(profile.activeProtocols.length / 12, 1);
  const chaosScale = profile.totalTransactions > 0
    ? profile.swapCount / profile.totalTransactions
    : 0;
  // Nocturne: strongest at midnight UTC, fades to 0 by 6AM
  const nocturneScale = profile.peakHour >= 0 && profile.peakHour <= 5
    ? (5 - profile.peakHour) / 5
    : 0;

  return {
    vitality: txScale,
    frequency: freqScale,
    diversity: divScale,
    chaos: chaosScale,
    nocturne: nocturneScale,
    seed: hashSeed(profile.address),
    accent,
  };
}
