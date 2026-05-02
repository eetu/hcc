use std::sync::Arc;
use std::time::Duration;

use serde::Serialize;
use tokio::sync::broadcast;
use utoipa::ToSchema;

use crate::AppState;

use super::discovery::get_bridge_address;

#[derive(Debug, Clone, Serialize, ToSchema)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HueLiveEvent {
    GroupedLight {
        id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        on: Option<bool>,
        #[serde(skip_serializing_if = "Option::is_none")]
        brightness: Option<f64>,
    },
    Temperature {
        id: String,
        temperature: f64,
    },
    DevicePower {
        #[serde(rename = "deviceId")]
        device_id: String,
        battery: u8,
    },
    Motion {
        #[serde(rename = "deviceId")]
        device_id: String,
        motion: bool,
        #[serde(rename = "updatedAt")]
        updated_at: String,
    },
    MotionEnabled {
        #[serde(rename = "deviceId")]
        device_id: String,
        enabled: bool,
    },
    Connectivity {
        #[serde(rename = "deviceId")]
        device_id: String,
        connected: bool,
    },
}

pub fn start_stream_loop(state: Arc<AppState>) {
    tokio::spawn(run_stream_loop(state));
}

async fn run_stream_loop(state: Arc<AppState>) {
    loop {
        if let Err(e) = stream_events(&state).await {
            tracing::error!("Hue event stream disconnected: {e:#}, reconnecting in 5s");
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn stream_events(state: &Arc<AppState>) -> Result<(), Box<dyn std::error::Error>> {
    if state.settings.hue_bridge_user.is_empty() {
        return Err("HUE_BRIDGE_USER not set, skipping event stream".into());
    }

    let address = get_bridge_address(state).await?;
    let url = format!("{address}/eventstream/clip/v2");

    let res = state
        .hue_client
        .get(&url)
        .header("hue-application-key", &state.settings.hue_bridge_user)
        .header("Accept", "text/event-stream")
        .send()
        .await?;

    if !res.status().is_success() {
        return Err(format!("Event stream responded {}", res.status()).into());
    }

    tracing::info!("Hue event stream connected");

    let mut buffer = String::new();

    use futures_util::StreamExt;
    let mut stream = res.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].to_string();
            buffer = buffer[newline_pos + 1..].to_string();

            if !line.starts_with("data:") {
                continue;
            }

            let json_str = line[5..].trim();
            let Ok(envelopes) = serde_json::from_str::<Vec<EventEnvelope>>(json_str) else {
                continue;
            };

            for envelope in envelopes {
                if envelope.r#type != "update" {
                    continue;
                }
                for resource in envelope.data {
                    for event in parse_resource_update(&resource) {
                        let _ = state.hue_events_tx.send(event);
                    }
                }
            }
        }
    }

    Ok(())
}

#[derive(serde::Deserialize)]
struct EventEnvelope {
    r#type: String,
    data: Vec<serde_json::Value>,
}

fn parse_resource_update(resource: &serde_json::Value) -> Vec<HueLiveEvent> {
    let Some(rtype) = resource.get("type").and_then(|v| v.as_str()) else {
        return Vec::new();
    };
    match rtype {
        "grouped_light" => {
            let Some(id) = resource.get("id").and_then(|v| v.as_str()) else {
                return Vec::new();
            };
            let on = resource
                .get("on")
                .and_then(|o| o.get("on"))
                .and_then(|o| o.as_bool());
            let brightness = resource
                .get("dimming")
                .and_then(|d| d.get("brightness"))
                .and_then(|b| b.as_f64());
            if on.is_none() && brightness.is_none() {
                return Vec::new();
            }
            vec![HueLiveEvent::GroupedLight {
                id: id.to_string(),
                on,
                brightness,
            }]
        }
        "temperature" => resource
            .get("temperature")
            .and_then(|temp_obj| {
                temp_obj
                    .get("temperature_report")
                    .and_then(|r| r.get("temperature"))
                    .or_else(|| temp_obj.get("temperature"))
                    .and_then(|t| t.as_f64())
            })
            .zip(resource.get("id").and_then(|v| v.as_str()))
            .map(|(temperature, id)| {
                vec![HueLiveEvent::Temperature {
                    id: id.to_string(),
                    temperature,
                }]
            })
            .unwrap_or_default(),
        "device_power" => resource
            .get("power_state")
            .and_then(|s| s.get("battery_level"))
            .and_then(|b| b.as_u64())
            .zip(
                resource
                    .get("owner")
                    .and_then(|o| o.get("rid"))
                    .and_then(|r| r.as_str()),
            )
            .map(|(battery, device_id)| {
                vec![HueLiveEvent::DevicePower {
                    device_id: device_id.to_string(),
                    battery: battery as u8,
                }]
            })
            .unwrap_or_default(),
        "motion" => {
            let Some(device_id) = resource
                .get("owner")
                .and_then(|o| o.get("rid"))
                .and_then(|r| r.as_str())
            else {
                return Vec::new();
            };
            let mut events = Vec::new();
            if let Some(enabled) = resource.get("enabled").and_then(|e| e.as_bool()) {
                events.push(HueLiveEvent::MotionEnabled {
                    device_id: device_id.to_string(),
                    enabled,
                });
            }
            if let Some(report) = resource.get("motion").and_then(|m| m.get("motion_report")) {
                if let (Some(motion), Some(updated_at)) = (
                    report.get("motion").and_then(|m| m.as_bool()),
                    report.get("changed").and_then(|c| c.as_str()),
                ) {
                    events.push(HueLiveEvent::Motion {
                        device_id: device_id.to_string(),
                        motion,
                        updated_at: updated_at.to_string(),
                    });
                }
            }
            events
        }
        "zigbee_connectivity" => resource
            .get("status")
            .and_then(|s| s.as_str())
            .zip(
                resource
                    .get("owner")
                    .and_then(|o| o.get("rid"))
                    .and_then(|r| r.as_str()),
            )
            .map(|(status, device_id)| {
                vec![HueLiveEvent::Connectivity {
                    device_id: device_id.to_string(),
                    connected: status == "connected",
                }]
            })
            .unwrap_or_default(),
        _ => Vec::new(),
    }
}

/// Convert broadcast receiver into an SSE-compatible stream
pub fn subscribe(tx: &broadcast::Sender<HueLiveEvent>) -> broadcast::Receiver<HueLiveEvent> {
    tx.subscribe()
}
