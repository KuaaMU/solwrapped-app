// Seasonal enrichments — priority 20. Bumped to `accent` intensity so the
// season is visibly expressed on the card (not just a mood wash indistinguishable
// from no enrichment). Each season anchors on a distinctive iconic motif that
// survives LLM compression.

import type { PromptEnrichment } from './types';

export const SEASONS: PromptEnrichment[] = [
  {
    id: 'season-spring',
    priority: 20,
    intensity: 'accent',
    matches: (ctx) => ctx.temporal.month >= 3 && ctx.temporal.month <= 5,
    positive: [
      'clouds of pale cherry-blossom pigment drifting across the composition as geometric petal fragments',
      'jade-green and soft rose flow-field threading through the focal region',
      'optimistic upward particle momentum, warm spring breeze abstracted',
    ],
    forbidden: ['realistic flowers', 'trees', 'landscape photography'],
    styleNotes: ['pale pink + jade palette clearly visible on top of archetype color'],
  },
  {
    id: 'season-summer',
    priority: 20,
    intensity: 'accent',
    matches: (ctx) => ctx.temporal.month >= 6 && ctx.temporal.month <= 8,
    positive: [
      'heat-shimmer plasma distortion rippling across the focal region',
      'bright cyan-amber refraction bands, high-saturation turbulence',
      'electric summer-sky energy compressed into abstract storm',
    ],
    forbidden: ['beaches', 'realistic sun', 'figures'],
    styleNotes: ['amped-up contrast, visible heat-haze motif'],
  },
  {
    id: 'season-autumn',
    priority: 20,
    intensity: 'accent',
    matches: (ctx) => ctx.temporal.month >= 9 && ctx.temporal.month <= 11,
    positive: [
      'drifting copper-gold leaf-shard fragments arranged as geometric flow',
      'burnished amber pigment wash with cool teal edge light',
      'harvest warmth rendered as particle rain',
    ],
    forbidden: ['realistic leaves', 'trees', 'faces'],
    styleNotes: ['warm copper palette dominant, clearly readable as autumn'],
  },
  {
    id: 'season-winter',
    priority: 20,
    intensity: 'accent',
    matches: (ctx) => ctx.temporal.month === 12 || ctx.temporal.month <= 2,
    positive: [
      'crystalline frost lattice refracting dim cyan-silver light across the frame',
      'icy particle snowfall drifting through deep black void',
      'glass-like precision geometry, cold quiet',
    ],
    forbidden: ['realistic snow scenes', 'figures', 'buildings'],
    styleNotes: ['low saturation cyan-silver clearly visible as winter coldness'],
  },
];
