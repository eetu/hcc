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

## Media

![screenshot](/documentation/screenshot.png)
