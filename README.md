<div align="center">

<img src="public/assets/logo.png" alt="SolWrapped" width="220" />

# SolWrapped

### Your wallet tells a story. AI reads the chain.

**SolWrapped** scans any Solana address, classifies every transaction, and generates a personality report wrapped in two share-ready artifacts:

- A deterministic **parametric Logo SVG** — a visual fingerprint unique to each wallet's tx pattern
- A data-driven **AI card** — a 1200×630 generative-art OG image that refreshes daily with season, festival, and solar-term context

[Live Demo](https://solwrapped-app.vercel.app) · [Demo Wallets](#demo-wallets) · [AI Card Pipeline](#ai-card-pipeline) · [Sponsorship](#sponsorship--partnership) · [Getting Started](#getting-started)

*Built for Colosseum Frontier 2026*

<p>
  <a href="https://github.com/KuaaMU/solwrapped-app"><img src="https://img.shields.io/badge/GitHub-KuaaMU%2Fsolwrapped--app-181717?logo=github" alt="GitHub"/></a>
  <a href="https://x.com/X_SwarmMind"><img src="https://img.shields.io/badge/X-%40X__SwarmMind-000000?logo=x" alt="X"/></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT"/>
</p>

</div>

---

## What It Does

Paste any Solana address. In seconds, SolWrapped:

1. **Fetches** full transaction history via Helius Enhanced API
2. **Classifies** every tx — swaps, transfers, NFTs, staking, protocol usage
3. **Analyzes** behavioral patterns — peak hours, frequency, weekday ratios
4. **Generates** an AI personality via OpenRouter (swappable provider)
5. **Paints** a parametric Logo — your on-chain fingerprint, no two alike
6. **Awards** achievement badges (bronze / silver / gold rarity)
7. **Composes** a shareable AI card via Volcengine 即梦 4.0 — generative background + wallet stats overlay
8. **Decorates** the card with time-aware context — seasons, solar terms, festivals (CN lunar + Western)

## AI Card Pipeline

The AI share card is the showpiece — a fresh 1200×630 PNG per wallet, with a gacha-like variant picker inside the share modal:

```
┌────────────────────┐   ┌────────────────────┐   ┌───────────────┐
│  Wallet profile +  │ → │ OpenRouter LLM     │ → │ Art brief     │
│  enrichment ctx    │   │ (elephant-alpha)   │   │ (text prompt) │
└────────────────────┘   └────────────────────┘   └───────┬───────┘
                                                          ▼
         ┌──────────────────────────────────────────────────────┐
         │ Volcengine 即梦 4.0 (jimeng_t2i_v40) — 2560×1440 art │
         └────────────────────────┬─────────────────────────────┘
                                  ▼
         ┌──────────────────────────────────────────────────────┐
         │ sharp (bg resize) + resvg (text via TTF) → composite │
         │   bg → gradient vignette → parametric logo → text    │
         └────────────────────────┬─────────────────────────────┘
                                  ▼
                          1200×630 PNG (cached)
```

### Time-Aware Enrichments

Cards pick up a single contextual layer at generation time — no layering conflicts:

| Priority | Layer | Intensity | Examples |
|---------|-------|-----------|----------|
| 90 | **Wallet anniversary** | primary | first-tx week each year |
| 80 | **Festivals** | primary | Spring Festival, Mid-Autumn, Halloween, Qingming (taboo-aware) |
| 60 | **Solar terms** | accent / primary | 24 terms; Qingming treated as primary due to mourning cues |
| 20 | **Seasons** | accent | cherry-blossom pigment (spring), heat-shimmer plasma (summer), copper leaf-shards (autumn), crystalline frost (winter) |

User controls via a 3-state toggle: **SEASONAL** (all layers) · **FESTIVAL** (festival + anniversary only) · **OFF** (pure archetype).

### Variant Picker (Gacha)

Every theme has 4 distinct visual interpretations (e.g. `CHAOS` / `GRID` / `MELT` / `PULSE`). Users draw slots one-by-one inside the share modal — drawn variants cache and swap instantly; undrawn slots trigger fresh generation. Keeps novelty high without burning provider quota.

## Visual Language

- **Base**: deep black `#050505 → #0a0a0a`
- **Channels**: Solana purple `#9945FF` and teal `#14F195`, offset ±5px for RGB-shift "data distortion"
- **Typography**: Inter (UI), JetBrains Mono (data) — bundled in-repo as TTF for deterministic render
- **Texture**: scan lines, topographic contour borders, subtle dashed rings

Personality themes are **accent tints** — they subtly color glows and highlights on top of the shared dark base, never dominating it.

## The Parametric Logo

Every wallet gets a **unique** logo SVG — procedurally generated from on-chain data, not just themed.

| Logo element | Driven by | Visual effect |
|--------------|-----------|----------------|
| Particle ring density (3 rings) | `totalTransactions` | More activity → denser pupil, more vitality |
| Inner ring dash cadence | `tradingFrequency` | High-frequency → tighter dashes |
| RGB channel offset | `activeProtocols.length` | More protocols → wider chromatic separation |
| Glitch slice count | `swapCount / total` ratio | Heavy swapper → more visual noise |
| Top-right corner glow | `peakHour` (0-5 UTC) | Night owls → stronger "unwrap" glow |
| Accent tint | Personality theme | Subtle color wash over top-right quadrant |

Deterministic — the seed is an FNV-1a hash of the address. Same wallet always renders the same logo. On the landing page the logo is **interactive** — iris and pupil track the cursor independently (pupil 1.0×, iris 0.4×) so the pupil rolls inside the iris.

## Personality Archetypes

| Archetype | Accent | Who Gets It |
|-----------|--------|-------------|
| `MIDNIGHT DEGEN` | Orange `#f97316` | High-frequency traders, 3AM apes, Pump.fun regulars |
| `YIELD MONK` | Gold `#eab308` | Stakers, yield farmers, Marinade / Jito power users |
| `PIXEL HUNTER` | Violet `#9945FF` (Solana purple) | NFT collectors, digital art hunters, Tensor users |
| `ALPHA SNIPER` | Teal `#14F195` (Solana teal) | Whales, OGs, veterans, high-conviction traders |
| `FRESH EXPLORER` | Pink `#ec4899` | New wallets, curious newcomers |
| `DIAMOND HANDS` | Cyan `#22d3ee` | HODLers, long-term conviction holders |

## Badges

| Badge | Bronze | Silver | Gold |
|-------|--------|--------|------|
| **TRADER** | 100+ tx | 1,000+ tx | 5,000+ tx |
| **DIAMOND** | 5+ stakes | 20+ stakes | 50+ stakes |
| **EXPLORER** | 3+ protocols | 5+ protocols | 10+ protocols |
| **COLLECTOR** | 10+ NFT tx | 50+ NFT tx | 100+ NFT tx |
| **NIGHT OWL** | peak 0-5 UTC | — | — |
| **PUMP** | — | 10+ Pump.fun tx | — |
| **FRONTIER 26** | — | — | Generated during Colosseum 2026 window |

## Demo Wallets

No API keys required:

| Input | Personality | Accent |
|-------|-------------|--------|
| `demo-degen` | `MIDNIGHT DEGEN` | Orange |
| `demo-farmer` | `YIELD MONK` | Gold |
| `demo-collector` | `PIXEL HUNTER` | Violet |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, Fluid Compute) |
| UI | [Tailwind CSS 4](https://tailwindcss.com), [Framer Motion 12](https://www.framer.com/motion/) |
| Blockchain Data | [Helius Enhanced Transactions API](https://www.helius.dev) |
| LLM (personality + art brief) | [OpenRouter](https://openrouter.ai) — model-agnostic gateway, default `elephant-alpha` |
| Image Generation | [Volcengine 即梦 4.0](https://www.volcengine.com/docs/6791/1399614) (`jimeng_t2i_v40`) |
| Compositor | [sharp](https://sharp.pixelplumbing.com) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js) |
| OG Fallback | `next/og` (Satori) |
| Calendar | [lunar-javascript](https://github.com/6tail/lunar-javascript) (CN lunar + 24 solar terms) |
| Hosting | [Vercel](https://vercel.com) (Fluid Compute, 300s default function timeout) |
| Language | TypeScript (strict) |

## Sponsorship & Partnership

SolWrapped is a public, open-source hackathon project with organic Solana community reach. If your product serves crypto creators, wallet users, or AI developers, here's how the card + share loop surfaces brand value:

- **Every AI card generation** pings an image-gen provider (currently **Volcengine 即梦 4.0**) and an LLM gateway (currently **OpenRouter** routing to `elephant-alpha`). Each generation is a live demo of the stack behind it.
- **Every share** is a fresh 1200×630 artifact on X or Telegram. OG previews carry the actual AI card for the user's variant — native social shareability, no screenshot editing.
- **Open attribution spots**: footer badge, ShareModal bottom strip, or art-brief prompt credit line — all low-friction to add.

If you'd like to slot your provider, wallet, or protocol into the pipeline (model swap, image backend, wallet adapter integration, or commemorative badge sponsorship), open an issue or reach out via [X/@X_SwarmMind](https://x.com/X_SwarmMind).

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
git clone https://github.com/KuaaMU/solwrapped-app.git
cd solwrapped-app
pnpm install
```

### Configure

Create `.env.local`:

```env
# Required for real wallets (demo-* addresses skip this)
HELIUS_API_KEY=your_helius_key

# LLM — OpenRouter is the default; point LLM_PROVIDER at any provider in lib/ai.ts
OPENROUTER_API_KEY=sk-or-v1-...
LLM_PROVIDER=openrouter
LLM_MODEL=openrouter/elephant-alpha

# Image generation (optional; card falls back to Satori OG if unset)
VOLC_ACCESS_KEY_ID=...
VOLC_SECRET_ACCESS_KEY=...

# Optional: tune Volcengine concurrency (defaults to 1 for free-tier quota)
CARD_VOLC_CONCURRENCY=1

# Optional: absolute URL for OG metadata
NEXT_PUBLIC_SITE_URL=https://your-domain.app
```

> Demo wallets (`demo-degen` / `demo-farmer` / `demo-collector`) work without any API keys.

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Try `demo-degen` to see the full pipeline.

### Build

```bash
pnpm build && pnpm start
```

### Deploy to Vercel

```bash
vercel link      # link to Vercel project
vercel env add   # push each .env.local key
vercel --prod    # deploy
```

## Key Files

```
src/
├── lib/
│   ├── types.ts               # Core types (Badge, Theme, Profile, Report)
│   ├── helius.ts              # Helius API client (paginated fetch)
│   ├── analyzer.ts            # Transaction classifier + profiler
│   ├── ai.ts                  # LLM provider abstraction (OpenRouter default)
│   ├── themes.ts              # 6-accent subtle-tint design system
│   ├── logo-svg.ts            # Parametric Logo SVG generator (data-driven)
│   ├── badges.ts              # Achievements + rarity logic
│   ├── cache.ts               # In-memory TTL report cache
│   ├── demo-data.ts           # 3 demo wallet profiles
│   └── ai-card/
│       ├── index.ts           # Pipeline entry point
│       ├── prompt.ts          # Art brief composition (intensity-routed)
│       ├── variants.ts        # 4 style variants × 6 themes = 24 combos
│       ├── volcengine.ts      # 即梦 4.0 submit/poll with semaphore
│       ├── volcengine-sign.ts # Volcengine signature v4
│       ├── compositor.ts      # Sharp + resvg composition
│       ├── cache.ts           # Per-variant PNG cache (TTL matches enrichment)
│       ├── enrichments/       # Registry: festivals + solar terms + seasons + wallet events
│       └── fonts/             # Inter + JetBrains Mono TTFs
├── components/
│   ├── Logo.tsx               # React wrapper — reactive eye-tracking
│   ├── SocialLinks.tsx        # GitHub + X icons
│   └── report/                # Report page atoms + ShareModal
└── app/
    ├── page.tsx               # Landing (interactive logo hero + mode toggle)
    ├── report/[address]/
    │   ├── page.tsx           # Server shell — generateMetadata (OG tags)
    │   └── ReportClient.tsx   # Themed report + share modal launcher
    └── api/
        ├── analyze/           # Full pipeline: Helius → analyzer → LLM
        ├── card/              # AI card (Volcengine → sharp/resvg composite)
        └── og/                # Satori OG fallback
```

## Roadmap

- [x] Helius tx fetching + classification
- [x] LLM provider abstraction (OpenRouter default, swappable)
- [x] 6-archetype subtle-accent design system
- [x] Parametric data-driven Logo SVG + interactive eye-tracking
- [x] Framer Motion animated report page
- [x] Dynamic OG image generation (Satori fallback + AI card)
- [x] Volcengine 即梦 4.0 generative card pipeline
- [x] 4-variant gacha picker per theme
- [x] Time-aware enrichment registry (festivals / solar terms / seasons / anniversaries)
- [x] Badge / achievement system (bronze / silver / gold)
- [x] Frontier 2026 commemorative badge
- [x] Mobile-responsive share modal
- [x] Vercel deployment + production OG metadata
- [ ] Wallet adapter connect flow
- [ ] Historical comparison (month-over-month)
- [ ] Farcaster Frames support
- [ ] Leaderboard — most-unwrapped wallets

## License

MIT

---

<div align="center">
<sub>Built with Helius, OpenRouter, and Volcengine 即梦 4.0 for Colosseum Frontier 2026</sub>
<br/>
<a href="https://github.com/KuaaMU/solwrapped-app">GitHub</a> · <a href="https://x.com/X_SwarmMind">X @X_SwarmMind</a>
</div>
