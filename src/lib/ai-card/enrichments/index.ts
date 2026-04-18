// Enrichment registry. Resolves the single highest-priority enrichment that
// matches the current temporal + profile context, honoring the user's mode
// toggle (`on` | `festival-only` | `off`).

import type {
  EnrichmentMode,
  EnrichmentRuntime,
  PromptEnrichment,
  ResolvedEnrichment,
  ThemeId,
} from './types';
import { FESTIVALS } from './festivals';
import { SOLAR_TERMS } from './solar-terms';
import { SEASONS } from './seasons';
import { WALLET_EVENTS } from './wallet-events';

const REGISTRY: PromptEnrichment[] = [
  ...WALLET_EVENTS,
  ...FESTIVALS,
  ...SOLAR_TERMS,
  ...SEASONS,
].sort((a, b) => b.priority - a.priority);

const EMPTY: ResolvedEnrichment = {
  id: '',
  intensity: 'wash',
  positive: [],
  forbidden: [],
  styleNotes: [],
  flavorHint: '',
};

function allow(mode: EnrichmentMode, e: PromptEnrichment): boolean {
  if (mode === 'off') return false;
  if (mode === 'festival-only') {
    return e.id.startsWith('festival-') || e.id === 'wallet-anniversary';
  }
  return true;
}

export function resolveEnrichment(
  ctx: EnrichmentRuntime,
  mode: EnrichmentMode,
  themeId?: ThemeId
): ResolvedEnrichment {
  if (mode === 'off') return EMPTY;

  for (const e of REGISTRY) {
    if (!allow(mode, e)) continue;
    if (!e.matches(ctx)) continue;
    const flavorHint = themeId && e.flavorMap?.[themeId] ? e.flavorMap[themeId]! : '';
    return {
      id: e.id,
      intensity: e.intensity,
      positive: [...e.positive],
      forbidden: [...e.forbidden],
      styleNotes: [...(e.styleNotes ?? [])],
      flavorHint,
    };
  }
  return EMPTY;
}

export function parseMode(raw: string | null | undefined): EnrichmentMode {
  if (raw === 'off' || raw === 'festival-only') return raw;
  return 'on';
}

export { buildTemporalContext } from './temporal-context';
export type {
  EnrichmentIntensity,
  EnrichmentMode,
  EnrichmentRuntime,
  PromptEnrichment,
  ResolvedEnrichment,
  TemporalContext,
  ThemeId,
} from './types';
