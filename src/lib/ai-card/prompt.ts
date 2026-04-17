// AI art brief generator — writes a short abstract-art prompt for fal.ai.
// Uses the LLM abstraction; falls back to a seed template when no LLM is configured.

import { generateText } from '../llm';
import type { FullReport } from '../types';

const SYSTEM_PROMPT = `You are an art director for a Solana wallet personality card.
ALWAYS produce ABSTRACT art prompts — NO figures, faces, recognizable objects, text, or typography.
Style anchors: generative art, Refik Anadol data sculptures, Ryoji Ikeda minimal code aesthetic,
geometric abstraction, particle fields, flow fields, color fields.

Core palette ALWAYS: dark void background (#050505 to #0a0a0a),
Solana neon purple (#9945FF) and teal (#14F195) accents,
plus the personality-specific hint color.

Composition: centered focal region with 40% negative space for text overlay below.
No busy corners. Cinematic, gallery-ready, high contrast.

Output ONLY the prompt itself — 60 to 100 English words, no commentary, no headings.
You MUST end the prompt with: "no text, no typography, no logos, no watermarks, no faces, no figures"`;

// One flavor line per archetype. Used as both LLM few-shot seed and hardcoded fallback.
const FLAVOR_SEEDS: Record<string, string> = {
  orange:
    'Chaotic orange plasma streaks through a dark void, fragmented geometric shards drifting at angles, high-energy noise field, neon purple and teal sparks bleeding through cracks, cinematic depth, generative particle storm',
  gold:
    'Serene gold liquid metal flowing in concentric ripples across a black void, zen minimalism, warm amber glow radiating from a single focal point, faint teal undertones, meditative composition, Ryoji Ikeda-inspired calm',
  violet:
    'Violet pixel fragments drifting through darkness, glitched geometric shards arranged as a gallery installation, Solana purple dominant, teal micro-accents, surreal abstract composition, Refik Anadol data sculpture aesthetic',
  green:
    'Neon green grid collapsing into a particle cloud over a black void, tactical radar rings, matrix-precision geometric flow, Solana teal dominant with purple edge-lighting, high-contrast precision',
  pink:
    'Pink and magenta nebula particles blooming outward in a cosmic aurora, optimistic abstract energy, soft gradient field over dark void, subtle purple and teal undertones, ethereal generative bloom',
  cyan:
    'Cyan crystalline refractions across a frozen geometric lattice, icy precision, glass-like clarity, deep black void background, teal dominant with cold purple highlights, minimal composition, gallery lighting',
};

const FLAVOR_BY_PERSONALITY: [RegExp, keyof typeof FLAVOR_SEEDS][] = [
  [/degen|midnight|ape|gambl|yolo/i, 'orange'],
  [/monk|yield|farm|stake/i, 'gold'],
  [/pixel|hunter|collect|nft|art/i, 'violet'],
  [/sniper|alpha|whale|og|veteran/i, 'green'],
  [/fresh|explor|newb|baby/i, 'pink'],
  [/diamond|hand|hodl|conviction/i, 'cyan'],
];

function seedFor(report: FullReport): string {
  const themeId = report.ai.themeId;
  if (themeId && FLAVOR_SEEDS[themeId]) return FLAVOR_SEEDS[themeId];
  const personality = report.ai.personality ?? '';
  for (const [pattern, key] of FLAVOR_BY_PERSONALITY) {
    if (pattern.test(personality)) return FLAVOR_SEEDS[key];
  }
  return FLAVOR_SEEDS.violet;
}

const NEGATIVE_TAIL = ', no text, no typography, no logos, no watermarks, no faces, no figures';

/** Ensure a negative-prompt tail is present regardless of LLM compliance. */
function enforceNegative(text: string): string {
  const trimmed = text.trim().replace(/^"|"$/g, '');
  return /no text.*no typography/i.test(trimmed)
    ? trimmed
    : trimmed.replace(/[.!]?$/, '') + NEGATIVE_TAIL;
}

/** Generate an art brief for a wallet report. Always returns a usable prompt. */
export async function buildArtBrief(report: FullReport): Promise<string> {
  const seed = seedFor(report);
  const { personality = 'wallet archetype' } = report.ai;
  const { totalTransactions, peakHour, swapCount, activeProtocols } = report.profile;

  const userPrompt = `Wallet archetype: "${personality}".
Signal:
- ${totalTransactions} total transactions, ${swapCount} swaps
- peak activity hour: ${peakHour} UTC
- ${activeProtocols.length} active protocols

Reference style seed for this archetype:
"${seed}"

Write a 60-100 word abstract art prompt that matches this archetype, following the system rules.`;

  const text = await generateText({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 260,
    temperature: 0.9,
  });

  if (!text || text.trim().length < 40) return enforceNegative(seed);
  return enforceNegative(text);
}
