---
name: halo-design
description: Use this skill to generate well-branded interfaces and assets for Halo (a wall-mounted home dashboard for Hue + solar/energy data), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `ui_kits/dashboard/README.md`).

For production code, the source of truth lives in the host repo:
- Components: `frontend/src/components/`
- Theme tokens: `frontend/src/themes.ts`
- Energy view: `frontend/src/components/Energy/`
- Component-to-file map: `ui_kits/dashboard/README.md`

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, refer to existing components first; do not recreate them as JSX prototypes.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key things to keep in mind for Halo:

- **Finnish, lowercase, terse.** No marketing voice. Numbers do the talking.
- **Monochrome + one warm accent.** Greys, with `#f78f08` as the only saturated color (lit lights, active motion, warm trends, energy flow). Optional warm/cool weather hues.
- **Two families.** Inter (body + numerals + wordmark, 300–700) and Space Grotesk (section labels, nav, date sub, seconds counter, 400–600). The wordmark is Inter 600 with tight (−0.04em) tracking and a warm accent dot.
- **Brand mark:** thin ring + warm centre. The wordmark "halo." is set in Inter 600 lowercase — same family as the numerals on the dashboard, so brand and data read as one. Tokens use the `--halo-*` prefix.
- **Cards: 6px radius, soft shadow** in light theme; shadow turns off in dark.
- **No emoji, no hero imagery.** Material Icons (Outlined default; Filled only for the lit-bulb, which softly glows).
- **Calm motion with small wow moments.** Drawer unfolds (150ms), clock colon pulses on every second, lit bulbs breathe, active motion dot pulses outward, energy-flow strokes scroll along their paths, temperature counters ease to new values.
- **Wall-mounted touch device** — no hover states, big tap targets, big numbers.
