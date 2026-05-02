# Halo Dashboard UI Kit

The dashboard is shipped as production code in `frontend/` (Vite + React 19 + Emotion). The runnable references below are the source of truth — earlier JSX prototypes were removed once the production code matched the design.

## Component map

| Concept | File |
|---|---|
| Root layout, nav rail, view switching | `frontend/src/App.tsx` |
| Wordmark (ring + dot + `halo.`) | `frontend/src/components/Wordmark.tsx` |
| Clock + date | `frontend/src/components/CurrentTime.tsx` |
| Card primitive (shadow, drawer, footer drag handle) | `frontend/src/components/Box.tsx` |
| Temperature card (TempBox in mock) | `frontend/src/components/TemperatureBox.tsx` |
| Solar card | `frontend/src/components/SolisBox.tsx` |
| FMI weather card (current + segments + chart drawer) | `frontend/src/components/FmiWeatherBox.tsx` |
| Weather chart in drawer | `frontend/src/components/WeatherChart.tsx` |
| Light group toggle | `frontend/src/components/LightGroups.tsx` |
| Motion list with pulse dot | `frontend/src/components/Motion.tsx` |
| History (range pills + multi-sensor chart) | `frontend/src/components/History.tsx` |
| Trend arrow | `frontend/src/components/TrendIndicator.tsx` |
| Loading spinner | `frontend/src/components/Spinner.tsx` |
| Wind direction arrow | `frontend/src/components/Arrow.tsx` |
| Raindrop SVG icon | `frontend/src/components/RaindropIcon.tsx` |

## Energy view

| Concept | File |
|---|---|
| Top-level energy view (composes Flow + DailyHistory) | inline in `App.tsx` (`view === "energy"`) |
| Animated PV ↔ inverter ↔ home / battery / grid flow diagram | `frontend/src/components/Energy/Flow.tsx` |
| Multi-series 24h kW + SOC chart with range pills | `frontend/src/components/Energy/DailyHistory.tsx` |

The Halo design also calls for a `SummaryPanel` (donut split + metric grid). Not yet implemented in production — needs aggregated metrics that aren't surfaced by the backend yet (`/api/solis` is current state only; `/api/history/solis` is per-tick power readings).

## Tokens

`frontend/src/themes.ts` is the source of truth for colors, fonts, radii, shadows, and per-style typography. `colors_and_type.css` in this skill mirrors those tokens as plain CSS variables for HTML mockups.

## When you need to mock something new

Build a small static HTML file using `colors_and_type.css` and the assets in `assets/`. Don't recreate the existing dashboard — refer to the production files above.
