// 24 solar terms (二十四节气) — priority 60, activates only on the exact
// solar-term day (lunar-javascript's getJieQi() returns a name only on that day).
// Each term gets concise abstract imagery; no literal depictions required.

import type { PromptEnrichment } from './types';

interface TermSpec {
  name: string;            // Chinese name from lunar-javascript
  positive: string[];
  forbidden?: string[];
  styleNotes?: string[];
}

const TERMS: TermSpec[] = [
  { name: '立春', positive: ['first green sprout of abstract growth', 'warming pale jade particles'], styleNotes: ['hopeful, airy'] },
  { name: '雨水', positive: ['soft water droplets as particle streams', 'silver-teal drizzle refracted'], styleNotes: ['moist, reflective'] },
  { name: '惊蛰', positive: ['awakening static sparks through dark void', 'sudden particle bursts radiating outward'], styleNotes: ['electric tension'] },
  { name: '春分', positive: ['balanced dual-field composition, light and dark equal', 'warm pink and cool teal in harmony'], styleNotes: ['symmetric equilibrium'] },
  { name: '清明', positive: ['misty willow filaments, pale green drizzle, quiet introspective stillness', 'faint cherry-pink pigment drifting through grey mist', 'contemplative abstract calm'], forbidden: ['graves', 'tombs', 'coffins', 'funeral imagery', 'mourning figures', 'skulls', 'candles'], styleNotes: ['extremely restrained, reverent, low contrast, no dark humor'] },
  { name: '谷雨', positive: ['fertile field of rain-slicked geometric grain patterns', 'amber-green vitality in particle form'], styleNotes: ['rich saturation, gentle flow'] },
  { name: '立夏', positive: ['heat-shimmer beginning to rise, amber plasma edges', 'bright teal accent sparks'], styleNotes: ['ascending warmth'] },
  { name: '小满', positive: ['half-full amber grain motifs abstracted into flowing lattice', 'subtle gold-green harmony'], styleNotes: ['balanced growth'] },
  { name: '芒种', positive: ['sharp amber spike-geometry piercing dark void', 'harvest-wheat abstraction'], styleNotes: ['pointed energy'] },
  { name: '夏至', positive: ['peak solar plasma flare at focal center', 'intense gold-white radiation against black'], styleNotes: ['maximum energy, centered'] },
  { name: '小暑', positive: ['heat-rippled particle curtains, amber turbulence'], styleNotes: ['oppressive warmth'] },
  { name: '大暑', positive: ['blazing corona of scarlet-orange plasma', 'black void intensified by heat aura'], styleNotes: ['extreme heat, high drama'] },
  { name: '立秋', positive: ['first cooling amber drift through warm void', 'subtle teal chill appearing at edges'], styleNotes: ['transition, contemplative'] },
  { name: '处暑', positive: ['receding heat, copper pigment fading into calmer tones'], styleNotes: ['easing tension'] },
  { name: '白露', positive: ['white dew droplets as luminous particles on dark surface', 'silver-teal micro-reflections'], styleNotes: ['pearl-like clarity'] },
  { name: '秋分', positive: ['balanced autumn composition, warm copper with cold silver', 'dual-field symmetry'], styleNotes: ['equilibrium, reflective'] },
  { name: '寒露', positive: ['cold dew on dark geometric surface, cyan-silver refraction', 'crisp autumn chill'], styleNotes: ['sharp clarity'] },
  { name: '霜降', positive: ['frost crystals forming on abstract lattice, pale silver edge-light', 'deep autumn stillness'], styleNotes: ['quiet, crystalline'] },
  { name: '立冬', positive: ['first frost breath over dark void, muted silver-cyan'], styleNotes: ['entering stillness'] },
  { name: '小雪', positive: ['light snow-particle drift through black, sparse and minimal'], styleNotes: ['gentle hush'] },
  { name: '大雪', positive: ['dense white-cyan particle storm, heavy abstract snowfall over void'], styleNotes: ['dense, quiet'] },
  { name: '冬至', positive: ['deepest winter, single cold focal point, minimal cyan light in vast black'], styleNotes: ['contemplative, distilled'] },
  { name: '小寒', positive: ['faint cold particle mist, pale cyan over deep black'], styleNotes: ['still, reserved'] },
  { name: '大寒', positive: ['harshest cold crystalline lattice, sharp ice-geometry'], styleNotes: ['unforgiving clarity'] },
];

export const SOLAR_TERMS: PromptEnrichment[] = TERMS.map((t) => ({
  id: `solar-term-${t.name}`,
  priority: 60,
  intensity: t.name === '清明' ? 'primary' : 'accent',
  matches: (ctx) => ctx.temporal.solarTerm === t.name,
  positive: t.positive,
  forbidden: t.forbidden ?? [],
  styleNotes: t.styleNotes,
}));
