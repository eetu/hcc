# SolisCloud Platform API Reference

Version: V2.0.3  
Base URL: `https://www.soliscloud.com:13333`  
Credentials: stored as `SOLIS_KEY_ID` / `SOLIS_KEY_SECRET` secrets

---

## Authentication

Every request is a **POST** with these headers:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Content-MD5` | Base64(MD5(raw JSON body)) |
| `Date` | GMT string: `EEE, dd MMM yyyy HH:mm:ss 'GMT'` — day must be zero-padded (must be within ±15 min of server time) |
| `Authorization` | `API {keyId}:{sign}` |

**Sign formula:**
```
sign = Base64(HmacSHA1(keySecret,
  "POST\n"
  + Content-MD5 + "\n"
  + "application/json\n"
  + Date + "\n"
  + CanonicalizedResource   // e.g. "/v1/api/stationDetail"
))
```

**Response envelope:**
```json
{ "success": true, "code": "0", "msg": "success", "data": { ... } }
```
`code: "0"` = success. See Appendix 1 in the PDF for error codes.

**Rate limit:** 2 requests/sec for all endpoints.  
**Data refresh:** every 5 minutes.

---

## Recommended endpoints for dashboard

### Priority 1 — main view (compact PV summary)

#### `POST /v1/api/userStationList`
List all power stations. Call once on load to get station IDs.

Request:
```json
{ "pageNo": 1, "pageSize": 100 }
```

Key response fields per station record:
| Field | Description |
|---|---|
| `id` | Station ID (needed for subsequent calls) |
| `stationName` | Human-readable name |
| `power` / `powerStr` | Current output power (e.g. `5.2 kW`) |
| `dayEnergy` / `dayEnergyStr` | Today's generation (e.g. `12.4 kWh`) |
| `monthEnergy` / `yearEnergy` | Monthly / yearly generation |
| `allEnergy` / `allEnergyStr` | Lifetime generation |
| `capacity` / `capacityStr` | Installed capacity |
| `gridSellTodayEnergy` | Energy sold to grid today |
| `gridPurchasedTodayEnergy` | Energy bought from grid today |
| `batteryTodayChargeEnergy` | Battery charged today |
| `batteryTodayDischargeEnergy` | Battery discharged today |
| `homeLoadTodayEnergy` | Load consumption today |
| `synchronizationType` | Grid mode: 0=full export, 1=self-use, 2=off-grid |
| `stationTypeNew` | Plant type (see Appendix 2) |

---

#### `POST /v1/api/stationDetail`
Full real-time details for a single station. Best endpoint for the main view widget.

Request:
```json
{ "id": "<stationId>" }
```

Key response fields (superset of userStationList):
| Field | Description |
|---|---|
| `power` / `powerStr` | Current AC output power |
| `dayEnergy` / `dayEnergyStr` | Today's generation |
| `monthEnergy` / `yearEnergy` / `allEnergy` | Period totals |
| `psum` / `psumStr` | Total active power of grid |
| `batteryPercent` | Battery SOC % |
| `batteryPower` / `batteryPowerStr` | Battery power (+ = charging, - = discharging) |
| `gridPurchasedDayEnergy` | Grid import today |
| `gridSellDayEnergy` | Grid export today |
| `homeLoadTodayEnergy` | Home load today |
| `state` | Station status: 1=online, 2=offline, 3=alarm |
| `dataTimestamp` | Last data update (UTC+8 timestamp) |
| `sr` / `ss` | Sunrise / sunset times |
| `condTxtD` / `tmpMax` / `tmpMin` | Weather info (daytime) |
| `fullHour` | Peak sun hours today |
| `powerStationAvoidedCo2` | CO₂ avoided (for environmental display) |

---

### Priority 2 — detail tab

#### `POST /v1/api/inverterList`
List inverters under the account (or under a specific station).

Request:
```json
{ "pageNo": 1, "pageSize": 100, "stationId": "<stationId>" }
```

Key fields per inverter:
| Field | Description |
|---|---|
| `id` / `sn` | Inverter ID and serial number |
| `pac` / `pacStr` | Real-time AC output power |
| `etoday` / `etodayStr` | Daily generation |
| `etotal` / `etotalStr` | Total generation |
| `state` | 1=online, 2=offline, 3=alarm |
| `batteryCapacitySoc` | Battery SOC (if storage inverter) |
| `batteryPower` | Battery power |
| `gridPurchasedTodayEnergy` | Grid import today |
| `gridSellTodayEnergy` | Grid export today |
| `productModel` | `1`=grid-tie, `2`=storage |

---

#### `POST /v1/api/inverterDetail`
Full real-time detail for one inverter including per-string DC data.

Request:
```json
{ "id": "<inverterId>", "sn": "<inverterSN>" }
```

Key fields (all DC/AC per-channel data):
| Field | Description |
|---|---|
| `pac` / `pacStr` | Real-time AC output |
| `dcPac` / `dcPacStr` | Total DC input power |
| `uPv1`…`uPv4` / `iPv1`…`iPv4` | DC voltage/current per string |
| `pow1`…`pow4` | DC power per string (W) |
| `uAc1`…`uAc3` / `iAc1`…`iAc3` | AC voltage/current per phase |
| `fac` / `facStr` | Grid frequency (Hz) |
| `eToday` / `eMonth` / `eYear` / `eTotal` | Energy by period |
| `inverterTemperature` | Inverter temperature |
| `batteryCapacitySoc` | Battery SOC |
| `batteryPower` | Battery charge/discharge power |
| `batteryVoltage` / `bstteryCurrent` | Battery V and A |
| `batteryTodayChargeEnergy` / `batteryTodayDischargeEnergy` | Daily battery cycles |
| `gridPurchasedTodayEnergy` / `gridSellTodayEnergy` | Grid import/export today |
| `familyLoadPower` | Home load power |
| `homeLoadTodayEnergy` | Home load energy today |
| `powerFactor` | Power factor |
| `reactivePower` / `apparentPower` | Reactive / apparent power |
| `state` | 1=online, 2=offline, 3=alarm |
| `dataTimestamp` | Last update (UTC+8 timestamp) |

---

#### `POST /v1/api/stationDay`
5-minute interval data for a station on a given day. Use for power charts.

Request:
```json
{
  "id": "<stationId>",
  "money": "EUR",
  "time": "2026-04-21",
  "timeZone": 2
}
```

Returns array of records (one per 5-min interval):
| Field | Description |
|---|---|
| `time` | Timestamp (ms) |
| `timeStr` | Human time (e.g. `"14:25:00"`) |
| `power` / `powerStr` | Station output power at that time |
| `psum` | Grid power at that time |
| `batteryPower` | Battery power at that time |
| `familyLoadPower` | Load at that time |
| `produceEnergy` | Cumulative production |
| `consumeEnergy` | Cumulative consumption |

---

#### `POST /v1/api/stationMonth`
Daily aggregates for a single station in a given month. Use for bar/area charts.

Request:
```json
{
  "id": "<stationId>",
  "money": "EUR",
  "time": "2026-04",
  "timeZone": 2
}
```

---

## Suggested call sequence for dashboard

```
1. userStationList        → get stationId(s)
2. stationDetail          → main view widget (current power, today/month/year totals)
3. inverterList           → detail tab, list of inverters
4. inverterDetail         → detail tab, per-inverter drill-down (DC strings, temps)
5. stationDay             → power chart (today's generation curve, 5-min resolution)
6. stationMonth           → monthly bar chart in detail tab
```

Polling cadence: every 5 minutes (matches API data refresh rate).

---

## Main view widget — recommended fields

Compact display for the home screen:

```
PV Now:   pac / power          (e.g. "3.2 kW")
Today:    dayEnergy             (e.g. "12.4 kWh")
Grid:     psum                  (+ = exporting, - = importing)
Battery:  batteryPercent + batteryPower   (if storage system)
```

---

## Notes

- All numeric values come with a paired `*Str` unit field — always use it for display.
- `state` values: 1=online, 2=offline, 3=alarm (applies to both stations and inverters).
- DC string fields (`uPv1`–`uPv32`, `iPv1`–`iPv32`, `pow1`–`pow32`) vary by inverter model; check `dcInputType` (value+1 = actual channel count).
- `batteryPower` sign convention: positive = charging, negative = discharging (verify with your hardware).
- `dataTimestamp` is UTC+8; convert to local time for display.
- Date header must be within ±15 minutes of server time or the call fails.
