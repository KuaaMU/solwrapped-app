// Sharp composition pipeline — AI background + dark gradient + parametric logo + text overlay.
// Output: 1200x630 PNG suitable for OG card.
//
// Text is rasterized via @resvg/resvg-js (not sharp/librsvg) because librsvg's
// @font-face data-URI support is unreliable on Vercel's Linux runtime —
// unembedded system fonts resolve to .notdef (tofu squares). resvg-js takes
// explicit font buffers, bypassing fontconfig entirely.

import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateLogo, profileToLogoParams } from '../logo-svg';
import type { FullReport } from '../types';

const OUT_W = 1200;
const OUT_H = 630;

// Resolve font file paths that Next.js file tracing will bundle. The
// fs.readFileSync call is the trace signal; the resolved string is what resvg
// expects (v2 takes file paths, not buffers).
function fontFilePath(file: string): string {
  const url = new URL(`./fonts/${file}`, import.meta.url);
  fs.readFileSync(url);
  return fileURLToPath(url);
}

const FONT_FILES = [
  fontFilePath('Inter-Regular.ttf'),
  fontFilePath('Inter-Light.ttf'),
  fontFilePath('JetBrainsMono-Regular.ttf'),
];

// Bottom darkening gradient + subtle top vignette for text legibility.
function buildOverlaySvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}">
    <defs>
      <linearGradient id="bottom" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.95"/>
        <stop offset="35%" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="70%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.6"/>
        <stop offset="40%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${OUT_W}" height="${OUT_H}" fill="url(#top)"/>
    <rect width="${OUT_W}" height="${OUT_H}" fill="url(#bottom)"/>
  </svg>`;
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

function buildTextSvg(report: FullReport): string {
  const personality = (report.ai.personality ?? 'WALLET').toUpperCase();
  const accent = '#14F195';
  const txs = fmtAmount(report.profile.totalTransactions);
  const days = fmtAmount(report.profile.activeDays);
  const vol = report.profile.estimatedVolumeSOL.toFixed(1);
  const addr = report.profile.address;
  const shortAddr = addr.length > 12 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  const frontierActive = report.badges?.some((b) => b.id === 'frontier-26');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}">
    <!-- Brand wordmark — below top-left logo -->
    <g transform="translate(200, 82)">
      <text font-family="Inter" font-weight="400" font-size="38" letter-spacing="6" fill="#ffffff">SolWrapped</text>
      <text font-family="JetBrains Mono" font-weight="400" font-size="20" letter-spacing="4" fill="#d0d0d0" y="32">WALLET TELLS A STORY</text>
    </g>

    <!-- Personality name — bottom-left -->
    <g transform="translate(40, ${OUT_H - 90})">
      <text font-family="Inter" font-weight="400" font-size="64" letter-spacing="3" fill="#ffffff">${personality}</text>
    </g>

    <!-- Stats row -->
    <g transform="translate(40, ${OUT_H - 50})">
      <text font-family="JetBrains Mono" font-weight="400" font-size="26" letter-spacing="1" fill="#ffffff">
        <tspan fill="${accent}">${txs}</tspan> TX
        <tspan dx="12" fill="${accent}">${days}</tspan> DAYS
        <tspan dx="12" fill="${accent}">${vol}</tspan> SOL
      </text>
    </g>

    <!-- Address — bottom-right -->
    <g transform="translate(${OUT_W - 40}, ${OUT_H - 24})">
      <text font-family="JetBrains Mono" font-weight="400" font-size="26" letter-spacing="1" fill="#b8b8b8" text-anchor="end">${shortAddr}</text>
    </g>

    ${frontierActive ? `
    <!-- Frontier 26 gold chip — top-right to avoid colliding with the big stats row -->
    <g transform="translate(${OUT_W - 236}, 42)">
      <rect x="0" y="0" width="196" height="40" rx="2" fill="${accent}" opacity="0.95"/>
      <text font-family="JetBrains Mono" font-weight="400" font-size="18" letter-spacing="3" fill="#050505" x="18" y="26">FRONTIER 26</text>
    </g>` : ''}
  </svg>`;
}

/**
 * Composite an AI background with the parametric logo watermark + text overlay.
 * Returns a 1200x630 PNG buffer, or null if any stage fails (caller falls back
 * to the Satori OG card).
 */
export async function composeCard(
  background: Buffer,
  report: FullReport
): Promise<Buffer | null> {
  try {
    // 1. Prep background: resize to 1200x630 (cover), slight darkening
    const bg = await sharp(background)
      .resize(OUT_W, OUT_H, { fit: 'cover', position: 'attention' })
      .modulate({ brightness: 0.88, saturation: 1.05 })
      .png()
      .toBuffer();

    // 2. Parametric logo watermark (140x140, top-left) — pure paths, no text
    const logoSvg = generateLogo({
      ...profileToLogoParams(report.profile),
      showText: false,
    });
    const logoSize = 140;
    const logo = await sharp(Buffer.from(logoSvg))
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    // 3. Rasterize text SVG through resvg with explicit font files
    const textPng = new Resvg(buildTextSvg(report), {
      font: { fontFiles: FONT_FILES, loadSystemFonts: false },
      fitTo: { mode: 'original' },
    })
      .render()
      .asPng();

    // 4. Composite: bg → gradient overlay (SVG, no text) → logo → text
    const overlay = Buffer.from(buildOverlaySvg());
    return sharp(bg)
      .composite([
        { input: overlay, top: 0, left: 0 },
        { input: logo, top: 30, left: 30 },
        { input: textPng, top: 0, left: 0 },
      ])
      .png({ compressionLevel: 8 })
      .toBuffer();
  } catch (err) {
    console.error('[compositor] composeCard failed:', err);
    return null;
  }
}
