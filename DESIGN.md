---
name: AI Interview Evaluator
description: Multimodal AI-powered interview analysis — "Neural Command Center"
register: product
colors:
  brand-blue: "#3054ff"
  brand-blue-hover: "#2040e0"
  brand-blue-light: "#4a6fff"
  gradient-end: "#b4c0ff"
  background: "#000000"
  surface-card: "#050512"
  surface-muted: "#18181b"
  foreground: "#ffffff"
  muted-foreground: "rgba(255,255,255,0.55)"
  border: "rgba(255,255,255,0.10)"
typography:
  display:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontWeight: "700"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: "400"
    lineHeight: "1.6"
  label:
    fontFamily: "Inter, ui-sans-serif"
    fontWeight: "600"
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "24px"
  3xl: "24px"
  full: "9999px"
spacing:
  section-x: "2rem md:7rem"
  section-pt: "9rem"
  section-gap: "2rem md:2.5rem"
  card-p: "1.5rem"
  card-gap: "1.5rem"
  max-content: "64rem"
---

# Design System: AI Interview Evaluator
## "Neural Command Center"

---

## 1. Creative North Star

The interface is a **Neural Command Center** — a professional-grade AI operating system for self-directed interview preparation. It is dark, precise, and technically credible. Every visual element is either data or infrastructure for data. Nothing is decorative for its own sake.

The experience across three workspaces (Landing → Analyze → Results) should feel like moving between rooms in the same facility. Background environment, typography, spacing, and component patterns are identical across all routes.

---

## 2. Color

### Brand Palette

| Token | Value | Use |
|---|---|---|
| `--brand-blue` | `hsl(230 100% 59%)` = `#3054ff` | Primary actions, active states, glow accent, data visualization |
| `--brand-blue-hover` | `hsl(230 76% 50%)` = `#2040e0` | Button hover state |
| `--brand-blue-light` | `#4a6fff` | Icon fills, gradient ends |
| `--gradient-end` | `#b4c0ff` | Progress bar tails, light glow fade |
| `--background` | `hsl(0 0% 0%)` = `#000000` | Root page background |
| `--card` | `#050512` | Card/surface base (deep navy-black) |
| `--border` | `rgba(255,255,255,0.10)` | Default card borders |
| `--foreground` | `#ffffff` | Primary text |
| `--muted-foreground` | `rgba(255,255,255,0.55)` | Secondary/supporting text |

### Color Rules

**The Data First Rule.** `#3054ff` and its variants are exclusively for: primary actions, active/running states, data rings, metric bars, and animated indicators. Never used as a large background fill or decorative wash.

**The Neon Glow Rule.** Elevation is communicated through `box-shadow` glows tinted to `#3054ff`, not traditional drop shadows. Intensity: `0_0_20px_rgba(48,84,255,0.3)` (default hover), `0_0_60px_rgba(48,84,255,0.12)` (card active glow).

**Text contrast.** Body text (`text-white/55`) on `#050512` card surfaces must maintain ≥ 4.5:1. Never use `text-white/30` or dimmer for body copy — limit to metadata, timestamps, and labels.

**Scanning border.** Active cards animate a `h-[1px]` gradient line: `from-transparent via-[#3054ff]/70 to-transparent` sweeping left-to-right on repeat. Intensity varies by context (70% for primary workstation, 40% for secondary cards).

---

## 3. Typography

### Fonts

Two fonts only. No others.

| Role | Family | Weight | Size range |
|---|---|---|---|
| **Display / Serif** | Instrument Serif | 400, 700 | `text-3xl` → `text-[104px]` |
| **Sans / Body / UI** | Inter (+ Instrument Sans fallback) | 300–700 | `text-xs` → `text-[20px]` |
| **Mono** | System monospace | 400–600 | `text-[10px]` → `text-sm` |

### Typographic Pattern: Two-Line Hero Split

Every page hero uses the same two-line split pattern:

```
[Serif, font-normal, ~40–48px]   "Your Interview."
[Sans, font-bold, ~56–80px]      "Analyzed."       ← text-shadow glow
```

Display headline (`font-bold`) always has: `[text-shadow:0_0_60px_rgba(255,255,255,0.25)]`

### Hierarchy

- **Display bold** (`font-bold, tracking-tight, leading-[1.05]`): Page H1 — score numbers, primary headlines
- **Display serif** (`font-normal, var(--font-serif), leading-tight`): Secondary headline H2 — always paired with bold above
- **Heading** (`font-semibold, text-base–text-xl`): Section titles inside cards
- **Body** (`font-normal, text-sm–text-[17px], leading-[1.6], text-white/55`): Paragraph text. Cap at 65ch in wide layouts.
- **Label** (`font-semibold, text-xs, uppercase, tracking-widest, text-white/40–white/80`): Card section headers, status indicators
- **Mono** (`font-mono, text-[10px]–text-xs`): Raw values, percentages, timestamps, terminal logs

---

## 4. Background Environment

Every page shares an identical multi-layer background stack (stacking order bottom → top):

1. **`<Particles />`** — fixed blue rising particles, `z-0`, `pointer-events-none`
2. **`<AmbientMotion />`** — slow-drifting large blur blobs + neural dot grid, `relative z-10`
3. **Noise SVG overlay** — `opacity-[0.02]`, `mix-blend-overlay`, `pointer-events-none`
4. **Radial glow** — `w-[900px] h-[600px] bg-[#3054ff]/[0.04] blur-[140px]` centered at top, `pointer-events-none`

This stack must never be modified. It establishes the "same facility" feeling across all routes.

---

## 5. Component Patterns

### GlowCard (Primary Card)

The canonical container for all content.

```css
bg-[#050512]/60
backdrop-blur-2xl
border border-white/10
rounded-3xl
overflow-hidden
hover:border-[#3054ff]/20
hover:shadow-[0_0_40px_rgba(48,84,255,0.08)]
transition-all duration-500
```

**Interior structure:**
- Scanning border: `h-[1px]` gradient animation (top edge)
- Inner top glow: `w-64 h-24 bg-[#3054ff]/[0.04] blur-[40px]` centered
- Content wrapper: `relative z-10`

**Mouse spotlight (primary workstation card only):**
`radial-gradient(500px circle at {mouseX}px {mouseY}px, rgba(48,84,255,0.12), transparent 80%)`

### Secondary Info Cards

Smaller supporting cards (right rail, feature tiles):

```css
bg-[#050512]/40
backdrop-blur-xl
border border-white/5
rounded-2xl
p-4–p-5
bg-gradient-to-br from-white/[0.04] to-transparent
hover:border-[#3054ff]/30
hover:shadow-[0_0_25px_rgba(48,84,255,0.12)]
transition-all duration-300
```

### Section Icon Header

Reusable icon + label pattern used to head every card section:

```jsx
<div className="flex items-center gap-3 mb-5–mb-6">
  <div className="w-8 h-8 rounded-xl bg-[#3054ff]/15 border border-[#3054ff]/20 flex items-center justify-center">
    <Icon className="w-4 h-4 text-[#3054ff]" strokeWidth={1.5} />
  </div>
  <div>
    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Label</h3>
    <p className="text-xs text-white/30 mt-0.5">Sublabel</p> {/* optional */}
  </div>
</div>
```

### Badge Pill

Used on page hero areas. Consistent across all three routes:

```jsx
<div className="flex items-center gap-3 px-1.5 py-1.5 pr-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
  <div className="bg-[#3054ff] text-white text-xs font-semibold px-2.5 py-1 rounded-full leading-none">
    Label
  </div>
  <div className="text-xs text-white/60 font-medium tracking-wide">
    Supporting text <ArrowRight className="w-3.5 h-3.5 inline" />
  </div>
</div>
```

### Primary CTA Button

The canonical primary action button. One style, used identically across all routes:

```jsx
<button className="group flex items-center gap-4 bg-white text-black font-semibold rounded-full pl-7 pr-2 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/20">
  <span className="text-[17px]">Action Label</span>
  <div className="bg-[#3054ff] rounded-full w-[42px] h-[42px] flex items-center justify-center group-hover:bg-[#2040e0] transition-colors">
    <ArrowRight className="w-5 h-5 text-white" />
  </div>
</button>
```

Never: `bg-[#3054ff]` as the full button. White pill + blue arrow is the only primary CTA form.

### Ghost / Secondary Button

```jsx
<button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-medium text-white/70 hover:bg-white/[0.09] hover:text-white transition-all duration-300">
  Label
</button>
```

### Metric / Progress Bar

```jsx
<div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
  <motion.div
    className="h-full rounded-full bg-gradient-to-r from-[#3054ff] to-[#4a6fff]"
    style={{ boxShadow: "0 0 8px rgba(48,84,255,0.6)" }}
    animate={{ width: `${value}%` }}
  />
</div>
```

### Data Ring (SVG)

Circular progress ring used for scores and confidence:

```jsx
<svg className="-rotate-90">
  <circle cx="90" cy="90" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
  <motion.circle
    stroke="#3054ff"
    strokeWidth="8"
    fill="none"
    strokeLinecap="round"
    style={{ filter: "drop-shadow(0 0 8px rgba(48,84,255,0.8))" }}
    animate={{ strokeDashoffset: circumference * (1 - pct) }}
  />
</svg>
```

### Tab Pills (Input Mode Switcher)

```jsx
<button className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
  active
    ? "bg-[#3054ff] text-white shadow-[0_0_20px_rgba(48,84,255,0.4)]"
    : "text-white/50 hover:text-white/80 hover:bg-white/5"
}`}>
```

### Status Indicator

Inline "live" state indicator:

```jsx
<span className="h-1.5 w-1.5 rounded-full bg-[#3054ff] animate-pulse" />
<span className="text-xs text-white/30 font-mono uppercase tracking-widest">System Ready</span>
```

---

## 6. Navigation

### Floating Navbar (Header)

`fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] h-16 z-40`
`bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl`
`shadow-2xl px-6`

Contains: hamburger (sidebar toggle) | Brain logo | centered search bar | bell + avatar.

### Slide-out Sidebar

`fixed top-28 bottom-4 left-4 md:left-6 w-[220px] z-50`
`bg-[#030308]/60 backdrop-blur-3xl border border-white/5 rounded-3xl`
`shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(48,84,255,0.05)]`

Active nav item: `bg-[#3054ff]/10 border-[#3054ff]/20 shadow-[inset_3px_0_0_0_rgba(48,84,255,1)]` with left-border accent + gradient overlay.

---

## 7. Motion

### Animation Library
Framer Motion exclusively. No CSS animation for entrance/exit sequences.

### Standard Entrance Timing

| Element | Duration | Delay pattern | Easing |
|---|---|---|---|
| Badge pill | 0.6s | 0s | `easeOut` |
| H2 serif headline | 0.7s | 0s | `[0.22, 1, 0.36, 1]` |
| H1 bold headline | 0.7s | 0.1s | `[0.22, 1, 0.36, 1]` |
| Body paragraph | 0.8s | 0.3s | default |
| Card (primary) | 0.6s | 0.2s | `[0.22, 1, 0.36, 1]` |
| Cards (staggered) | 0.5s each | +0.08s per card | `[0.22, 1, 0.36, 1]` |
| Feature items (staggered) | 0.5s each | +0.12s per item | default |

### Whileview (scroll reveal)
`whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}`

### Card Hover
`whileHover={{ y: -4 }}` with `transition-all duration-300–500`

### Scanning Border (continuous)
`animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4–5, repeat: Infinity, ease: "linear" }}`
Stagger per card with `delay: cardDelay * 1.5 + 0.5`

### Score Ring Fill
`duration: 1.5s, ease: "easeOut", delay: 0.3–0.4s`

### Reduced Motion
All entrance and looping animations must respect `prefers-reduced-motion: reduce`. Use `AnimatePresence` fade crossfades (opacity only) as the fallback — never instant show/hide.

---

## 8. Layout

### Page Structure

```
pt-36 pb-12–24          ← Hero header (accounts for fixed navbar)
px-8 md:px-28           ← Section horizontal padding (all routes)
max-w-5xl mx-auto       ← Content max-width
```

### Primary Grid (main workstation areas)

```css
grid gap-8 lg:grid-cols-[1fr_300px–340px]
```
Left rail: upload/metrics/transcription  
Right rail: confidence ring, AI summary, feedback cards

### Section Spacing

- Between major sections: `pb-8` → `pb-12` → `pb-24`
- Between sibling cards: `space-y-6`
- Inside card padding: `p-5` (info), `p-6` (standard), `p-8` (featured), `p-10 md:p-14` (hero CTA)

---

## 9. Chart Styling

All charts use Recharts. Dark glass style:

| Property | Value |
|---|---|
| Tooltip background | `#030309` |
| Tooltip border | `1px solid rgba(48,84,255,0.2)` |
| Tooltip radius | `12px` |
| Tooltip backdrop | `blur(12px)` |
| Grid strokes | `rgba(255,255,255,0.05)–0.06` |
| Axis tick fill | `rgba(255,255,255,0.25–0.40)` |
| Primary data stroke | `#3054ff`, `strokeWidth: 2` |
| Secondary data stroke | `rgba(255,255,255,0.6)` |
| Radar fill | `#3054ff`, `fillOpacity: 0.15` |
| Radar dot | `fill: #3054ff, r: 4` |
| Area chart gradient | `from #3054ff at 40% opacity → transparent` |
| Bar radius | `[0, 6, 6, 0]`, `barSize: 18` |
| Cursor highlight | `rgba(255,255,255,0.03)` |

---

## 10. Do's and Don'ts

### Do
- Use `#3054ff` as the single brand accent. Never introduce a second accent color.
- Use `Instrument Serif` for H2 paired headers. Never serif for body text.
- Use the pill CTA (white + blue arrow) as the primary button. One form only.
- Use `whileInView` with `once: true` — never re-trigger scroll animations.
- Use `drop-shadow(0 0 8px rgba(48,84,255,0.8))` on data rings and metric bar glow.
- Test every new card's scanning border animation — it must not double-fire or flicker.

### Don't
- Don't use `overflow-hidden` on the background layer wrapper — it clips the fixed Particles.
- Don't use gradient text (`background-clip: text`) — the ban from Impeccable's absolute bans applies.
- Don't use nested cards (GlowCard inside GlowCard).
- Don't animate `<img>` elements on hover.
- Don't use side-stripe borders (`border-left > 1px`) as card accents.
- Don't introduce new color families (cyan, pink, purple) — the single blue system is intentional.
- Don't use a colored background fill with `#3054ff` — it's a glow/accent color only.
- Don't add uppercase eyebrow labels to every section — use them only for card-level metadata labels.
- Don't add bounce or elastic easing.
