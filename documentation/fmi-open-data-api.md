# FMI Open Data API Reference

Finnish Meteorological Institute (Ilmatieteenlaitos) provides free weather data via a WFS (Web Feature Service) XML API.

**No API key required.** Rate limits are generous but undocumented — cache responses (1h is appropriate).

## Base URL

```
https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature
```

## Location Parameters

All stored queries accept these location params (use one):

| Parameter | Example | Notes |
|-----------|---------|-------|
| `place` | `tampere` | City name, case-insensitive |
| `latlon` | `61.5,23.8` | Latitude,longitude |
| `fmisid` | `101311` | FMI station ID |
| `geoid` | `-16000074` | Geonames.org ID |
| `wmo` | `2943` | WMO station code |

## Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `starttime` | ISO 8601 | Begin of time interval (e.g., `2026-04-19T00:00:00Z`) |
| `endtime` | ISO 8601 | End of time interval |
| `timestep` | int (minutes) | Time resolution (e.g., `60` for hourly) |
| `parameters` | comma-separated | Which data fields to return |
| `timezone` | string | e.g., `Europe/Helsinki` (default: UTC) |
| `maxlocations` | int | How many stations (search radius 50km) |

## Stored Queries Used by HCC

### 1. Current Observations

**Query:** `fmi::observations::weather::timevaluepair`

**Description:** Real-time weather observations from weather stations. Default: last 12 hours.

**Example:**
```
https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature
  &storedquery_id=fmi::observations::weather::timevaluepair
  &place=tampere
  &parameters=t2m,ws_10min,wg_10min,wd_10min,rh,r_1h,n_man,p_sea
  &timestep=10
  &maxlocations=1
```

**Available Parameters:**

| Parameter | Description | Unit | Notes |
|-----------|-------------|------|-------|
| `t2m` | Air temperature | °C | Reliable |
| `ws_10min` | Wind speed (10 min avg) | m/s | Reliable |
| `wg_10min` | Wind gust (10 min max) | m/s | Reliable |
| `wd_10min` | Wind direction | degrees | Reliable |
| `rh` | Relative humidity | % | Reliable |
| `r_1h` | Precipitation (1h) | mm | Often NaN from automated stations |
| `n_man` | Cloud cover (manual) | okta | Often NaN from automated stations |
| `p_sea` | Sea level pressure | hPa | Reliable |
| `vis` | Visibility | m | Often NaN from automated stations |
| `td` | Dew point | °C | |
| `snow_aws` | Snow depth | cm | |

**NaN handling:** Automated stations return `NaN` for `n_man`, `vis`, and sometimes `r_1h`. Parse these as missing/null.

---

### 2. Short-Range Forecast (Harmonie)

**Query:** `fmi::forecast::harmonie::surface::point::timevaluepair`

**Description:** High-resolution (~2.5km) regional model covering Scandinavia. Updated every 6 hours. **Default forecast: 50 hours ahead.**

**Example:**
```
https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature
  &storedquery_id=fmi::forecast::harmonie::surface::point::timevaluepair
  &place=tampere
  &parameters=Temperature,WindSpeedMS,WindGust,WindDirection,Precipitation1h,TotalCloudCover,Humidity,WeatherSymbol3
  &timestep=60
```

**Available Parameters:**

| Parameter | Description | Unit | Notes |
|-----------|-------------|------|-------|
| `Temperature` | Air temperature | °C | Always available |
| `WindSpeedMS` | Wind speed | m/s | Always available |
| `WindGust` | Wind gust | m/s | Always available |
| `WindDirection` | Wind direction | degrees | Always available |
| `Precipitation1h` | Precipitation per hour | mm | Always available |
| `TotalCloudCover` | Cloud cover | % (0-100) | Always available |
| `Humidity` | Relative humidity | % | Always available |
| `WeatherSymbol3` | Weather symbol code | int | Always available, see mapping below |
| `Pressure` | Sea level pressure | hPa | |
| `DewPoint` | Dew point | °C | |
| `GeopHeight` | Geopotential height | m | |

**Forecast range:** ~50 hours from current time. Valid data ends at that point — requesting beyond returns NaN.

---

### 3. Extended Forecast (ECMWF)

**Query:** `ecmwf::forecast::surface::point::timevaluepair`

**Description:** Global model from ECMWF. Lower resolution than Harmonie but extends further.

**Example:**
```
https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature
  &storedquery_id=ecmwf::forecast::surface::point::timevaluepair
  &place=tampere
  &parameters=Temperature,Precipitation1h,Humidity,WindUMS,WindVMS
  &timestep=180
```

**Parameters that return valid data:**

| Parameter | Description | Unit | Notes |
|-----------|-------------|------|-------|
| `Temperature` | Air temperature | °C | Works |
| `Pressure` | Pressure | hPa | Works |
| `Humidity` | Relative humidity | % | Works |
| `WindUMS` | U-component of wind | m/s | Works (east-west) |
| `WindVMS` | V-component of wind | m/s | Works (north-south) |
| `Precipitation1h` | Precipitation per hour | mm | Works |
| `DewPoint` | Dew point | °C | Sometimes NaN |

**Parameters that return NaN (do not use):**

| Parameter | Notes |
|-----------|-------|
| `WindSpeedMS` | Always NaN — compute from U/V instead |
| `WindDirection` | Always NaN — compute from U/V instead |
| `WindGust` | Always NaN |
| `MaximumWind` | Always NaN |
| `TotalCloudCover` | Always NaN |
| `WeatherSymbol3` | Always NaN |
| `LowCloudCover` | Always NaN |
| `GeopHeight` | Always NaN |

**Computing wind from U/V components:**
```
windSpeed = sqrt(u² + v²)
windDirection = (atan2(-u, -v) * 180 / π + 360) % 360
```

**Forecast range:** Tested to return ~33h from the available model run, but extends to several days when requesting future start times. The actual available range depends on the latest model run.

---

### 4. Edited Forecast (Scandinavia)

**Query:** `fmi::forecast::edited::weather::scandinavia::point::timevaluepair`

**Description:** Manually edited forecast by meteorologists. ~4 days, 3-hourly.

**Parameters that work:** `Temperature, Pressure, Humidity, WindDirection, WindSpeedMS, DewPoint, WindUMS`

**Parameters that are NaN:** `GeopHeight`

**Missing:** `Precipitation1h`, `TotalCloudCover`, `WeatherSymbol3`, `WindGust`

---

## Other Available Stored Queries

These are available but not currently used by HCC:

| Query | Description |
|-------|-------------|
| `fmi::forecast::harmonie::surface::grid` | Grid data in GRIB/NetCDF format |
| `fmi::forecast::harmonie::pressure::point::*` | Pressure level forecasts |
| `ecmwf::forecast::surface::grid` | ECMWF grid data |
| `ecmwf::forecast::pressure::grid` | ECMWF pressure levels |
| `fmi::forecast::enfuser::airquality::helsinki-metropolitan::grid` | Air quality (~20m resolution, Helsinki) |
| `fmi::ef::stations` | Station metadata |

Full list: `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=describeStoredQueries`

---

## WeatherSymbol3 Reference

FMI weather symbol codes used in Harmonie forecasts:

| Code | Finnish Description | English | Icon |
|------|-------------------|---------|------|
| 1 | Selkeä | Clear | Sun |
| 2 | Puolipilvinen | Partly cloudy | CloudSun |
| 3 | Pilvinen | Cloudy | Cloud |
| 21 | Heikkoja sadekuuroja | Light rain showers | CloudDrizzle |
| 22 | Sadekuuroja | Rain showers | CloudRain |
| 23 | Voimakkaita sadekuuroja | Heavy rain showers | CloudRain |
| 31 | Heikkoa vesisadetta | Light rain | CloudDrizzle |
| 32 | Vesisadetta | Rain | CloudRain |
| 33 | Voimakasta vesisadetta | Heavy rain | CloudRain |
| 41 | Heikkoja lumikuuroja | Light snow showers | CloudSnow |
| 42 | Lumikuuroja | Snow showers | CloudSnow |
| 43 | Voimakkaita lumikuuroja | Heavy snow showers | CloudSnow |
| 51 | Heikkoa lumisadetta | Light snowfall | CloudSnow |
| 52 | Lumisadetta | Snowfall | CloudSnow |
| 53 | Voimakasta lumisadetta | Heavy snowfall | Snowflake |
| 61 | Ukkoskuuroja | Thunderstorms | Zap |
| 62 | Voimakkaita ukkoskuuroja | Heavy thunderstorms | Zap |
| 63 | Ukkosta | Thunder | Zap |
| 64 | Voimakasta ukkosta | Heavy thunder | Zap |
| 71 | Heikkoa räntäsadetta | Light sleet | CloudRain |
| 72 | Räntäsadetta | Sleet | CloudRain |
| 73 | Voimakasta räntäsadetta | Heavy sleet | CloudRain |
| 81 | Heikkoja räntäkuuroja | Light sleet showers | CloudDrizzle |
| 82 | Räntäkuuroja | Sleet showers | CloudRain |
| 83 | Voimakkaita räntäkuuroja | Heavy sleet showers | CloudRain |
| 91 | Utua/sumua | Mist/haze | CloudFog |
| 92 | Sumua | Fog | CloudFog |

---

## XML Response Format

All timevaluepair queries return WFS XML with this structure:

```xml
<wfs:FeatureCollection>
  <wfs:member>
    <omso:PointTimeSeriesObservation>
      <om:phenomenonTime>
        <gml:TimePeriod>
          <gml:beginPosition>2026-04-19T12:00:00Z</gml:beginPosition>
          <gml:endPosition>2026-04-21T14:00:00Z</gml:endPosition>
        </gml:TimePeriod>
      </om:phenomenonTime>
      <om:featureOfInterest>
        <sams:SF_SpatialSamplingFeature>
          <sams:shape>
            <gml:Point>
              <gml:pos>61.49911 23.78712</gml:pos>
            </gml:Point>
          </sams:shape>
        </sams:SF_SpatialSamplingFeature>
      </om:featureOfInterest>
      <om:result>
        <wml2:MeasurementTimeseries gml:id="obs-obs-1-1-t2m">
          <wml2:point>
            <wml2:MeasurementTVP>
              <wml2:time>2026-04-19T12:00:00Z</wml2:time>
              <wml2:value>7.3</wml2:value>
            </wml2:MeasurementTVP>
          </wml2:point>
          <!-- more points... -->
        </wml2:MeasurementTimeseries>
      </om:result>
    </omso:PointTimeSeriesObservation>
  </wfs:member>
  <!-- one member per parameter -->
</wfs:FeatureCollection>
```

**Key parsing notes:**
- Each `<wfs:member>` contains one parameter's time series
- Parameter name is in `gml:id` attribute of `MeasurementTimeseries` (e.g., `obs-obs-1-1-t2m`, `mts-1-1-Temperature`)
- Values may be `NaN` (string) — treat as missing
- Timestamps are ISO 8601 in UTC
- Location is in `<gml:pos>lat lon</gml:pos>` (note: lat first, then lon)

---

## ECMWF Weather Symbol Inference

When ECMWF data has no `WeatherSymbol3`, infer from available data:

```
if precipitation > 2 mm/h:
  if temperature > 2°C → heavy rain (33)
  elif temperature <= 0°C → heavy snow (53)
  else → heavy sleet (73)
elif precipitation > 0:
  if temperature > 2°C → rain (32)
  elif temperature <= 0°C → snow (52)
  else → sleet (72)
elif humidity > 95 → fog (91)
elif humidity > 80 → cloudy (3)
elif humidity > 50 → partly cloudy (2)
else → clear (1)
```

## Wind Chill (Apparent Temperature)

For `temperature < 10°C` and `windSpeed > 0`:
```
windChill = 13.12 + 0.6215 * T - 11.37 * (W * 3.6)^0.16 + 0.3965 * T * (W * 3.6)^0.16
```
Where `T` is temperature in °C and `W` is wind speed in m/s (multiply by 3.6 for km/h input to formula).

For `temperature >= 10°C` or calm winds: `apparent = temperature`.
