# Handoff: Halo Dashboard

## Overview

**Halo** is a wall-mounted, always-on home dashboard that pairs with a Philips Hue bridge and surfaces the data a household actually looks at every day:

- Room temperatures (from Hue motion sensors)
- Local weather + forecast (FMI / Tomorrow.io)
- Solar production + battery state (Solis inverter, FMI PV forecast)
- Motion / occupancy activity
- Hue light groups (control + state)

It's designed to be **glanceable from across the room** — Finnish UI, monochrome with a single warm orange accent, generous whitespace, no chrome, no marketing voice. Touch-first; this device lives on a wall.

This bundle is the design handoff for a redesign / rebuild of the Halo dashboard. It supersedes the original `eetu/hcc` frontend — same product surface, refined visual language, expanded Energy view.

## About the design files

The files in `design_files/` are **design references** — interactive HTML prototypes built with React + Babel running entirely in the browser. They show intended look, layout, copy, and micro-interactions. They are **not production code to copy directly.**

Your task is to **recreate these designs in the Halo codebase's existing environment** (Vite + React 19 + Emotion, theme defined in `frontend/src/themes.ts`, components in `frontend/src/components/`), using its established patterns: themed components via Emotion's `styled`, Material Icons via `<Icon>`, Chart.js for time-series, `@floating-ui/react` for tooltips, `date-fns` with `fi` locale.

If you're starting from a blank slate (no codebase yet), Vite + React + Emotion is the recommended target — it matches the existing design tokens cleanly and the prototypes translate 1:1.

## Fidelity

**High-fidelity.** The prototypes are pixel-accurate mockups with final colors, typography, spacing, copy, and interactions. Recreate them faithfully. Where this handoff names exact values (hex codes, px sizes, easing timings) those are **the** values — not suggestions.

The only intentionally-stubbed parts are data fetching (Hue bridge SSE, Solis API, FMI weather) and Chart.js wiring. Visual treatments for charts are correct; the data plumbing is yours to wire.

---

## Screens / Views

The dashboard is a **single page** with a fixed 720px column. A 48px nav rail on the left switches between six views; the clock + brand mark are persistent above the rail.

### 1. Temperature view (default)

Layout:
- Row 1: full-width `WeatherBox` (current weather + 4 day-segments + collapsible 24h chart drawer)
- Row 2: 4 equal `TempBox` cards — `ulkona` (outside), `sisällä` (inside), `kuisti` (porch / cold inside), `aurinko` (Solis solar production)

`TempBox`: 6px radius card, soft shadow, ~1.5em padding. Title in Space Grotesk 14px muted. Big number in Inter 50px tabular-nums (integer + degree sign). Trend arrow (Material `keyboard_arrow_up` / `keyboard_double_arrow_up`, optionally rotated 180°) absolutely positioned `right: -30; top: 0; bottom: 0;` so the digits stay optically centered. Click expands a drawer (150ms `grid-template-rows: 0fr → 1fr`) showing min/max/avg rows.

`SolisBox` (the 4th card on this row): same shape as `TempBox` but the big number is `kW` to one decimal; drawer rows show `Käyttää`, `Tänään`, `Kk`, `Akku` (with battery glyph + state: `lataa` / `purkaa` / `lepotila`).

`WeatherBox`: header row with current temp + Material weather glyph + `air` (wind) + `ac_unit` (feels-like). Below: 4 segments `aamu / päivä / ilta / yö` separated by 1px hairlines, each with a glyph + temp + rain (mm to one decimal, with `RaindropIcon`). Footer drag handle (`menu` icon, 25px strip) opens the chart drawer with a Chart.js line chart (warm `#e65100` / cool `#1565c0` / rain `#94daf7`).

### 2. Energy view

Single full-width region with three stacked patterns:

**a) `FlowDiagram` — animated PV ↔ home ↔ battery ↔ grid.**
SVG, viewBox `0 0 800 420`. Four primary nodes at r=36: PV (180,110), Battery (180,310), Grid (620,110), Home (400,210, center). One secondary node at r=22: `verkkokulutus` (620,310). Curved Bézier paths between them, dashed (`stroke-dasharray: 4 6`) and animated via `stroke-dashoffset` keyframes (`@keyframes halo-flow { to { stroke-dashoffset: -20 } }`, 1.4s linear infinite). Active nodes (PV + Home when sun is up) get a 2.4s ease-in-out `halo-pulse` animation (opacity 1→0.75, scale 1→1.04). Stroke colors:
- PV → home / battery / grid: `#f78f08` (accent)
- Battery → home: `#94daf7` (rain blue, doubles as cool/charge)
- Home → grid (export): muted, animation reversed
All labels (node name in Space Grotesk 14, sub-label in 12 muted, big kW number in Inter 20 tabular-nums) sit **outside** the circles — never inside. Header: `energiavirta` left, timestamp `02.05.2026 09.41 · ±1 min` right, `whiteSpace: nowrap`.

**b) `SummaryPanel` — daily summary donut + metrics.**
Header: `päivän yhteenveto` + range pills (`päivä` / `kk` / `vuosi` / `kaikki`). Active pill: 1px `#f78f08` border, `rgba(247,143,8,0.10)` background, accent text. Inactive: 1px `--hcc-border` border, transparent.

180px-wide donut on the left (SVG, viewBox 100×100, rotated -90°, two arcs via `stroke-dasharray`):
- Arc 1: PV → consumption, `#f78f08`
- Arc 2: PV → grid export, `#94daf7`
- Center label: `tuotto` (caption muted) + `5.8 kWh` (24px tabular-nums)

Right side: 2 legend rows (color dot + `pv → kulutukseen` / `pv → verkkoon` + value + percentage) above a 2×4 metric grid separated by a 1px top border. Each metric row: muted label left, tabular-nums value right. Metrics: päivän tuotto / lataus / tuonti / purkaus, verkkokulutus / varmennettu, generaattori / älykuorma.

**c) `DailyHistory` — multi-series 24h chart.**
SVG viewBox 720×220, 36px padding. Y-axis -8 to +8 kW with ticks/grid at -8/-4/0/4/8 (zero solid, others dashed). Right axis: SOC % ticks at 29/41/53/65. Five power lines + SOC overlay:
- `#f78f08` PV (2px stroke)
- `#5fb3a3` battery (1.5px)
- `#f5a524` grid (1px, 0.7 opacity)
- `#9aa0a6` verkkokulutus (1px, 0.6 opacity)
- `#c79bd6` varmennettu (1px, 0.5 opacity)
- `#d65a8a` SOC (1.5px, dashed `3 3`)
X-axis ticks at 00.00 / 06.00 / 12.00 / 18.00 / 24.00. Below: wrap-flex legend with same colors.

### 3. Lights view

Full-width grid of `LightGroup` chunky toggle buttons. Each: 6px radius, **3px border** (the only thick border in the system) — accent `#f78f08` when on, `--hcc-text-main` when off. Lit state fills with the cream gradient `--hcc-accent-bg` (`linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)`). Inside: a fully round (`borderRadius: 100%`) chip holding a filled Material `lightbulb` icon, with `rgba(247,143,8,0.15)` (light) or `rgba(0,0,0,0.15)` (dark) background to feel set into the parent. Lit bulbs get a soft animated drop-shadow glow.

### 4. Motion view

Full-width card containing a list of motion sensors. Each row: room name (Space Grotesk 14), state (`liikettä` / `ei liikettä` / `pois käytöstä`), relative timestamp (e.g. `5 min sitten`). Active rows are bolder; disabled rows are `opacity: 0.5`. Tapping a row toggles `enabled`. Empty state: `Ei liiketunnistimia`.

### 5. History view

Full-width card. Range pills above the chart: `6h / 24h / 7pv / 30pv` (1px border, 6px radius, 4–6px padding). Active pill: accent border + soft accent background. Chart: Chart.js line chart, `animation.duration: 0` so range switching feels instant.

### 6. Settings view

Full-width card. Single text input for location (`kaupunki tai osoite`, default `Tampere`). Below: small `local_offer` icon + `halo · v0.42.1` in muted caption type.

---

## Persistent chrome

### Brand mark (top-left, absolute)
- 22×22 SVG: thin ring (`stroke-width: 3`, currentColor) + 6r filled circle accent center. The ring is the "halo".
- Wordmark: Inter 600, lowercase, `letter-spacing: -0.04em`, 22px, `--hcc-text-main`. Trailing period in `--hcc-accent`.
- The wordmark is the brand. Use the same Inter 600 treatment everywhere — never substitute a display font.

### Clock (centered, below brand)
- HH `#525252` + accent dot `.` + MM, all Inter 400, 7em (~112px), tabular-nums, `letter-spacing: -0.02em`.
- Seconds counter: Space Grotesk, 0.22em of clock size (~25px), muted, baseline-aligned to the bottom of the digits.
- Date sub: Space Grotesk 1.1em (~18px), muted, format `lauantaina 02. toukokuuta 2026` (Finnish, lowercase weekday + lowercase month).

### Nav rail (left, 48px wide)
- 6 buttons, vertical stack, 4px gap. Material Icons Outlined at 26px.
- Active: accent color + 3×18px accent pill at `left: -2; top: 50%`.
- Inactive: `--hcc-text-muted`. No hover state — this is a touch device.
- Icons: `thermostat / bolt / lightbulb / directions_run / timeline / settings`

### Fullscreen toggle (top-right, absolute)
- `fullscreen` / `fullscreen_exit` Material Icons Outlined at 22px, muted, transparent button. Calls `document.documentElement.requestFullscreen()`.

---

## Interactions & behavior

| Element | Behavior |
|---|---|
| Stat card | Tap → drawer unfolds (`grid-template-rows: 0fr → 1fr`, 150ms ease). Tap again → closes. |
| Light group | Tap → border + background flip between off (text.main border, default surface) and on (accent border, cream gradient). Optimistically updates; reconciles when bridge SSE confirms. |
| Motion row | Tap → toggles `enabled`. Disabled rows go to `opacity: 0.5`. |
| Range pill | Tap → switches range, 150ms color transition. Chart re-renders with `animation.duration: 0` (instant). |
| Nav rail button | Tap → switches view. Active indicator pill snaps in. |
| Fullscreen toggle | Tap → `requestFullscreen()` / `exitFullscreen()`. Glyph swaps. |
| Clock | Updates every 1s. Accent dot is static — no separate pulse animation. |
| Energy flow strokes | `stroke-dashoffset` scrolls along path direction. Reverse animation for grid → home (import). |
| Energy node pulse | 2.4s ease-in-out infinite (opacity + scale) on currently-active nodes. |
| Spinner (loading) | Sun (`wb_sunny`) rotates 360° + cloud (`cloud`) translates 10px, both `1s alternate infinite`. |
| Tooltip | `fadeIn 0.5s` opacity. `@floating-ui/react`. |

**No hover states. No scroll-linked motion. No spring physics. No ripples.** If something needs to move, it fades or unfolds.

---

## State management

Suggested top-level state shape (the prototypes mirror this):

```ts
interface DashboardState {
  view: 'temperature' | 'energy' | 'lights' | 'motion' | 'history' | 'settings';
  groups: LightGroup[];     // { id, name, on, brightness }
  motion: MotionSensor[];   // { id, room, motion, enabled, lastSeenAt }
  temps: { outside, inside, insideCold };  // each { value, trend, history }
  solis: { pv, battery, soc, gridImport, gridExport, dailyYield, ... };
  weather: { current, hourly, daily };
  energyRange: 'day' | 'month' | 'year' | 'life';
  historyRange: '6h' | '24h' | '7pv' | '30pv';
}
```

Data sources:
- **Hue bridge** — SSE for groups + motion sensors. Optimistic toggles on the client.
- **Solis API** — poll every ~15s for inverter snapshot; persistent connection ideal.
- **FMI / Tomorrow.io** — poll every ~10min for current weather + hourly forecast + PV forecast.
- **Local sensor history** — server-side aggregation, fetch on view mount and on range change.

All times in Europe/Helsinki. All copy in Finnish via `date-fns/locale/fi`.

---

## Design tokens

All tokens live in `design_files/colors_and_type.css` as CSS custom properties. The codebase exposes the same tokens via `frontend/src/themes.ts` (Emotion theme). Token names use the legacy `--hcc-*` prefix for backwards compatibility — keep them.

### Colors — light theme

| Token | Value | Use |
|---|---|---|
| `--hcc-body` | `#f0f0f0` | Page background |
| `--hcc-bg-main` | `#ffffff` | Card surface |
| `--hcc-bg-light` | `#fbfbfb` | Drawer / nested surface |
| `--hcc-text-main` | `#525252` | Primary text (never pure black) |
| `--hcc-text-muted` | `#a0a0a0` | Inactive nav, secondary labels |
| `--hcc-text-light` | `#e9e9e9` | Footer chrome |
| `--hcc-border` | `lightgray` | 1px hairlines |
| `--hcc-accent` | `#f78f08` | The only saturated brand color |
| `--hcc-accent-bg` | `linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)` | Behind a lit bulb |
| `--hcc-accent-soft` | `rgba(247,143,8,0.15)` | Subtle accent fills |
| `--hcc-off-bg` | `#d9d9d9` | Behind an unlit bulb |
| `--hcc-error` | `tomato` | Low battery, alarm |
| `--hcc-connected` | `#4caf50` | Sensor pill connected |
| `--hcc-disconnected` | `#f44336` | Sensor pill disconnected |
| `--hcc-warm` | `#e65100` | Weather chart warm trend |
| `--hcc-cool` | `#1565c0` | Weather chart cool trend |
| `--hcc-rain` | `#94daf7` | Rain bars, battery flow |
| `--hcc-pv` | `#f5a524` | Grid line in energy chart |

### Colors — dark theme

Body `#0f0f0f`, surface `#252525`, drawer `#1c1c1c`. Text main `#d6d6d6` / muted `#8a8a8a` / light `#646464`. Same accent `#f78f08`. `--hcc-accent-bg` becomes `rgba(247,143,8,0.2)`. `--hcc-shadow: none`. Border becomes a 1px hairline `#1f1f1f`.

### Typography

| Family | Use | Weights |
|---|---|---|
| **Inter** | Body, labels, controls, all numerals, wordmark | 300 / 400 / 500 / 600 / 700 |
| **Space Grotesk** | Section labels, nav, date sub, seconds counter | 400 / 500 / 600 |

| Token | Size | Notes |
|---|---|---|
| Hero clock | `7em` (~112px) | Inter 400, tabular-nums, -0.02em tracking |
| Date sub | `1.1em` (~18px) | Space Grotesk 400, muted |
| Hero number (temp / kW) | `50px` | Inter 400, tabular-nums |
| Wordmark | 16–38px (typically 22px) | Inter 600, -0.04em tracking |
| h2 | 20px | Space Grotesk 500 |
| h3 | 18px | Space Grotesk 500 |
| body1 | 16px | Inter 400 |
| body2 | 14px | Inter 400 |
| caption | 13px | Inter 300 |

**Headings are never bold.** Hierarchy comes from size + family. Bold (600) is reserved for the wordmark, active motion rows, and chart data labels. All copy is lowercase — no `text-transform: capitalize` on labels (the date sub uses it because Finnish weekday names are inherently lowercase).

### Spacing

Pragmatic, not a strict scale. Recurring values: `4, 5, 8, 10, 16, 20, 24` px and `0.25em / 0.5em / 1em / 1.5em`. Card padding `1.5em`. Drawer padding `5px`. Nav button padding `4px 6px`.

### Geometry

| Token | Value |
|---|---|
| `--hcc-radius` | `6px` (every card, drawer, range pill, light button) |
| `--hcc-radius-pill` | `4px` |
| Light group chip | `border-radius: 100%` (only fully-round element) |
| Light group border | `3px` (only thick border in the system) |
| Card padding | `1.5em` |
| Column width | `720px` fixed on desktop |
| Nav rail width | `48px` |

### Shadow

Light theme — one shadow, applied to every card:

```css
box-shadow: rgba(60,64,67,0.3) 0 1px 2px 0,
            rgba(60,64,67,0.15) 0 2px 6px 2px;
```

Dark theme — `none`. Surface vs body contrast carries the elevation.

### Motion

| Token | Value |
|---|---|
| `--hcc-ease` | `ease` (browser default — no custom curves) |
| `--hcc-d-fast` | `0.15s` (color transitions, range pill swaps) |
| `--hcc-d-med` | `0.5s` (tooltip fade) |
| Drawer | 150ms ease, `grid-template-rows: 0fr → 1fr` |
| Energy flow scroll | 1.4s linear infinite |
| Energy node pulse | 2.4s ease-in-out infinite |
| Spinner | 1s alternate infinite |

---

## Iconography

**Material Icons Outlined** is the default. **Material Icons (filled)** is reserved for the lit bulb in `LightGroups`.

Loaded from Google Fonts CDN:

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

In the existing codebase, used as ligatures via `<Icon name="thermostat" />` (`frontend/src/components/Icon.tsx`). Default size 24px; `size` prop overrides.

Glyph inventory:

| Where | Icon |
|---|---|
| Nav rail | `thermostat`, `bolt`, `lightbulb`, `directions_run`, `timeline`, `settings` |
| Fullscreen | `fullscreen` / `fullscreen_exit` |
| Card footer | `menu` (drag handle) |
| Loading | `wb_sunny` + `cloud` |
| Errors | `error`, `warning`, `local_offer` |
| Light group | `lightbulb` (filled) |
| Motion | `sensors`, `sensors_off` |
| Weather extras | `air`, `ac_unit`, `solar_power` |
| Trend | `keyboard_arrow_up`, `keyboard_double_arrow_up` (rotated 180° for down) |
| Battery | `battery_full` … `battery_0_bar` |

A few hand-rolled SVG icons live alongside Material:
- `RaindropIcon` — outlined teardrop, currentColor stroke.
- `Arrow` — wind direction (compass triangle inside thin circle), rotates by `deg`.

**No emoji. No unicode pictographs.** When an icon ships next to a value, it sits to the **left** of the value, never trailing.

---

## Voice & copy

- **Localized in Finnish.** No English fallback. Use `date-fns/locale/fi`.
- **Lowercase, terse, label-style.** No headlines. No instructions. No first person — the product never says "you" or "we", it just states what it knows.
- **Numbers do the talking.** Big numerals, small units. Temperatures: integers + `°` (no `C`). Power: `kW` to one decimal. Energy: `kWh` / `Wh`. Rain: `mm` to one decimal. Wind: `m/s` to one decimal. Battery: integer `%`.
- **Time formatting:** `11.37` (Finnish 24h with **dot**, not colon). Date: `lauantaina 02. toukokuuta 2026` (lowercase weekday + month).
- **Range pills:** `6h`, `24h`, `7pv`, `30pv` (Finnish `pv` = päivää).

---

## Assets

In `assets/` (this skill):

- `halo-logo.svg` — ring + warm centre brand mark. Use at 22px in chrome; scale up for splash / about screens.
- `halo-wordmark.svg` — full lockup (mark + wordmark). Compose mark + Inter 600 wordmark inline when you need it as text alongside the mark.

Deployed favicons live in the host repo at `frontend/public/`:

- `favicon.svg` — vector, primary; halo logo with `#525252` ring + `#f78f08` dot.
- `favicon.png` — 512×512 raster fallback (transparent).
- `favicon.ico` — multi-resolution (16/32/48/64/128/256) fallback.

Treat the production files as the source of truth — do not re-bundle stale favicons in this skill.

Inter and Space Grotesk are loaded from Google Fonts CDN. For an offline build, download both families and self-host; rewrite the `@import` in `colors_and_type.css`.

---

## Files in this bundle

```
design_handoff_halo_dashboard/
├── README.md                                      ← this file
└── design_files/
    ├── SKILL.md                                   ← Claude Code skill manifest
    ├── HALO_DESIGN_README.md                      ← full design system reference (visual language, voice, tokens)
    ├── colors_and_type.css                        ← all design tokens as CSS variables
    ├── assets/                                    ← brand mark and wordmark
    │   ├── halo-logo.svg
    │   └── halo-wordmark.svg
    └── ui_kits/
        └── dashboard/
            ├── index.html                         ← runtime entry; open this to view the prototype
            ├── App.jsx                            ← root layout, clock, nav rail, view router
            ├── Card.jsx                           ← <Card> + <DrawerRow> primitives
            ├── TempBox.jsx                        ← stat card (temperature)
            ├── SolisBox.jsx                       ← stat card (solar / battery)
            ├── WeatherBox.jsx                     ← weather card + day-segments + chart drawer
            ├── EnergyFlow.jsx                     ← Energy view: flow diagram + summary panel + day chart
            ├── LightGroups.jsx                    ← chunky lit-bulb toggle buttons
            ├── MotionList.jsx                     ← motion sensor list
            ├── History.jsx                        ← history view with range pills
            ├── data.js                            ← fake state used to drive the screens
            └── README.md                          ← per-component notes
```

To view the prototype: open `design_files/ui_kits/dashboard/index.html` in a browser. It runs entirely client-side (React + Babel via CDN). Click through the nav rail to see each view; click stat cards to expand drawers; click light groups to toggle.

---

## Installing as a Claude Code skill

To make this design system available to Claude Code inside the Halo repo:

```
eetu/hcc/.claude/skills/halo-design/
├── SKILL.md                  ← from this bundle
├── README.md                 ← rename HALO_DESIGN_README.md back to README.md
├── colors_and_type.css
├── assets/
└── ui_kits/
```

Copy `SKILL.md`, `HALO_DESIGN_README.md` (rename to `README.md`), `colors_and_type.css`, `assets/`, and `ui_kits/` into `.claude/skills/halo-design/`. Commit. Claude Code auto-registers the skill on next session and any contributor can invoke it.

## Implementation checklist

- [ ] Confirm or import design tokens into `frontend/src/themes.ts` — light + dark, all `--hcc-*` keys above.
- [ ] Wire Inter + Space Grotesk + Material Icons Outlined + Material Icons via Google Fonts (or self-host for offline).
- [ ] `App.tsx` — fixed 720px column, clock + nav rail + view router. Six views routed by local state.
- [ ] `Clock.tsx` — 1s interval; HH + accent dot + MM + seconds + date sub.
- [ ] `Card.tsx` — surface + shadow + radius + drawer footer with `menu` drag handle.
- [ ] `TempBox.tsx` / `SolisBox.tsx` — stat cards with absolute trend arrow at `right: -30`.
- [ ] `WeatherBox.tsx` — current + 4 day-segments + Chart.js drawer.
- [ ] `EnergyFlow.tsx` — three sections: flow diagram (animated SVG), summary panel (donut + metrics + range pills), day chart (multi-series + SOC).
- [ ] `LightGroups.tsx` — 3px bordered buttons with cream gradient fill on lit state, round chip + glowing filled `lightbulb`.
- [ ] `MotionList.tsx` — sensor rows with relative timestamps, opacity 0.5 when disabled.
- [ ] `HistoryView.tsx` — range pills + Chart.js line chart with `animation.duration: 0`.
- [ ] `Settings.tsx` — location input + version label.
- [ ] Wire data: Hue SSE (groups + motion), Solis polling, FMI weather polling.
- [ ] All copy in Finnish via `fi` locale. Lowercase. No marketing voice. No "you" / "we".
- [ ] No hover styles. No emoji. Material Icons Outlined default; filled only for lit bulbs.
- [ ] Verify dark theme via `prefers-color-scheme` and explicit `[data-theme="dark"]` override.
- [ ] Test fullscreen toggle on the wall-mounted target device.

---

## Caveats

- The energy data shown in the prototype (PV split, daily totals, multi-series chart) is **simulated** in `data.js` and `EnergyFlow.jsx`. Real Solis Cloud integration is yours to wire — the visualization patterns (donut, metric grid, range pills, multi-series chart) are reusable for any inverter.
- The prototype's `index.html` loads React 18, but the codebase runs React 19. Behavior is compatible; no changes needed beyond adapting JSX to TSX.
- Chart.js wiring is stubbed in the History view (`History.jsx`). Use the real library; respect `animation.duration: 0`.
- Tooltips are not implemented in the prototypes. Use `@floating-ui/react` per the existing codebase.
