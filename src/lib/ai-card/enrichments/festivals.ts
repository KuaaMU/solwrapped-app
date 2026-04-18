// Major festivals — priority 80. Both solar (Gregorian) and lunar-calendar
// festivals are covered. Each entry includes a taboo-aware `forbidden` list
// that is automatically appended to the LLM's negative tail.

import type { PromptEnrichment } from './types';

function lm(ctx: { temporal: { lunarMonth: number; lunarDay: number } }, month: number, day: number) {
  // lunar-javascript uses a negative month for leap months; take absolute value.
  return Math.abs(ctx.temporal.lunarMonth) === month && ctx.temporal.lunarDay === day;
}

function lmRange(
  ctx: { temporal: { lunarMonth: number; lunarDay: number } },
  month: number,
  d1: number,
  d2: number
) {
  return (
    Math.abs(ctx.temporal.lunarMonth) === month &&
    ctx.temporal.lunarDay >= d1 &&
    ctx.temporal.lunarDay <= d2
  );
}

export const FESTIVALS: PromptEnrichment[] = [
  {
    id: 'festival-spring-festival',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lmRange(ctx, 1, 1, 7),
    positive: [
      'scarlet plasma streaks exploding across the dark void',
      'abstracted firecracker fragments as geometric sparks',
      'warm lantern-glow radial fields, deep red and gold',
      'festive kinetic energy, celebratory particle storm',
    ],
    forbidden: ['realistic faces', 'religious icons', 'literal text / hanzi characters', 'lanterns as photo-realistic objects'],
    styleNotes: ['high saturation red-gold, celebratory but gallery-refined'],
    flavorMap: {
      orange: 'chaotic crimson-gold plasma explosions — degen celebration energy',
      gold: 'serene golden ripples with soft scarlet halos — monk-like festive calm',
      violet: 'violet-and-crimson pixel fragments converging into a radial bloom',
      green: 'precision teal sparks interlaced with scarlet radial geometry',
      pink: 'rose-gold nebular bloom, warm festive aurora',
      cyan: 'crystalline red-gold refractions through icy lattice',
    },
  },
  {
    id: 'festival-lantern',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lm(ctx, 1, 15),
    positive: [
      'orbs of soft amber light floating through a dark void',
      'reflective water ripples catching warm glow',
      'quiet celebratory warmth, radial abstraction',
    ],
    forbidden: ['realistic lanterns', 'faces', 'crowds'],
    styleNotes: ['warm but restrained, poetic'],
  },
  {
    id: 'festival-duanwu',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lm(ctx, 5, 5),
    positive: [
      'abstract dragon flow-field surging through dark water',
      'bronze and vermillion ripples, reed geometry',
      'kinetic dragon-boat rhythm abstracted as particle stream',
    ],
    forbidden: ['realistic boats', 'people rowing', 'literal dragons with faces'],
    styleNotes: ['powerful kinetic motion, earthy palette'],
  },
  {
    id: 'festival-qixi',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lm(ctx, 7, 7),
    positive: [
      'two radial light fields approaching across a star-particle bridge',
      'magenta-violet romance aurora over black void',
      'soft cosmic longing abstracted into flow-fields',
    ],
    forbidden: ['couples', 'figures', 'hearts as literal symbols'],
    styleNotes: ['tender, cosmic, restrained'],
  },
  {
    id: 'festival-midautumn',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lm(ctx, 8, 15),
    positive: [
      'giant moon silhouette as pure geometric disc',
      'silver-orange glow ripples radiating outward',
      'osmanthus-scented pattern abstraction in pale gold',
      'contemplative family-reunion quiet',
    ],
    forbidden: ['faces on the moon', 'rabbit figures', 'mooncake photos', 'people'],
    styleNotes: ['luminous center, extreme negative space, poetic'],
    flavorMap: {
      orange: 'amber moon over chaotic plasma tides — degen lunar intensity',
      gold: 'perfect golden moon, pristine zen stillness',
      violet: 'violet-haloed moon with pixel-fragment halo',
      green: 'cold green-silver moon with precision-ring geometry',
      pink: 'rose-halo moon rising through soft nebula mist',
      cyan: 'crystalline cyan moon reflected in icy geometric pond',
    },
  },
  {
    id: 'festival-chongyang',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => lm(ctx, 9, 9),
    positive: [
      'chrysanthemum pattern abstracted into radial particle field',
      'amber-red autumn mountain silhouette as flat geometry',
      'elevated contemplative height',
    ],
    forbidden: ['elderly figures', 'realistic chrysanthemums'],
    styleNotes: ['reverent, elevated'],
  },
  {
    id: 'festival-new-year',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => ctx.temporal.month === 1 && ctx.temporal.day === 1,
    positive: [
      'firework-burst particle storm across dark void',
      'champagne-gold plasma ribbons, countdown-energy abstraction',
      'cold-teal winter night pierced by radial gold bursts',
    ],
    forbidden: ['year digits as literal text', 'clocks', 'crowds', 'champagne glasses'],
    styleNotes: ['explosive but refined, midnight energy'],
  },
  {
    id: 'festival-valentines',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => ctx.temporal.month === 2 && ctx.temporal.day === 14,
    positive: [
      'rose-red and magenta nebula bloom over dark void',
      'twin radial fields gently interlocking through particle mist',
      'soft glow gradients, abstract romance',
    ],
    forbidden: ['hearts as literal symbols', 'couples', 'realistic roses', 'cupid figures'],
    styleNotes: ['warm tender palette, dreamlike softness'],
  },
  {
    id: 'festival-halloween',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => ctx.temporal.month === 10 && ctx.temporal.day === 31,
    positive: [
      'abstract jack-o-lantern silhouettes as glowing orange circles',
      'cobweb-geometry lattice draped through orange-violet plasma fog',
      'playful skull-motif pattern abstracted into tiled design',
      'mischievous radial energy, warm orange over black',
    ],
    forbidden: ['gore', 'blood', 'disturbing faces', 'realistic horror imagery', 'suffering'],
    styleNotes: ['playful, theatrical, not scary; taste over shock'],
  },
  {
    id: 'festival-christmas',
    priority: 80,
    intensity: 'primary',
    matches: (ctx) => ctx.temporal.month === 12 && ctx.temporal.day >= 24 && ctx.temporal.day <= 26,
    positive: [
      'warm red-green geometric snowflake lattice',
      'soft candle-glow radial fields over deep night',
      'abstracted pine-needle pattern, cozy warm-cool balance',
    ],
    forbidden: ['santa figures', 'religious crosses', 'religious iconography', 'photo-realistic gifts', 'trees with faces'],
    styleNotes: ['cozy but restrained, gallery-grade'],
  },
];
