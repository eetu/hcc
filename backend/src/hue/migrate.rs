use std::collections::HashMap;
use std::sync::Arc;

use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::AppState;

use super::client::HueError;
use super::models::*;

// ---- Hub connection (talks to any bridge with explicit credentials) ----

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HubConnection {
    pub address: String,
    pub api_key: String,
    #[serde(default)]
    pub bridge_id: String,
}

impl HubConnection {
    fn url(&self, path: &str) -> String {
        let addr = if self.address.starts_with("http") {
            self.address.clone()
        } else {
            format!("https://{}", self.address)
        };
        format!("{addr}{path}")
    }

    async fn fetch<T: serde::de::DeserializeOwned>(
        &self,
        client: &reqwest::Client,
        path: &str,
    ) -> Result<HueList<T>, HueError> {
        let res = client
            .get(&self.url(path))
            .header("hue-application-key", &self.api_key)
            .send()
            .await?;
        if !res.status().is_success() {
            let status = res.status().as_u16();
            let body = res.text().await.unwrap_or_default();
            return Err(HueError::Bridge { status, body });
        }
        Ok(res.json().await?)
    }

    async fn put(
        &self,
        client: &reqwest::Client,
        path: &str,
        body: &serde_json::Value,
    ) -> Result<(), HueError> {
        let res = client
            .put(&self.url(path))
            .header("hue-application-key", &self.api_key)
            .json(body)
            .send()
            .await?;
        if !res.status().is_success() {
            let status = res.status().as_u16();
            let body = res.text().await.unwrap_or_default();
            return Err(HueError::Bridge { status, body });
        }
        Ok(())
    }

    async fn post(
        &self,
        client: &reqwest::Client,
        path: &str,
        body: &serde_json::Value,
    ) -> Result<serde_json::Value, HueError> {
        let res = client
            .post(&self.url(path))
            .header("hue-application-key", &self.api_key)
            .json(body)
            .send()
            .await?;
        if !res.status().is_success() {
            let status = res.status().as_u16();
            let body = res.text().await.unwrap_or_default();
            return Err(HueError::Bridge { status, body });
        }
        Ok(res.json().await?)
    }

    async fn delete(
        &self,
        client: &reqwest::Client,
        path: &str,
    ) -> Result<(), HueError> {
        let res = client
            .delete(&self.url(path))
            .header("hue-application-key", &self.api_key)
            .send()
            .await?;
        if !res.status().is_success() {
            let status = res.status().as_u16();
            let body = res.text().await.unwrap_or_default();
            return Err(HueError::Bridge { status, body });
        }
        Ok(())
    }
}

// ---- Snapshot models ----

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationSnapshot {
    pub exported_at: String,
    pub rooms: Vec<SnapshotRoom>,
    pub devices: Vec<SnapshotDevice>,
    pub zones: Vec<SnapshotZone>,
    pub scenes: Vec<SnapshotScene>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotRoom {
    pub id: String,
    pub name: String,
    pub archetype: Option<String>,
    pub device_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotDevice {
    pub id: String,
    pub name: String,
    pub product_name: Option<String>,
    pub model_id: Option<String>,
    pub room_id: Option<String>,
    pub service_types: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotZone {
    pub id: String,
    pub name: String,
    pub device_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotScene {
    pub id: String,
    pub name: String,
    pub room_id: String,
    pub actions: serde_json::Value,
}

// ---- Session state ----

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationSession {
    pub old_hub: HubConnection,
    pub new_hub: HubConnection,
    pub snapshot: Option<MigrationSnapshot>,
    pub assignments: HashMap<String, String>,   // old_device_id -> new_device_id
    pub rooms_created: HashMap<String, String>, // old_room_id -> new_room_id
}

// ---- API types ----

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportSummary {
    rooms: usize,
    devices: usize,
    zones: usize,
    scenes: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NewHubDevice {
    id: String,
    name: String,
    product_name: Option<String>,
    model_id: Option<String>,
    service_types: Vec<String>,
    light_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignRequest {
    pub old_device_id: String,
    pub new_device_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnassignRequest {
    pub old_device_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveDeviceRequest {
    pub old_device_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MigrationStatus {
    connected: bool,
    has_snapshot: bool,
    device_count: usize,
    assigned_count: usize,
    assignments: HashMap<String, String>,
    rooms_created: HashMap<String, String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RoomCreated {
    old_name: String,
    old_id: String,
    new_id: String,
}

// ---- Discovery ----

#[derive(Debug, Deserialize)]
struct BridgeDiscoveryEntry {
    id: Option<String>,
    internalipaddress: Option<String>,
    port: Option<u16>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredBridge {
    id: String,
    address: String,
    port: u16,
}

/// GET /api/migrate/discover - Discover Hue bridges on the network
pub async fn discover(state: web::Data<Arc<AppState>>) -> HttpResponse {
    // Return cached result if fresh
    if let Some(cached) = state.discovery_cache.get().await {
        return HttpResponse::Ok().json(serde_json::json!({"bridges": cached}));
    }

    let entries: Vec<BridgeDiscoveryEntry> = match state
        .http_client
        .get("https://discovery.meethue.com/")
        .send()
        .await
    {
        Ok(res) => {
            if res.status() == 429 {
                // Return stale cache on rate limit
                if let Some(stale) = state.discovery_cache.get_stale().await {
                    return HttpResponse::Ok().json(serde_json::json!({"bridges": stale}));
                }
                let retry = res.headers().get("retry-after")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("unknown");
                return HttpResponse::TooManyRequests()
                    .json(serde_json::json!({"error": format!("Discovery rate limited. Retry after {retry}s")}));
            }
            if !res.status().is_success() {
                let status = res.status().as_u16();
                return HttpResponse::BadGateway()
                    .json(serde_json::json!({"error": format!("Discovery returned HTTP {status}")}));
            }
            match res.json().await {
                Ok(b) => b,
                Err(e) => {
                    return HttpResponse::BadGateway()
                        .json(serde_json::json!({"error": format!("Failed to parse discovery response: {e}")}));
                }
            }
        },
        Err(e) => {
            return HttpResponse::BadGateway()
                .json(serde_json::json!({"error": format!("Discovery request failed: {e}")}));
        }
    };

    let bridges: Vec<DiscoveredBridge> = entries
        .into_iter()
        .filter_map(|b| {
            Some(DiscoveredBridge {
                id: b.id.unwrap_or_default(),
                address: b.internalipaddress?,
                port: b.port.unwrap_or(443),
            })
        })
        .collect();

    tracing::info!("Discovered {} bridge(s)", bridges.len());
    state.discovery_cache.set(bridges.clone()).await;
    HttpResponse::Ok().json(serde_json::json!({"bridges": bridges}))
}

// ---- Connect ----

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectRequest {
    pub old_hub: HubConnectionInput,
    pub new_hub: HubConnectionInput,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HubConnectionInput {
    pub address: String,
    pub api_key: String,
}

/// POST /api/migrate/connect - Connect to both hubs
pub async fn connect(
    state: web::Data<Arc<AppState>>,
    body: web::Json<ConnectRequest>,
) -> HttpResponse {
    let req = body.into_inner();
    let client = &state.hue_client;

    let old_hub = HubConnection {
        address: req.old_hub.address,
        api_key: req.old_hub.api_key,
        bridge_id: String::new(),
    };
    let new_hub = HubConnection {
        address: req.new_hub.address,
        api_key: req.new_hub.api_key,
        bridge_id: String::new(),
    };

    // Verify both connections by fetching bridge info
    let (old_bridge, new_bridge) = tokio::join!(
        old_hub.fetch::<serde_json::Value>(client, "/clip/v2/resource/bridge"),
        new_hub.fetch::<serde_json::Value>(client, "/clip/v2/resource/bridge"),
    );

    let old_bridge_id = match old_bridge {
        Ok(b) => b.data.first()
            .and_then(|v| v.get("bridge_id"))
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string(),
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": format!("Failed to connect to old hub: {e}")}));
        }
    };

    let new_bridge_id = match new_bridge {
        Ok(b) => b.data.first()
            .and_then(|v| v.get("bridge_id"))
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string(),
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": format!("Failed to connect to new hub: {e}")}));
        }
    };

    tracing::info!("Connected to old hub ({old_bridge_id}) and new hub ({new_bridge_id})");

    let session = MigrationSession {
        old_hub: HubConnection { bridge_id: old_bridge_id.clone(), ..old_hub },
        new_hub: HubConnection { bridge_id: new_bridge_id.clone(), ..new_hub },
        snapshot: None,
        assignments: HashMap::new(),
        rooms_created: HashMap::new(),
    };

    *state.migration.write().await = Some(session);

    HttpResponse::Ok().json(serde_json::json!({
        "connected": true,
        "oldBridgeId": old_bridge_id,
        "newBridgeId": new_bridge_id,
    }))
}

// ---- Export ----

/// GET /api/migrate/export - Export old hub config to JSON
pub async fn export(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let (hub, client) = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => (s.old_hub.clone(), state.hue_client.clone()),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected. Call /connect first."}));
            }
        }
    };

    let snapshot = match build_snapshot(&hub, &client).await {
        Ok(s) => s,
        Err(e) => {
            tracing::error!("Failed to export hub: {e}");
            return HttpResponse::BadGateway()
                .json(serde_json::json!({"error": e.to_string()}));
        }
    };

    let summary = ExportSummary {
        rooms: snapshot.rooms.len(),
        devices: snapshot.devices.len(),
        zones: snapshot.zones.len(),
        scenes: snapshot.scenes.len(),
    };
    tracing::info!(
        "Exported hub snapshot: {} rooms, {} devices, {} zones, {} scenes",
        summary.rooms, summary.devices, summary.zones, summary.scenes
    );

    // Store snapshot in session
    state.migration.write().await.as_mut().unwrap().snapshot = Some(snapshot.clone());

    HttpResponse::Ok()
        .insert_header(("Content-Disposition", "attachment; filename=\"hue-hub-snapshot.json\""))
        .json(&snapshot)
}

/// POST /api/migrate/import - Upload snapshot JSON (alternative to export)
pub async fn import(
    state: web::Data<Arc<AppState>>,
    body: web::Json<MigrationSnapshot>,
) -> HttpResponse {
    let snapshot = body.into_inner();
    let summary = ExportSummary {
        rooms: snapshot.rooms.len(),
        devices: snapshot.devices.len(),
        zones: snapshot.zones.len(),
        scenes: snapshot.scenes.len(),
    };

    let mut guard = state.migration.write().await;
    match guard.as_mut() {
        Some(session) => {
            session.snapshot = Some(snapshot);
        }
        None => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Not connected. Call /connect first."}));
        }
    }

    tracing::info!(
        "Imported snapshot: {} rooms, {} devices, {} zones, {} scenes",
        summary.rooms, summary.devices, summary.zones, summary.scenes
    );

    HttpResponse::Ok().json(summary)
}

/// GET /api/migrate/snapshot - Return current snapshot
pub async fn get_snapshot(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let guard = state.migration.read().await;
    match guard.as_ref().and_then(|s| s.snapshot.as_ref()) {
        Some(snapshot) => HttpResponse::Ok().json(snapshot),
        None => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "No snapshot loaded"})),
    }
}

// ---- Room creation (on new hub) ----

/// POST /api/migrate/create-rooms - Create rooms on new hub from snapshot
pub async fn create_rooms(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let (hub, snapshot) = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => match s.snapshot.as_ref() {
                Some(snap) => (s.new_hub.clone(), snap.clone()),
                None => {
                    return HttpResponse::BadRequest()
                        .json(serde_json::json!({"error": "No snapshot loaded"}));
                }
            },
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        }
    };

    let client = &state.hue_client;
    let mut created = Vec::new();

    for room in &snapshot.rooms {
        let body = serde_json::json!({
            "metadata": {
                "name": room.name,
                "archetype": room.archetype.as_deref().unwrap_or("other"),
            },
            "children": [],
        });

        match hub.post(client, "/clip/v2/resource/room", &body).await {
            Ok(response) => {
                let new_id = response
                    .get("data")
                    .and_then(|d| d.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|item| item.get("rid"))
                    .and_then(|id| id.as_str())
                    .unwrap_or_default()
                    .to_string();

                if !new_id.is_empty() {
                    tracing::info!("Created room '{}': {} -> {}", room.name, room.id, new_id);
                    created.push(RoomCreated {
                        old_name: room.name.clone(),
                        old_id: room.id.clone(),
                        new_id: new_id.clone(),
                    });

                    state.migration.write().await.as_mut().unwrap()
                        .rooms_created.insert(room.id.clone(), new_id);
                }
            }
            Err(e) => {
                tracing::error!("Failed to create room '{}': {e}", room.name);
            }
        }
    }

    HttpResponse::Ok().json(created)
}

// ---- Device operations (new hub) ----

/// GET /api/migrate/devices - List devices on new hub
pub async fn list_devices(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let hub = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => s.new_hub.clone(),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        }
    };

    let devices = match hub.fetch::<DeviceResource>(&state.hue_client, "/clip/v2/resource/device").await {
        Ok(d) => d,
        Err(e) => {
            return HttpResponse::BadGateway()
                .json(serde_json::json!({"error": e.to_string()}));
        }
    };

    let result: Vec<NewHubDevice> = devices.data.into_iter().map(|d| {
        let light_id = d.services.iter()
            .find(|s| s.rtype == "light")
            .map(|s| s.rid.clone());
        let service_types: Vec<String> = d.services.iter()
            .map(|s| s.rtype.clone())
            .collect();
        NewHubDevice {
            id: d.id,
            name: d.metadata.name,
            product_name: d.product_data.as_ref().and_then(|p| p.product_name.clone()),
            model_id: d.product_data.as_ref().and_then(|p| p.model_id.clone()),
            service_types,
            light_id,
        }
    }).collect();

    HttpResponse::Ok().json(result)
}

/// POST /api/migrate/identify/{device_id} - Flash a device on new hub
pub async fn identify(
    state: web::Data<Arc<AppState>>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    let hub = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => s.new_hub.clone(),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        }
    };

    let client = &state.hue_client;
    let identify_body = serde_json::json!({"identify": {"action": "identify"}});

    // Try to find the device's light service first
    if let Ok(devices) = hub.fetch::<DeviceResource>(client, &format!("/clip/v2/resource/device/{device_id}")).await {
        if let Some(device) = devices.data.first() {
            if let Some(light_ref) = device.services.iter().find(|s| s.rtype == "light") {
                if hub.put(client, &format!("/clip/v2/resource/light/{}", light_ref.rid), &identify_body).await.is_ok() {
                    return HttpResponse::Ok().json(serde_json::json!({"identified": true}));
                }
            }
        }
    }

    // Fallback: identify on device resource directly
    match hub.put(client, &format!("/clip/v2/resource/device/{device_id}"), &identify_body).await {
        Ok(()) => HttpResponse::Ok().json(serde_json::json!({"identified": true})),
        Err(e) => HttpResponse::BadGateway()
            .json(serde_json::json!({"error": e.to_string()})),
    }
}

// ---- Move device (delete from old + search on new) ----

/// POST /api/migrate/move-device - Delete device from old hub and start search on new hub
pub async fn move_device(
    state: web::Data<Arc<AppState>>,
    body: web::Json<MoveDeviceRequest>,
) -> HttpResponse {
    let (old_hub, new_hub) = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => (s.old_hub.clone(), s.new_hub.clone()),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        }
    };

    let client = &state.hue_client;

    // Delete device from old hub
    if let Err(e) = old_hub.delete(client, &format!("/clip/v2/resource/device/{}", body.old_device_id)).await {
        tracing::error!("Failed to delete device {} from old hub: {e}", body.old_device_id);
        return HttpResponse::BadGateway()
            .json(serde_json::json!({"error": format!("Failed to remove device from old hub: {e}")}));
    }

    tracing::info!("Deleted device {} from old hub", body.old_device_id);

    // Start zigbee device search on new hub
    let search_started = start_zigbee_search(&new_hub, client).await;

    HttpResponse::Ok().json(serde_json::json!({
        "deleted": true,
        "searchStarted": search_started,
    }))
}

/// POST /api/migrate/search - Start zigbee device search on new hub
pub async fn search(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let hub = {
        let guard = state.migration.read().await;
        match guard.as_ref() {
            Some(s) => s.new_hub.clone(),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        }
    };

    let started = start_zigbee_search(&hub, &state.hue_client).await;
    HttpResponse::Ok().json(serde_json::json!({"searchStarted": started}))
}

async fn start_zigbee_search(hub: &HubConnection, client: &reqwest::Client) -> bool {
    // Get the zigbee_device_discovery resource ID
    let discovery_res = hub.fetch::<serde_json::Value>(
        client,
        "/clip/v2/resource/zigbee_device_discovery",
    ).await;

    let discovery_id = match discovery_res {
        Ok(list) => list.data.first()
            .and_then(|v| v.get("id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        Err(e) => {
            tracing::error!("Failed to get zigbee_device_discovery: {e}");
            return false;
        }
    };

    let Some(id) = discovery_id else {
        tracing::error!("No zigbee_device_discovery resource found");
        return false;
    };

    let search_body = serde_json::json!({
        "action": {"action_type": "search"}
    });

    match hub.put(client, &format!("/clip/v2/resource/zigbee_device_discovery/{id}"), &search_body).await {
        Ok(()) => {
            tracing::info!("Started zigbee device search on new hub");
            true
        }
        Err(e) => {
            tracing::error!("Failed to start zigbee search: {e}");
            false
        }
    }
}

// ---- Assign ----

/// POST /api/migrate/assign - Assign new device to old identity (rename + move to room)
pub async fn assign(
    state: web::Data<Arc<AppState>>,
    body: web::Json<AssignRequest>,
) -> HttpResponse {
    let req = body.into_inner();

    let (hub, old_device, new_room_id) = {
        let mut guard = state.migration.write().await;
        let session = match guard.as_mut() {
            Some(s) => s,
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Not connected"}));
            }
        };

        let snapshot = match session.snapshot.as_ref() {
            Some(s) => s,
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "No snapshot loaded"}));
            }
        };

        let old_device = match snapshot.devices.iter().find(|d| d.id == req.old_device_id) {
            Some(d) => d.clone(),
            None => {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": "Old device not found in snapshot"}));
            }
        };

        let new_room_id = old_device.room_id.as_ref()
            .and_then(|old_room_id| session.rooms_created.get(old_room_id))
            .cloned();

        session.assignments.insert(req.old_device_id.clone(), req.new_device_id.clone());

        (session.new_hub.clone(), old_device, new_room_id)
    };

    let client = &state.hue_client;

    // Rename device on new hub
    let rename_body = serde_json::json!({"metadata": {"name": old_device.name}});
    if let Err(e) = hub.put(client, &format!("/clip/v2/resource/device/{}", req.new_device_id), &rename_body).await {
        tracing::error!("Failed to rename device: {e}");
        return HttpResponse::BadGateway()
            .json(serde_json::json!({"error": format!("Rename failed: {e}")}));
    }

    tracing::info!("Renamed device {} to '{}'", req.new_device_id, old_device.name);

    // Move to room if applicable
    if let Some(room_id) = &new_room_id {
        if let Ok(room_list) = hub.fetch::<RoomResource>(client, &format!("/clip/v2/resource/room/{room_id}")).await {
            if let Some(room) = room_list.data.first() {
                let mut children: Vec<serde_json::Value> = room.children.iter()
                    .map(|c| serde_json::json!({"rid": c.rid, "rtype": c.rtype}))
                    .collect();
                children.push(serde_json::json!({"rid": req.new_device_id, "rtype": "device"}));

                let room_body = serde_json::json!({"children": children});
                if let Err(e) = hub.put(client, &format!("/clip/v2/resource/room/{room_id}"), &room_body).await {
                    tracing::error!("Failed to move device to room: {e}");
                } else {
                    tracing::info!("Moved device {} to room {}", req.new_device_id, room_id);
                }
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "assigned": true,
        "deviceName": old_device.name,
        "movedToRoom": new_room_id.is_some(),
    }))
}

/// POST /api/migrate/unassign - Undo an assignment
pub async fn unassign(
    state: web::Data<Arc<AppState>>,
    body: web::Json<UnassignRequest>,
) -> HttpResponse {
    let mut guard = state.migration.write().await;
    let session = match guard.as_mut() {
        Some(s) => s,
        None => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Not connected"}));
        }
    };

    let removed = session.assignments.remove(&body.old_device_id);
    HttpResponse::Ok().json(serde_json::json!({"unassigned": removed.is_some()}))
}

/// GET /api/migrate/status - Migration session summary
pub async fn status(state: web::Data<Arc<AppState>>) -> HttpResponse {
    let guard = state.migration.read().await;
    match guard.as_ref() {
        Some(session) => {
            let device_count = session.snapshot.as_ref().map(|s| s.devices.len()).unwrap_or(0);
            HttpResponse::Ok().json(MigrationStatus {
                connected: true,
                has_snapshot: session.snapshot.is_some(),
                device_count,
                assigned_count: session.assignments.len(),
                assignments: session.assignments.clone(),
                rooms_created: session.rooms_created.clone(),
            })
        }
        None => HttpResponse::Ok().json(MigrationStatus {
            connected: false,
            has_snapshot: false,
            device_count: 0,
            assigned_count: 0,
            assignments: HashMap::new(),
            rooms_created: HashMap::new(),
        }),
    }
}

// ---- Internal helpers ----

async fn build_snapshot(hub: &HubConnection, client: &reqwest::Client) -> Result<MigrationSnapshot, HueError> {
    let (rooms, devices, zones, scenes) = tokio::try_join!(
        hub.fetch::<RoomResource>(client, "/clip/v2/resource/room"),
        hub.fetch::<DeviceResource>(client, "/clip/v2/resource/device"),
        hub.fetch::<ZoneResource>(client, "/clip/v2/resource/zone"),
        hub.fetch::<SceneResource>(client, "/clip/v2/resource/scene"),
    )?;

    let device_room: HashMap<&str, &str> = rooms.data.iter()
        .flat_map(|room| {
            room.children.iter()
                .filter(|c| c.rtype == "device")
                .map(move |c| (c.rid.as_str(), room.id.as_str()))
        })
        .collect();

    let snapshot_rooms: Vec<SnapshotRoom> = rooms.data.iter().map(|r| {
        SnapshotRoom {
            id: r.id.clone(),
            name: r.metadata.name.clone(),
            archetype: r.metadata.archetype.clone(),
            device_ids: r.children.iter()
                .filter(|c| c.rtype == "device")
                .map(|c| c.rid.clone())
                .collect(),
        }
    }).collect();

    let snapshot_devices: Vec<SnapshotDevice> = devices.data.iter().map(|d| {
        SnapshotDevice {
            id: d.id.clone(),
            name: d.metadata.name.clone(),
            product_name: d.product_data.as_ref().and_then(|p| p.product_name.clone()),
            model_id: d.product_data.as_ref().and_then(|p| p.model_id.clone()),
            room_id: device_room.get(d.id.as_str()).map(|s| s.to_string()),
            service_types: d.services.iter().map(|s| s.rtype.clone()).collect(),
        }
    }).collect();

    let snapshot_zones: Vec<SnapshotZone> = zones.data.iter().map(|z| {
        SnapshotZone {
            id: z.id.clone(),
            name: z.metadata.name.clone(),
            device_ids: z.children.iter()
                .filter(|c| c.rtype == "device")
                .map(|c| c.rid.clone())
                .collect(),
        }
    }).collect();

    let snapshot_scenes: Vec<SnapshotScene> = scenes.data.iter().map(|s| {
        SnapshotScene {
            id: s.id.clone(),
            name: s.metadata.name.clone(),
            room_id: s.group.rid.clone(),
            actions: s.actions.clone(),
        }
    }).collect();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();

    Ok(MigrationSnapshot {
        exported_at: now,
        rooms: snapshot_rooms,
        devices: snapshot_devices,
        zones: snapshot_zones,
        scenes: snapshot_scenes,
    })
}
