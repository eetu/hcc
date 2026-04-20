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

## Media

![screenshot](/documentation/screenshot.png)
