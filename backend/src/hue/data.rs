use std::collections::HashMap;
use std::sync::Arc;

use crate::AppState;

use super::client::{hue_fetch, HueError};
use super::models::*;

pub async fn fetch_hue_data(state: &Arc<AppState>) -> Result<HueResponse, HueError> {
    // Check cache first
    if let Some(cached) = state.hue_cache.get("hue").await {
        tracing::debug!("Returning cached Hue data");
        return Ok(cached);
    }

    let data = fetch_from_bridge(state).await?;
    state.hue_cache.set("hue".into(), data.clone()).await;
    Ok(data)
}

async fn fetch_from_bridge(state: &Arc<AppState>) -> Result<HueResponse, HueError> {
    let room_type_map = build_room_type_map(&state.settings.hue_room_types);

    // 7 parallel fetches
    let (rooms, temps, grouped_lights, device_powers, devices, motions, connectivity) = tokio::try_join!(
        hue_fetch::<RoomResource>(state, "/clip/v2/resource/room"),
        hue_fetch::<TemperatureResource>(state, "/clip/v2/resource/temperature"),
        hue_fetch::<GroupedLightResource>(state, "/clip/v2/resource/grouped_light"),
        hue_fetch::<DevicePowerResource>(state, "/clip/v2/resource/device_power"),
        hue_fetch::<DeviceResource>(state, "/clip/v2/resource/device"),
        hue_fetch::<MotionResource>(state, "/clip/v2/resource/motion"),
        hue_fetch::<ZigbeeConnectivityResource>(state, "/clip/v2/resource/zigbee_connectivity"),
    )?;

    // device ID → battery level
    let battery_by_device: HashMap<&str, u8> = device_powers
        .data
        .iter()
        .filter_map(|dp| dp.power_state.battery_level.map(|b| (dp.owner.rid.as_str(), b)))
        .collect();

    // device ID → room
    let room_by_device: HashMap<&str, &RoomResource> = rooms
        .data
        .iter()
        .flat_map(|room| {
            room.children
                .iter()
                .filter(|c| c.rtype == "device")
                .map(move |c| (c.rid.as_str(), room))
        })
        .collect();

    // device ID → name
    let device_name_by_id: HashMap<&str, &str> = devices
        .data
        .iter()
        .map(|d| (d.id.as_str(), d.metadata.name.as_str()))
        .collect();

    // device ID → motion data
    let motion_by_device: HashMap<&str, (bool, Option<&str>)> = motions
        .data
        .iter()
        .map(|m| {
            let (motion, updated_at) = match &m.motion.motion_report {
                Some(report) => (report.motion, Some(report.changed.as_str())),
                None => (m.motion.motion, None),
            };
            (m.owner.rid.as_str(), (motion, updated_at))
        })
        .collect();

    // device ID → connected
    let connected_by_device: HashMap<&str, bool> = connectivity
        .data
        .iter()
        .map(|c| (c.owner.rid.as_str(), c.status == "connected"))
        .collect();

    // Build sensors from temperature resources
    let sensors: Vec<Sensor> = temps
        .data
        .iter()
        .map(|temp| {
            let room = room_by_device.get(temp.owner.rid.as_str()).copied();
            let room_name = room.map(|r| r.metadata.name.as_str());
            let name = device_name_by_id
                .get(temp.owner.rid.as_str())
                .copied()
                .or(room_name)
                .unwrap_or(&temp.id)
                .to_string();

            let room_type = room_name
                .and_then(|n| {
                    let result = room_type_map.get(n);
                    if result.is_none() {
                        tracing::debug!("Room name '{n}' not found in room type map");
                    }
                    result
                })
                .cloned()
                .unwrap_or(RoomType::Inside);

            let temperature = temp
                .temperature
                .temperature_report
                .as_ref()
                .map(|r| r.temperature)
                .unwrap_or(temp.temperature.temperature);

            let battery = battery_by_device
                .get(temp.owner.rid.as_str())
                .copied();

            let motion_data = motion_by_device.get(temp.owner.rid.as_str());

            Sensor {
                id: temp.id.clone(),
                device_id: temp.owner.rid.clone(),
                name,
                temperature: Some(temperature),
                room_type,
                enabled: temp.enabled,
                battery,
                motion: motion_data.map(|(m, _)| *m),
                motion_updated_at: motion_data.and_then(|(_, u)| u.map(String::from)),
                connected: connected_by_device
                    .get(temp.owner.rid.as_str())
                    .copied()
                    .unwrap_or(true),
            }
        })
        .collect();

    // Build groups from grouped lights that belong to rooms
    let room_by_id: HashMap<&str, &RoomResource> =
        rooms.data.iter().map(|r| (r.id.as_str(), r)).collect();

    let groups: Vec<Group> = grouped_lights
        .data
        .iter()
        .filter(|gl| gl.owner.rtype == "room")
        .map(|gl| Group {
            id: gl.id.clone(),
            name: room_by_id
                .get(gl.owner.rid.as_str())
                .map(|r| r.metadata.name.clone())
                .unwrap_or_else(|| gl.id.clone()),
            state: GroupState { on: gl.on.on },
        })
        .collect();

    Ok(HueResponse { sensors, groups })
}

fn build_room_type_map(json_str: &str) -> HashMap<String, RoomType> {
    let mut map = HashMap::new();
    tracing::debug!("Raw HUE_ROOM_TYPES value: '{json_str}'");
    let Ok(config) = serde_json::from_str::<HashMap<String, Vec<String>>>(json_str) else {
        tracing::warn!("Failed to parse HUE_ROOM_TYPES: {json_str}");
        return map;
    };
    tracing::debug!("Room type map parsed: {config:?}");
    for (type_str, rooms) in config {
        let room_type = match type_str.as_str() {
            "inside" => RoomType::Inside,
            "inside_cold" => RoomType::InsideCold,
            "outside" => RoomType::Outside,
            _ => continue,
        };
        for room in rooms {
            map.insert(room, room_type.clone());
        }
    }
    map
}
