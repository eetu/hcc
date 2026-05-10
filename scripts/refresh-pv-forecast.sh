#!/usr/bin/env bash
# Refresh the PV forecast in the halo backend.
#
# Usage:
#   scripts/refresh-pv-forecast.sh                  # auto-detect: uv if local repo present, else docker
#   scripts/refresh-pv-forecast.sh uv               # force local uv invocation
#   scripts/refresh-pv-forecast.sh docker           # force docker invocation
#
# Required env (sourced from $HALO_PV_ENV_FILE if set, otherwise inherited):
#   PV_LAT, PV_LON, PV_TILT, PV_AZIMUTH, PV_KW
# Optional:
#   HALO_BACKEND_URL  default http://localhost:3000
#   PV_RUNNER_PATH    path to local fmi-pv-forecast-runner repo (default: ../fmi-pv-forecast-runner)
#   PV_RUNNER_IMAGE   docker image to use (default: ghcr.io/eetu/fmi-pv-forecast-runner:latest)
#   HALO_PV_ENV_FILE  path to a .env file to source for PV_* vars

set -euo pipefail

mode="${1:-auto}"
backend_url="${HALO_BACKEND_URL:-http://localhost:3000}"
runner_path="${PV_RUNNER_PATH:-../fmi-pv-forecast-runner}"
runner_image="${PV_RUNNER_IMAGE:-ghcr.io/eetu/fmi-pv-forecast-runner:latest}"

if [[ -n "${HALO_PV_ENV_FILE:-}" && -f "$HALO_PV_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$HALO_PV_ENV_FILE"
  set +a
fi

for var in PV_LAT PV_LON PV_TILT PV_AZIMUTH PV_KW; do
  if [[ -z "${!var:-}" ]]; then
    echo "missing required env: $var" >&2
    exit 1
  fi
done

if [[ "$mode" == "auto" ]]; then
  if [[ -f "$runner_path/pyproject.toml" ]] && command -v uv >/dev/null 2>&1; then
    mode="uv"
  else
    mode="docker"
  fi
fi

case "$mode" in
  uv)
    echo "running fmi-pv-forecast-runner via uv at $runner_path" >&2
    forecast_json=$(
      cd "$runner_path"
      PV_LAT="$PV_LAT" PV_LON="$PV_LON" PV_TILT="$PV_TILT" \
        PV_AZIMUTH="$PV_AZIMUTH" PV_KW="$PV_KW" \
        uv run --quiet python run.py
    )
    ;;
  docker)
    echo "running fmi-pv-forecast-runner via docker image $runner_image" >&2
    forecast_json=$(
      docker run --rm \
        -e PV_LAT="$PV_LAT" \
        -e PV_LON="$PV_LON" \
        -e PV_TILT="$PV_TILT" \
        -e PV_AZIMUTH="$PV_AZIMUTH" \
        -e PV_KW="$PV_KW" \
        "$runner_image"
    )
    ;;
  *)
    echo "unknown mode: $mode (expected: auto, uv, docker)" >&2
    exit 1
    ;;
esac

echo "posting forecast to $backend_url/api/pv/forecast" >&2
curl -fsS \
  -X POST \
  -H 'Content-Type: application/json' \
  --data-binary "$forecast_json" \
  "$backend_url/api/pv/forecast"
echo
