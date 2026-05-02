Control center for home Hue bridge

## Roadmap

1. Show all temperatures from philips motion sensors
2. ?
3. Profit

## Getting Started

### Environment

```bash
TOMORROW_IO_API_KEY=        # tomorrow.io API key
HUE_BRIDGE_ADDRESS=         # optional — auto-discovered via meethue.com if omitted
HUE_BRIDGE_USER=            # obtained via the pairing flow below
LANGUAGE=fi
HCC_IMAGE_TAG=              # version label shown on the front page
HCC_DB_PATH=/data/hcc.db    # SQLite database path (default: hcc.db in working directory)
HCC_HISTORY_RETENTION_DAYS=90 # days of sensor history to keep (default: 0/disabled)

# Maps room types to lists of room names as configured in the Hue app.
# Rooms not listed default to "inside".
HUE_ROOM_TYPES={"inside": ["Keittiö", "Olohuone"], "inside_cold": ["Kuisti"], "outside": ["Ulkona"]}

# SolisCloud (PV inverter) — required for the energy view + history.
SOLIS_KEY_ID=
SOLIS_KEY_SECRET=
SOLIS_STATION_ID=
SOLIS_BASE_URL=             # default https://www.soliscloud.com:13333

```

PV forecast vars (`PV_LAT`, `PV_LON`, `PV_TILT`, `PV_AZIMUTH`, `PV_KW`) are
consumed by `scripts/refresh-pv-forecast.sh` — see the "PV forecast"
section below for details.

### Pairing with the Hue bridge

1. Press the link button on the bridge
2. POST to `/api/hue/pair` (optionally pass `{"bridgeIp": "x.x.x.x"}` in the body if discovery fails)
3. Copy the returned `HUE_BRIDGE_ADDRESS` and `HUE_BRIDGE_USER` values into `.env`

### Sensor display names

Sensor names are taken directly from the device names set in the Hue app. To differentiate multiple sensors in the same room (e.g. sun vs. shadow), rename the devices in the Hue app.

### Git hooks

```bash
./install-hooks.sh
```

Configures a pre-commit hook that runs `yarn lint` for frontend changes and `cargo clippy` for backend changes.

### Run

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sensor history

Temperature readings from all enabled and connected sensors are automatically recorded to a SQLite database every 5 minutes. Old readings are pruned automatically based on `HCC_HISTORY_RETENTION_DAYS` (default: 90).

### Storage

In Docker the database is stored in a named volume (`hcc-data`) at `/data/hcc.db`. In development it defaults to `hcc.db` in the working directory.

### API

```
GET /api/history/sensors?sensor_id=<id>&hours=<n>
```

| Parameter   | Required | Default | Description                          |
|-------------|----------|---------|--------------------------------------|
| `sensor_id` | no       | all     | Filter to a specific sensor          |
| `hours`     | no       | 24      | Hours of history to return (max 720) |

## Solis history

When SolisCloud is configured, the backend polls `/v1/api/stationDetail` every 5 minutes and writes a row to `solis_readings` (PV power, grid power, battery SoC + power, today's energy, status). Readings during inverter offline (`status=2`) are skipped to keep gaps visible in the chart. Retention follows `HCC_HISTORY_RETENTION_DAYS`.

```
GET /api/history/solis?hours=<n>&max_points=<m>
```

| Parameter    | Required | Default | Description                                 |
|--------------|----------|---------|---------------------------------------------|
| `hours`      | no       | 24      | Hours of history to return (max 720)        |
| `max_points` | no       | —       | Uniform sampling cap (window-function based) |

## PV forecast

The backend exposes `GET/POST /api/pv/forecast`. The actual forecast is
produced by an external one-shot CLI maintained in a separate repository,
[fmi-pv-forecast-runner](https://github.com/eetu/fmi-pv-forecast-runner),
which wraps the
[FMI open PV forecast](https://github.com/fmidev/fmi-open-pv-forecast-packaged)
package and emits the next ~66 hours of hourly output as JSON on stdout.

Refreshing the forecast is a two-step shell pipeline: run the CLI, pipe
its stdout to `POST /api/pv/forecast`. `scripts/refresh-pv-forecast.sh`
wraps both:

```bash
# Auto-detect: uses local uv repo if ../fmi-pv-forecast-runner/ is checked out,
# otherwise pulls the published Docker image.
HCC_PV_ENV_FILE=.env.pv ./scripts/refresh-pv-forecast.sh

# Force a specific mode:
./scripts/refresh-pv-forecast.sh uv
./scripts/refresh-pv-forecast.sh docker
```

Required env vars (place in `$HCC_PV_ENV_FILE` or export beforehand):
`PV_LAT`, `PV_LON`, `PV_TILT`, `PV_AZIMUTH`, `PV_KW`. Optional overrides:
`HCC_BACKEND_URL` (default `http://localhost:3000`), `PV_RUNNER_PATH`,
`PV_RUNNER_IMAGE`.

### Cold-start and periodic refresh

Run the script once manually to populate the database after the first
deploy. For a 3-hour refresh cadence (matching the upstream forecast
update interval), add a host cron entry:

```cron
17 */3 * * * cd /opt/hcc && HCC_PV_ENV_FILE=/opt/hcc/.env.pv ./scripts/refresh-pv-forecast.sh >>/var/log/hcc-pv.log 2>&1
```

### Storage and rendering

Hourly forecast points are upserted into the `pv_forecast_points` table
(steady-state ≤66 rows) and rendered as bars on the daily weather chart,
aggregated to kWh per day.

### Geographic limits

The FMI forecast covers Finland, Scandinavia, and the Baltic countries. See
[ilmatieteenlaitos.fi/numerical-weather-prediction](https://en.ilmatieteenlaitos.fi/numerical-weather-prediction)
for the full available area.

## Views

### Temperature (default)

![temperature view](/documentation/screenshots/main.png)

Glanceable home dashboard. Top row: current weather + 4 day-segments with a collapsible 7-day chart drawer (FMI temperature line, rain bars in blue, PV forecast bars in orange with daily kWh). Bottom row: temperature cards for `ulkona`, `sisällä`, `kuisti` (each averaging Hue motion sensor readings, with low-battery and trend indicators) plus the `Solis` solar production card (kW now). Tap any card to expand a drawer with per-sensor details.

### Energy

![energy view](/documentation/screenshots/energy.png)

Live PV ↔ inverter ↔ home / battery / grid flow diagram from SolisCloud. Active paths animate (dashed scrolling stroke); idle paths stay static at reduced opacity. Each node carries its current kW, plus aurinko shows today's kWh, akku shows SOC %, verkko shows direction (`tuonti` / `vienti` / `lepotila`).

### Lights

![lights view](/documentation/screenshots/lights.png)

All Hue rooms / zones as tappable toggles. Lit groups get a warm cream background, accent ring, and a softly glowing bulb. Status row shows `päällä` / `pois` with a state dot.

### Motion

![motion view](/documentation/screenshots/motion.png)

All Hue motion sensors in a single list. Active rows show a pulsing accent dot and bold `liikettä`; idle rows stay muted. Disabled sensors fade out. Last-trigger timestamp on the right uses Finnish relative formatting.

### History

![history view](/documentation/screenshots/history.png)

Sensor temperature history from the local SQLite store. Range pills (`6h`, `24h`, `7pv`, `30pv`) trigger backend-side downsampling so wide ranges stay snappy. Per-sensor colors are derived from room type (cool blues for outside, warm reds for inside, greens for cold-inside).

### Settings

![settings view](/documentation/screenshots/settings.png)

Location set via address search or device geolocation, plus the deployed image tag.

### Screenshot mode

Append `?demo=1` to any URL to anonymize sensor / room / location names (stable hashed labels like `anturi 042`, `ryhmä 488`). Useful for sharing screenshots without leaking topology.
