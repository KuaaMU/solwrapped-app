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
    <style>
      .brand { font: 300 20px 'Inter'; letter-spacing: 6px; fill: #e0e0e0; }
      .brand-sub { font: 400 11px 'JetBrains Mono'; letter-spacing: 4px; fill: #777; }
      .personality { font: 300 96px 'Inter'; letter-spacing: 7px; fill: #f5f5f5; }
      .stats { font: 400 20px 'JetBrains Mono'; letter-spacing: 3px; fill: #aaa; }
      .addr { font: 400 14px 'JetBrains Mono'; letter-spacing: 2px; fill: #888; }
      .accent { fill: ${accent}; }
      .chip-text { font: 400 12px 'JetBrains Mono'; letter-spacing: 3px; fill: #050505; }
    </style>

    <!-- Brand wordmark — below top-left logo -->
    <g transform="translate(200, 72)">
      <text class="brand">SolWrapped</text>
      <text class="brand-sub" y="22">WALLET TELLS A STORY</text>
    </g>

    <!-- Personality name — bottom-left -->
    <g transform="translate(40, ${OUT_H - 110})">
      <text class="personality">${personality}</text>
    </g>

    <!-- Stats row -->
    <g transform="translate(40, ${OUT_H - 62})">
      <text class="stats">
        <tspan class="accent">${txs}</tspan> TX
        <tspan dx="14" class="accent">${days}</tspan> DAYS
        <tspan dx="14" class="accent">${vol}</tspan> SOL
      </text>
    </g>

    <!-- Address — bottom-right -->
    <g transform="translate(${OUT_W - 40}, ${OUT_H - 40})">
      <text class="addr" text-anchor="end">${shortAddr}</text>
    </g>

    ${frontierActive ? `
    <!-- Frontier 26 gold chip — bottom-right above address -->
    <g transform="translate(${OUT_W - 180}, ${OUT_H - 92})">
      <rect x="0" y="0" width="140" height="28" rx="2" fill="${accent}" opacity="0.92"/>
      <text class="chip-text" x="14" y="19">FRONTIER 26</text>
    </g>` : ''}
  </svg>`;
}

/**
 * Composite an AI background with the parametric logo watermark + text overlay.
 * Returns a 1200x630 PNG buffer.
 */
export async function composeCard(
  background: Buffer,
  report: FullReport
): Promise<Buffer> {
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
}
