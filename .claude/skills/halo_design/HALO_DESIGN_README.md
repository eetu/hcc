# halo — Home Dashboard Design System

A small, single‑purpose **home‑automation dashboard** that pairs with a Philips Hue bridge and surfaces the data you actually look at every day: room temperatures from Hue motion sensors, weather (FMI / Tomorrow.io), solar production (Solis inverter + FMI PV forecast), motion activity, and Hue light groups.

It's a wall‑mounted / always‑on dashboard first — Finnish, monochrome with a single warm orange highlight, generous whitespace, no chrome. Designed to be glanceable from across the room.

## Source material

This design system was reverse‑engineered from a single source:

- **Code:** `eetu/halo` (branch `develop`) — `frontend/` directory. Vite + React 19 + Emotion. Theme defined in `frontend/src/themes.ts`. UI in `frontend/src/components/`. Reference screenshot: `frontend/documentation/screenshot.png` (also copied to `assets/screenshot.png`).
- **Stack signals:** Open Sans (Google Fonts, weights 300 / 400 / 700), Material Icons + Material Icons Outlined (Google Fonts), Chart.js for time‑series, `@floating-ui/react` for tooltips, Finnish locale via `date-fns/locale/fi`.

There is one product surface: the **dashboard** (`ui_kits/dashboard/`). No marketing site, no mobile app, no separate admin tool.

## Index

| File | What's in it |
|---|---|
| `README.md` | This file — context, content, visuals, iconography. |
| `SKILL.md` | Skill manifest for use as a reusable design skill. |
| `colors_and_type.css` | All design tokens as CSS variables — colors (light + dark), type, spacing, radii, shadows. |
| `assets/` | Logos, favicon, reference screenshot. |
| `fonts/` | (Webfonts loaded from Google Fonts CDN — see `colors_and_type.css`.) |
| `preview/` | Cards rendered in the Design System tab. One sub‑concept per card. |
| `ui_kits/dashboard/` | Pixel‑level recreation of the live dashboard with click‑through views. |

---

## Content fundamentals

The product is **localized in Finnish**. Copy is set by `LANGUAGE=fi` and rendered through `date-fns/locale/fi`. All labels, dates, and weekdays are Finnish — no English fallback.

**Voice and casing.** Lowercase, terse, label‑style. No headlines. No instructions. No marketing voice. The product never addresses the user — there is no "you", no "we", no first person. It just states what it knows.

| Place | Copy |
|---|---|
| Section labels | `ulkona`, `sisällä`, `kuisti`, `päivä`, `ilta`, `yö`, `aamu` (all lowercase, no period) |
| Drawer rows | `Käyttää`, `Tänään`, `Kk`, `Akku`, `lataa`, `purkaa`, `lepotila` (sentence‑case for the row label, lowercase for the state) |
| Motion list | `liikettä` / `ei liikettä` / `pois käytöstä` |
| Empty / accessibility | `Ei liiketunnistimia`, `Ei historiadataa`, `Ladataan…`, `Poista liiketunnistin käytöstä` / `Ota käyttöön` |
| Time formatting | `11.37` (Finnish 24h with dot, **not** colon), `Perjantaina 01. Toukokuuta 2026` (capitalised first‑letter weekday + month via `text‑transform: capitalize`) |
| Range pills | `6h`, `24h`, `7pv`, `30pv` (Finnish `pv` = päivää) |

**Numbers do the talking.** Big numerals, small units. Temperatures are integers with `°` (no `C`). Power is `kW` to one decimal. Energy `kWh`, `Wh`. Rain `mm` to one decimal. Wind `m/s` to one decimal. Battery percentages are integers with `%`.

**No emoji. No icon‑plus‑text decoration.** When an icon ships with a value (battery, raindrop, wind), it sits to the LEFT of the value, never trailing. Material Icons Outlined is the default; the filled variant is reserved for the lit‑bulb in `LightGroups`, which gets a soft animated drop‑shadow glow.

**No empty states beyond a single Finnish sentence.** Errors collapse to a Material `error` icon in `theme.colors.error`. Loading collapses to a small spinning sun + drifting cloud animation (`Spinner.tsx`).

---

## Visual foundations

### Color

Two themes, swapped by `prefers-color-scheme`. The accent (`activity.on = #f78f08`) is the only saturated color in the entire UI; everything else is greyscale plus weather‑chart blues/oranges.

**Light theme (default):**

| Token | Value | Use |
|---|---|---|
| `body` | `#f0f0f0` | Page background. |
| `background.main` | `#ffffff` | Card surface. |
| `background.light` | `#fbfbfb` | Drawer / nested surface. |
| `text.main` | `#525252` | Primary text. Never pure black. |
| `text.muted` | `#a0a0a0` | Inactive nav, secondary labels, muted ticks. |
| `text.light` | `#e9e9e9` | Footer chrome (drag handle icon). |
| `border` | `lightgray` | 1px hairlines between cells. |
| `activity.on` | `#f78f08` | The single accent — lit lightbulbs, active motion, warm trend. |
| `activity.onBackground` | `linear-gradient(153deg, rgba(255,237,207,1) 0%, rgba(255,239,171,1) 56%)` | Behind a lit bulb. |
| `activity.offBackground` | `#d9d9d9` | Behind an unlit bulb. |
| `error` | `tomato` | Low battery, alarm, fetch error. |
| `connected` / `disconnected` | `#4caf50` / `#f44336` | Sensor pill. |
| `warm` / `cool` | `#e65100` / `#1565c0` | Weather chart line, trend arrows. |

**Dark theme:** body `#0f0f0f`, surface `#252525`, drawer `#1c1c1c`, text main `#d6d6d6` / muted `#8a8a8a` / light `#646464`. Same accent `#f78f08`. `activity.onBackground` is `rgba(247,143,8,0.2)`. Shadows turn off (`shadows.main: "none"`) and a 1px hairline border replaces them.

### Typography

**Two families, each with one job.** All loaded from Google Fonts.

| Family | Use | Weights |
|---|---|---|
| **Inter** | Body, labels, controls, **all numeric values** (clock, temperatures, kW), and the **wordmark**. The neutral workhorse, with a heavy 600 used for the brand mark. | 300 / 400 / 500 / 600 / 700 |
| **Space Grotesk** | Section labels, nav, the date sub under the clock, the seconds counter. Geometric with a touch of character. | 400 / 500 / 600 |

Two variables expose them: `--halo-font` (Inter), `--halo-font-heading` (Space Grotesk). Numeric values — clock, temperature digits, kW readouts — share the same Inter treatment with `font-variant-numeric: tabular-nums` so they read as one family of measurements. The wordmark uses Inter at weight 600 with tight (−0.04em) tracking and a warm accent dot — it sits in the same family as the numerals so brand and data feel of‑a‑piece.

| Token | Size | Family / weight |
|---|---|---|
| Hero clock | `7em` (~112px) | Inter, 400, tabular nums |
| Date sub | `1.1em` | Space Grotesk, 400 |
| Hero numbers (temp, kW) | 50px | Inter, 400, tabular nums |
| Wordmark | 16–38px | Inter, 600, tracking −0.04em |
| `h2` | 20px | Space Grotesk, 500 |
| `h3` | 18px | Space Grotesk, 500 |
| `body1` | 16px | Inter, 400 |
| `body2` | 14px | Inter, 400 |
| `caption` | 13px | Inter, 300 |

Headings are **never bold**. Bold (600) appears only on the wordmark, on active motion rows, and on chart data labels. Hierarchy comes from **size and family**, not weight. Copy stays lowercase — no `text-transform: capitalize` on labels.

### Spacing & layout

The dashboard is a **fixed 720px column** centred in the viewport, with a 48px icon rail on the left and a 4‑column grid (`gap: 20`) on the right. Below 600px (`mq[0]`) the rail flips horizontal and the grid collapses to a stack. Card padding is `1.5em`; drawer padding is `5px`; nav button padding is `4px 6px`.

There is **no spacing scale token** — the codebase uses raw px/em values pragmatically. The recurring values are `4, 5, 8, 10, 16, 20, 24` px and `0.25em, 0.5em, 1em, 1.5em`.

### Radii

A single token: `border.radius = 6`. Every card, every drawer, every range‑pill, every light‑group button uses 6px. The lightbulb chip inside a `LightGroup` is the only fully round element (`borderRadius: 100%`), as is the wind arrow's outer ring.

### Shadows / elevation

Light theme uses one shadow, applied to every card:

```
rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
rgba(60, 64, 67, 0.15) 0px 2px 6px 2px
```

That's it — no elevation scale, no hover lift, no inner shadows, no glow. Dark theme drops shadow entirely (`none`) and relies on the surface vs. body contrast.

### Borders

`1px ${theme.colors.border} solid` hairlines: between the `BoxHeader` and the drawer; between the four day‑segments in the weather strip; around range‑pills. The only thick border in the system is the **3px** ring around `LightGroup` buttons (orange when on, text.main when off) — a deliberate, chunky control affordance.

### Backgrounds & imagery

There are **no hero images, no gradients, no textures, no illustrations** anywhere in the product. The only gradient is the warm cream `activity.onBackground` behind a lit bulb. Photographs and decorative imagery are not part of the visual language. Charts are the only "visual" content.

### Animation

Motion is sparse and short — easing is the browser default (`ease`).

| Element | Animation |
|---|---|
| Drawer open/close | `grid-template-rows: 0fr → 1fr`, **150ms ease**. The whole card "unfolds". |
| Nav icon hover/active | `color 0.15s, border-color 0.15s`. Just a color swap. |
| Spinner | Two `1s alternate infinite` keyframes — sun rotates 360°, cloud translates 10px. |
| Tooltip | `fadeIn 0.5s`. Opacity only. |
| Range pill switch | `all 0.15s`. |
| Charts | `animation.duration: 0` on history (snappy range switching). |

No bounces, no spring physics, no parallax, no scroll‑linked motion. If something needs to move, it fades or unfolds.

### Hover & press

The product is wall‑mounted — touch first, mouse incidental. There is no `:hover` style anywhere (nav buttons swap color via `view===id` state, not pseudo‑class). Press feedback is **state‑driven**: a tapped card opens its drawer; a tapped light group flips its border + background to the lit treatment; a tapped motion row toggles `enabled` and dims to `opacity: 0.5`. No press scale, no ripple.

### Transparency & blur

Used twice. (1) The disabled motion row is `opacity: 0.5`. (2) The lightbulb chip's inner circle uses `rgba(247, 143, 8, 0.15)` / `rgba(0,0,0,0.15)` to feel "set into" the parent button. There is no `backdrop‑filter`, no glassmorphism.

### Cards

All cards share one recipe: `background.main` surface + 6px radius + the standard shadow + `1.5em` padding. Cards that are expandable (Box) get a 25px footer strip with a centred `menu` icon (the drag handle) and a hairline divider that only appears when open. Cards that aren't expandable (Motion list, History, Settings) skip the footer.

### Layout rules

- Fixed 720px content column on desktop. Full‑width with 12px padding on mobile.
- Fullscreen toggle pinned `position: absolute; top: 8px; right: 8px;` — the only persistently positioned element.
- Stat cards (`TemperatureBox`, `SolisBox`) center their content vertically and horizontally; the title sits above the big number with a 5px gap.
- Trend arrow is `position: absolute; right: -30; top: 0; bottom: 0;` of the temperature digits — it floats outside the optical text box so the number stays centered.

---

## Iconography

**Material Icons (Outlined by default, Filled for accents).** Loaded from Google Fonts:

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

Used as ligatures via the `<Icon>` component (`frontend/src/components/Icon.tsx`). Default size 24px; `size` prop overrides. Outlined is the system default — used everywhere except the lit‑bulb in `LightGroups` (which uses filled `material-icons` for visual weight).

**Glyph inventory observed in the code:**

| Where | Icon |
|---|---|
| Nav rail | `thermostat`, `lightbulb`, `directions_run`, `timeline`, `settings` |
| Fullscreen toggle | `fullscreen` / `fullscreen_exit` |
| Card footer (drag) | `menu` |
| Loading | `wb_sunny` + `cloud` (animated together) |
| Errors / status | `error`, `warning`, `local_offer` |
| Light group | `lightbulb` (filled) |
| Motion | `sensors`, `sensors_off` |
| Weather extras | `air`, `ac_unit`, `solar_power` |
| Trend | `keyboard_arrow_up`, `keyboard_double_arrow_up` (rotated 180° for down) |
| Battery | `battery_full`, `battery_6_bar` … `battery_0_bar` |

**A few hand‑rolled SVG icons** live alongside Material:
- `RaindropIcon.tsx` — outlined teardrop, currentColor stroke.
- `Arrow.tsx` — wind direction (compass triangle inside a thin circle), rotates by `deg`.
- `frontend/public/favicon.svg` — halo brand mark (ring + warm dot), used as primary favicon.

These are extensions of Material's "outlined, currentColor, 24px" vibe, not departures from it.

**No emoji. No unicode pictographs.** `lucide-react` is used in two places: (1) the FMI weather icon factory, which maps weather codes to Lucide components, and (2) the Energy view flow diagram (`frontend/src/components/Energy/Flow.tsx`), which renders nodes (Sun, Activity, Battery*, Plug, House) inside SVG `<foreignObject>`s.

For this design system, Material Icons is loaded **from the Google CDN** (matching the source). No local icon font is bundled.

---

## Caveats & substitutions

- Inter and Space Grotesk are loaded from Google Fonts CDN. If you want offline use, download both families and drop them into `fonts/`, then rewrite the `@import` in `colors_and_type.css`.
- Material Icons is loaded from Google Fonts CDN. The repo has no bundled icon font.
- The repo ships only a favicon house glyph; the **Halo** mark (thin ring + warm centre) and lowercase Inter 600 wordmark are introduced by this design system. Logos live at `assets/halo-logo.svg` and `assets/halo-wordmark.svg`.
