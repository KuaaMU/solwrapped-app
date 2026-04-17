# SolWrapped — Visual Design Specification

## 1. Logo

### Core Composition
The logo is built from 4 concentric layers, each with meaning:

```
┌─────────────────────────────────────┐
│  Layer 1: Square frame              │  → "边界" / 你的钱包边界
│    Layer 2: Large dashed circle     │  → "链" / Solana blockchain
│      Layer 3: Small dashed circle   │  → "行为模式" (offset left)
│        Layer 4: Particle pupil      │  → "AI 洞察" / 人格核心
└─────────────────────────────────────┘
```

### Geometric Specs
| Element | Position | Size | Style |
|---------|----------|------|-------|
| Square frame | center (400,355) | 310×310, rx=16 | 4-layer topographic contour, innermost: stroke-width 5, #ccc, opacity 0.7 |
| Square topographic | outer → inner | 400→370→340→310 | stroke 1.5→2→2.5→5, progressively brighter |
| Square gap | top-right corner | small arc at (155, -140) | "unwrap" reveal, with faint glow leak |
| Large circle | center (400,355) | r=112 | stroke-width 5.5, #eee, dasharray 14 8, opacity 0.75 |
| Inner circle | offset left (-25, 0) | r=62 | stroke-width 4.5, #ddd, dasharray 14 8, opacity 0.7 |
| Particle pupil | center (400,355) | ~80px diameter | 3 density rings + solid core |

### Particle Field (Pupil)
Three density layers, outer → inner:
- **Outer ring** (r=38): 18 particles, r=1.3-1.6, opacity 0.3
- **Middle ring** (r=25): 15 particles, r=1.5-1.8, opacity 0.5
- **Inner ring** (r=14): 10 particles, r=2-2.2, opacity 0.7
- **Core**: solid circle r=3.5, opacity 0.98
- **Highlight**: small circle at (-2, -3), r=1.8, opacity 0.55

### RGB / Solana Color Shift
Three overlapping layers offset ±5px horizontally:
- **Purple channel** (#9945FF): translate(-5, 0), opacity 0.5
- **Teal channel** (#14F195): translate(+5, 0), opacity 0.5
- **White/gray center**: translate(0, 0), opacity 1.0 (brightest)

Each channel replicates the full logo geometry. The color bleeding at edges creates the signature "data distortion" aesthetic.

### Glitch Slices
10 horizontal bars scattered across the canvas:
- Purple bars (#9945FF): y=320, 420, 460, 270 — opacity 0.25-0.5
- Teal bars (#14F195): y=390, 480, 340 — opacity 0.25-0.5
- White bars: y=240, 500 — opacity 0.05-0.06
- Width: 100-200px, height: 2-4px

### Scan Lines
- 12 evenly spaced lines, stroke-width 0.8, opacity 0.04
- One highlighted "scan frame" at y=375-382, with glow effect

---

## 2. Color Palette

### Primary (Background & Structure)
| Name | Hex | Usage |
|------|-----|-------|
| Deep Black | `#050505` | Main background |
| Card Black | `#0a0a0a` | Card/component backgrounds |
| Dark Gray | `#1a1a1a` | Subtle borders |
| Mid Gray | `#555`-`#777` | Outer contour lines |
| Light Gray | `#999`-`#bbb` | Inner contour lines, dashed circles |
| Bright White | `#eee`-`#fff` | Innermost lines, pupil core |

### Accent (Solana Brand)
| Name | Hex | Usage |
|------|-----|-------|
| Solana Purple | `#9945FF` | RGB channel, glitch bars, hover states, links |
| Solana Teal | `#14F195` | RGB channel, glitch bars, success states |
| Purple Faint | `rgba(153,69,255,0.15)` | Background glows |
| Teal Faint | `rgba(20,241,149,0.1)` | Background glows |

### Text
| Level | Color | Usage |
|-------|-------|-------|
| Primary | `#e0e0e0` | Headings, logo text |
| Secondary | `#888`-`#aaa` | Body text |
| Tertiary | `#555`-`#666` | Captions, labels |
| Disabled | `#333`-`#444` | Placeholder text |

---

## 3. Typography

### Font Stack
```css
/* Headings / Logo */
font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
font-weight: 200;          /* Ultra Light */
letter-spacing: 16px;      /* Wide tracking */

/* Body */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-weight: 400;

/* Monospace / Data */
font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
font-weight: 400;
```

### Logo Text
```
SolWrapped
font-size: 48px
font-weight: 200
fill: #e0e0e0
letter-spacing: 16
opacity: 0.8
```

### Tagline
```
YOUR WALLET TELLS A STORY
font-size: 14px
fill: #666
letter-spacing: 6
opacity: 0.5
```

---

## 4. UI Design Principles

### Dark Mode Only
The entire product lives on `#050505` to `#0a0a0a`. No white backgrounds.

### Layered Depth
Every UI element should feel like it has layers:
```css
/* Card example */
.card {
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 
    0 0 30px rgba(153, 69, 255, 0.03),   /* purple ambient */
    inset 0 1px 0 rgba(255, 255, 255, 0.05); /* top highlight */
}
```

### Topographic Borders
Use nested borders to create depth, like the logo's contour lines:
```css
.contour-border {
  position: relative;
}
.contour-border::before {
  content: '';
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  pointer-events: none;
}
.contour-border::after {
  content: '';
  position: absolute;
  inset: -16px;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 24px;
  pointer-events: none;
}
```

### Dashed Circle Motif
Repeating visual element throughout the UI:
```css
.dashed-ring {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}
```

### Glitch Effect (for accents / hover)
```css
.glitch-text {
  position: relative;
}
.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.glitch-text::before {
  color: #9945FF;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
  transform: translate(-2px, 0);
  opacity: 0.5;
}
.glitch-text::after {
  color: #14F195;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
  transform: translate(2px, 0);
  opacity: 0.5;
}
```

### Scan Line Overlay (optional ambient)
```css
.scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 59px,
    rgba(255, 255, 255, 0.015) 59px,
    rgba(255, 255, 255, 0.015) 60px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### Glow Effects
```css
.glow-purple {
  box-shadow: 0 0 20px rgba(153, 69, 255, 0.15);
}
.glow-teal {
  box-shadow: 0 0 20px rgba(20, 241, 149, 0.15);
}
.glow-white {
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}
```

---

## 5. Component Styles

### Buttons
```css
.btn-primary {
  background: transparent;
  border: 2px solid #ccc;
  color: #e0e0e0;
  border-radius: 12px;
  padding: 12px 32px;
  font-weight: 300;
  letter-spacing: 4px;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  border-color: #9945FF;
  box-shadow: 0 0 20px rgba(153, 69, 255, 0.2);
  color: #fff;
}
```

### Input Fields
```css
.input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #e0e0e0;
  padding: 14px 20px;
}
.input:focus {
  border-color: rgba(153, 69, 255, 0.5);
  box-shadow: 0 0 15px rgba(153, 69, 255, 0.1);
  outline: none;
}
```

### Personality Card (核心组件)
```css
.personality-card {
  background: #0a0a0a;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  position: relative;
  overflow: hidden;
}
/* Contour lines decoration */
.personality-card::before {
  content: '';
  position: absolute;
  inset: -6px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 24px;
  pointer-events: none;
}
/* Theme accent (per archetype) */
.personality-card.degen { border-color: rgba(249, 115, 22, 0.3); }
.personality-card.yield { border-color: rgba(234, 179, 8, 0.3); }
.personality-card.phantom { border-color: rgba(167, 139, 250, 0.3); }
.personality-card.matrix { border-color: rgba(34, 197, 94, 0.3); }
.personality-card.neon { border-color: rgba(236, 72, 153, 0.3); }
.personality-card.terminal { border-color: rgba(34, 211, 238, 0.3); }
```

---

## 6. Animation Guidelines

### Subtle Pulse (for loading / active states)
```css
@keyframes pupilPulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
.pupil { animation: pupilPulse 3s ease-in-out infinite; }
```

### Scan Line Movement
```css
@keyframes scanMove {
  0% { transform: translateY(-100vh); }
  100% { transform: translateY(100vh); }
}
.scan-bar {
  position: fixed;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  animation: scanMove 8s linear infinite;
  pointer-events: none;
}
```

### Glitch Flicker
```css
@keyframes glitchFlicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: 0.8; transform: translate(-2px, 0); }
  95% { opacity: 1; transform: translate(2px, 0); }
  96% { opacity: 0.9; transform: translate(0, 0); }
}
```

---

## 7. File Assets

### Logo Files
| File | Format | Size | Usage |
|------|--------|------|-------|
| `no16-perfect-ten.svg` | SVG | 800×800 | Primary logo (vector) |
| `no16-perfect-ten.png` | PNG | 800×800 | Raster fallback |
| `no15-favicon-32.png` | PNG | 32×32 | Favicon |
| `no15-favicon-64.png` | PNG | 64×64 | App icon small |
| `no15-favicon-256.png` | PNG | 256×256 | App icon large / OG image |

### OG Share Card
Recommended: 1200×630, dark background, logo centered, personality archetype name below.

---

## 8. Design Tokens (JSON)

```json
{
  "colors": {
    "background": "#050505",
    "surface": "#0a0a0a",
    "surfaceRaised": "#111111",
    "border": "rgba(255,255,255,0.08)",
    "borderStrong": "rgba(255,255,255,0.15)",
    "textPrimary": "#e0e0e0",
    "textSecondary": "#999999",
    "textTertiary": "#666666",
    "textDisabled": "#444444",
    "accentPurple": "#9945FF",
    "accentTeal": "#14F195",
    "accentPurpleFaint": "rgba(153,69,255,0.1)",
    "accentTealFaint": "rgba(20,241,149,0.08)",
    "glowPurple": "rgba(153,69,255,0.15)",
    "glowTeal": "rgba(20,241,149,0.12)"
  },
  "radii": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "pill": "100px"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "40px",
    "2xl": "64px"
  },
  "fonts": {
    "heading": "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "body": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "mono": "'SF Mono', 'Fira Code', 'Courier New', monospace"
  },
  "effects": {
    "glowPurple": "0 0 20px rgba(153,69,255,0.15)",
    "glowTeal": "0 0 20px rgba(20,241,149,0.12)",
    "glowWhite": "0 0 15px rgba(255,255,255,0.08)",
    "contourBorder": "inset 0 0 0 1px rgba(255,255,255,0.05)"
  }
}
```

---

## 9. Key Metaphors (for copy / marketing)

| Visual Element | Represents | Copy Angle |
|----------------|-----------|------------|
| Square frame | Wallet boundary | "你的链上边界" |
| Contour lines | Data layers | "层层深入" |
| Dashed circles | Blockchain traces | "链上痕迹" |
| Offset inner circle | Behavioral patterns | "行为偏移" |
| Particle pupil | AI insight | "数据凝聚为洞察" |
| RGB/Solana shift | Digital nature | "数字化的本质" |
| Square gap (unwrap) | Revelation | "揭开你的链上人格" |
| Glitch slices | Data corruption/transmission | "穿越链上噪音" |
| Scan lines | Analysis process | "正在扫描..." |

---

## 10. Do's and Don'ts

### ✅ Do
- Always use dark backgrounds (#050505 - #0a0a0a)
- Maintain the layered depth feeling
- Use Solana purple/teal as accent, never as dominant
- Keep dashed circles as a repeating motif
- Use glow effects sparingly for emphasis

### ❌ Don't
- Don't use white or light backgrounds
- Don't fill the dashed circles (keep them outlined)
- Don't remove the RGB/Solana color shift from the logo
- Don't use more than 2 accent colors at once
- Don't add drop shadows (use glow instead)
- Don't use heavy/bold fonts (keep it ultra-light)
