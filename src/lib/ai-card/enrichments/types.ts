// Types for the pluggable prompt-enrichment registry (W2.8).

export type ThemeId = 'orange' | 'gold' | 'violet' | 'green' | 'pink' | 'cyan';

export type EnrichmentMode = 'on' | 'festival-only' | 'off';

/**
 * How strongly the enrichment should shape the final image.
 * - `primary`: temporal imagery IS the subject. Archetype becomes a color/energy modifier.
 * - `accent`:  archetype stays the subject; temporal imagery overlays clearly on top.
 * - `wash`:    archetype stays the subject; temporal context only shifts mood/color.
 */
export type EnrichmentIntensity = 'primary' | 'accent' | 'wash';

export interface TemporalContext {
  now: Date;
  localDate: string;     // YYYY-MM-DD, CN timezone (UTC+8)
  month: number;         // 1-12 (solar)
  day: number;           // 1-31 (solar)
  lunarMonth: number;    // 1-12 (negative if leap)
  lunarDay: number;      // 1-30
  solarTerm: string;     // current day's solar term name in 中文, '' if none
}

export interface EnrichmentRuntime {
  temporal: TemporalContext;
  profile?: {
    firstTransactionDate?: number;  // UNIX seconds, per WalletProfile
  };
}

export interface PromptEnrichment {
  id: string;
  priority: number;
  intensity: EnrichmentIntensity;
  matches(ctx: EnrichmentRuntime): boolean;
  positive: string[];
  forbidden: string[];
  styleNotes?: string[];
  flavorMap?: Partial<Record<ThemeId, string>>;
}

export interface ResolvedEnrichment {
  id: string;                       // '' when nothing matched
  intensity: EnrichmentIntensity;   // 'wash' when id is ''
  positive: string[];
  forbidden: string[];
  styleNotes: string[];
  flavorHint: string;               // per-theme flavor override, '' if none
}

