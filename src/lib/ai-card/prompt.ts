// AI art brief generator. Composes an art prompt from two layers:
//   (1) the wallet's personality archetype (always present)
//   (2) a temporal enrichment (festival / solar term / season / anniversary)
//
// The enrichment's `intensity` decides how much it shapes the image:
//   - primary: the enrichment IS the subject; archetype becomes a color modifier
//   - accent:  archetype is the subject; enrichment overlays clearly on top
//   - wash:    archetype is the subject; enrichment only tints the mood
//
// Falls back to a structured template when the LLM is unavailable, preserving
// the same routing logic so the visual result still reflects the enrichment.

import { generateText } from '../llm';
import type { FullReport } from '../types';
import {
  buildTemporalContext,
  resolveEnrichment,
  type EnrichmentIntensity,
  type EnrichmentMode,
  type ResolvedEnrichment,
  type ThemeId,
} from './enrichments';
import { defaultVariantIdx, getVariant, type Variant } from './variants';

const BASE_NEGATIVE = 'no text, no typography, no logos, no watermarks, no faces, no figures';

const SYSTEM_PROMPT = `You are an art director writing prompts for an abstract-art Solana wallet card.
ALWAYS produce ABSTRACT art prompts — NO figures, faces, recognizable objects, text, or typography.
Style anchors: generative art, Refik Anadol data sculptures, Ryoji Ikeda minimal code aesthetic,
geometric abstraction, particle fields, flow fields, color fields.

The user's message has two layers: an ARCHETYPE (the wallet's personality) and an
optional TEMPORAL CONTEXT (festival, solar term, season, anniversary).

Compose the prompt according to this ROUTING RULE based on the TEMPORAL INTENSITY:
- "primary": TEMPORAL IMAGERY is the main subject of the piece. The archetype survives
  only as a color/energy modifier (one clause). The final image must be clearly
  recognizable as the temporal theme.
- "accent":  Archetype is the main subject. TEMPORAL IMAGERY must appear as a visible
  overlay/atmosphere — the viewer must be able to see that the piece is seasonally colored.
- "wash":    Archetype is the subject. TEMPORAL IMAGERY only shifts the color temperature.
- "none":    Archetype is the entire subject. Ignore any temporal context.

Core palette always: dark void (#050505–#0a0a0a) with Solana purple (#9945FF) and
teal (#14F195) accents, plus the archetype's hint color.

Composition: centered focal region with 40% negative space below for text overlay.
No busy corners. Cinematic, gallery-ready.

Every TABOO item in the user message is absolute — do not depict it in any form.

Output ONLY the prompt itself — 60 to 100 English words, no commentary, no headings.
You MUST end the prompt with the provided NEGATIVE BLOCK verbatim.`;

const COLOR_NOTE: Record<ThemeId, string> = {
  orange: 'hot orange + purple/teal edges',
  gold: 'warm amber + faint teal',
  violet: 'Solana violet dominant with teal micro-accents',
  green: 'neon teal-green with violet edges',
  pink: 'rose magenta with violet and teal hints',
  cyan: 'cold cyan with purple highlights',
};

const FLAVOR_BY_PERSONALITY: [RegExp, ThemeId][] = [
  [/degen|midnight|ape|gambl|yolo/i, 'orange'],
  [/monk|yield|farm|stake/i, 'gold'],
  [/pixel|hunter|collect|nft|art/i, 'violet'],
  [/sniper|alpha|whale|og|veteran/i, 'green'],
  [/fresh|explor|newb|baby/i, 'pink'],
  [/diamond|hand|hodl|conviction/i, 'cyan'],
];

function themeFor(report: FullReport): ThemeId {
  const raw = report.ai.themeId;
  if (raw && raw in COLOR_NOTE) return raw as ThemeId;
  const personality = report.ai.personality ?? '';
  for (const [pattern, key] of FLAVOR_BY_PERSONALITY) {
    if (pattern.test(personality)) return key;
  }
  return 'violet';
}

function pickVariant(address: string, themeId: ThemeId, raw?: number): Variant {
  const idx = typeof raw === 'number' && raw >= 0 ? raw : defaultVariantIdx(address);
  return getVariant(themeId, idx);
}

function buildNegative(enrichment: ResolvedEnrichment): string {
  if (enrichment.forbidden.length === 0) return BASE_NEGATIVE;
  return `${BASE_NEGATIVE}, ${enrichment.forbidden.map((s) => `no ${s}`).join(', ')}`;
}

function enforceNegativeTail(text: string, negative: string): string {
  const trimmed = text.trim().replace(/^["']|["']$/g, '');
  return trimmed.toLowerCase().includes('no text')
    ? trimmed
    : trimmed.replace(/[.!]?$/, '') + ', ' + negative;
}

function intensityLabel(i: EnrichmentIntensity, hasEnrichment: boolean): string {
  return hasEnrichment ? i : 'none';
}

/** Fallback renderer — runs when LLM is unavailable. Routes by intensity. */
function renderFallback(
  themeId: ThemeId,
  variant: Variant,
  enrichment: ResolvedEnrichment,
  negative: string
): string {
  const seed = variant.flavor;
  const hasEnrichment = enrichment.id !== '';

  if (!hasEnrichment) {
    return `${seed}. ${variant.styleHint}. Centered focal region with 40% negative space below, gallery-grade abstract composition, ${negative}`;
  }

  const subject =
    enrichment.flavorHint ||
    enrichment.positive.slice(0, 2).join(', ');
  const style = enrichment.styleNotes[0] || '';

  if (enrichment.intensity === 'primary') {
    const color = COLOR_NOTE[themeId];
    return `${subject}. Color mood: ${color}. Style variant: ${variant.styleHint}. ${style}, centered focal region with 40% negative space below, ${negative}`;
  }

  if (enrichment.intensity === 'accent') {
    return `${seed}, overlaid with ${subject}. ${style}, centered focal region with 40% negative space below, ${negative}`;
  }

  // wash
  return `${seed}. Mood tint: ${subject}. ${style}, centered focal region with 40% negative space below, ${negative}`;
}

function buildUserMessage(
  personality: string,
  themeId: ThemeId,
  variant: Variant,
  enrichment: ResolvedEnrichment,
  negative: string
): string {
  const hasEnrichment = enrichment.id !== '';
  const intensity = intensityLabel(enrichment.intensity, hasEnrichment);

  const temporalBlock = hasEnrichment
    ? `TEMPORAL CONTEXT: ${enrichment.id}
TEMPORAL INTENSITY: ${intensity}
TEMPORAL IMAGERY (raw cues):
${enrichment.positive.map((p) => '- ' + p).join('\n')}${
        enrichment.flavorHint
          ? `
ARCHETYPE × TEMPORAL BLEND HINT (use this verbatim as the central image when intensity is "primary"): ${enrichment.flavorHint}`
          : ''
      }${
        enrichment.styleNotes.length
          ? `
STYLE NOTES: ${enrichment.styleNotes.join('; ')}`
          : ''
      }

TABOO — absolutely do not depict in any form, stylized or literal:
${enrichment.forbidden.length ? enrichment.forbidden.map((f) => '- ' + f).join('\n') : '- (none beyond the negative block)'}`
    : 'TEMPORAL CONTEXT: none\nTEMPORAL INTENSITY: none';

  return `ARCHETYPE: "${personality}" (color mood: ${themeId} = ${COLOR_NOTE[themeId]})
STYLE VARIANT: ${variant.id} — ${variant.styleHint}
ARCHETYPE SEED (adopt this variant's angle as the archetype's visual energy; when intensity is "primary", still route temporal as the subject):
"${variant.flavor}"

${temporalBlock}

NEGATIVE BLOCK (append to the end of your output, verbatim, prefixed with a comma):
${negative}

Write a 60-100 word abstract art prompt following the routing rules in the system message.`;
}

export interface BuildArtBriefOptions {
  mode?: EnrichmentMode;
  now?: Date;
  variantIdx?: number;   // -1 / undefined → address-hashed default
}

/** Generate an art brief for a wallet report. Always returns a usable prompt. */
export async function buildArtBrief(
  report: FullReport,
  opts: BuildArtBriefOptions = {}
): Promise<string> {
  const mode = opts.mode ?? 'on';
  const now = opts.now ?? new Date();

  const themeId = themeFor(report);
  const variant = pickVariant(report.profile.address, themeId, opts.variantIdx);
  const temporal = buildTemporalContext(now);
  const enrichment = resolveEnrichment(
    { temporal, profile: { firstTransactionDate: report.profile.firstTransactionDate } },
    mode,
    themeId
  );

  const negative = buildNegative(enrichment);
  const personality = report.ai.personality ?? 'wallet archetype';
  const userMessage = buildUserMessage(personality, themeId, variant, enrichment, negative);

  const text = await generateText({
    system: SYSTEM_PROMPT,
    user: userMessage,
    maxTokens: 320,
    temperature: 0.9,
  });

  if (!text || text.trim().length < 40) return renderFallback(themeId, variant, enrichment, negative);
  return enforceNegativeTail(text, negative);
}

/** Resolves the variant id chosen for a given report + override. */
export function resolveVariantIdFor(
  report: FullReport,
  variantIdx?: number
): string {
  const themeId = themeFor(report);
  const variant = pickVariant(report.profile.address, themeId, variantIdx);
  return variant.id;
}

/** Resolves just the enrichment id — used as part of the cache key. */
export function resolveEnrichmentIdFor(
  report: FullReport,
  mode: EnrichmentMode,
  now: Date = new Date()
): string {
  if (mode === 'off') return '';
  const themeId = themeFor(report);
  const temporal = buildTemporalContext(now);
  return resolveEnrichment(
    { temporal, profile: { firstTransactionDate: report.profile.firstTransactionDate } },
    mode,
    themeId
  ).id;
}
