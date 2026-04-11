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
        on: bool,
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
            tracing::error!("Hue event stream disconnected: {e}, reconnecting in 5s");
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn stream_events(state: &Arc<AppState>) -> Result<(), Box<dyn std::error::Error>> {
    if state.settings.hue_bridge_user.is_empty() {
        return Err("HUE_BRIDGE_USER not set, skipping event stream".into());
    }

    let address = get_bridge_address(state).await?;
    let url = format!("https://{address}/eventstream/clip/v2");

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
                    if let Some(event) = parse_resource_update(&resource) {
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

fn parse_resource_update(resource: &serde_json::Value) -> Option<HueLiveEvent> {
    let rtype = resource.get("type")?.as_str()?;
    match rtype {
        "grouped_light" => {
            let on = resource.get("on")?.get("on")?.as_bool()?;
            let id = resource.get("id")?.as_str()?.to_string();
            Some(HueLiveEvent::GroupedLight { id, on })
        }
        "temperature" => {
            let temp_obj = resource.get("temperature")?;
            let temperature = temp_obj
                .get("temperature_report")
                .and_then(|r| r.get("temperature"))
                .or_else(|| temp_obj.get("temperature"))?
                .as_f64()?;
            let id = resource.get("id")?.as_str()?.to_string();
            Some(HueLiveEvent::Temperature { id, temperature })
        }
        "device_power" => {
            let battery = resource
                .get("power_state")?
                .get("battery_level")?
                .as_u64()? as u8;
            let device_id = resource.get("owner")?.get("rid")?.as_str()?.to_string();
            Some(HueLiveEvent::DevicePower { device_id, battery })
        }
        "motion" => {
            let report = resource.get("motion")?.get("motion_report")?;
            let motion = report.get("motion")?.as_bool()?;
            let updated_at = report.get("changed")?.as_str()?.to_string();
            let device_id = resource.get("owner")?.get("rid")?.as_str()?.to_string();
            Some(HueLiveEvent::Motion {
                device_id,
                motion,
                updated_at,
            })
        }
        "zigbee_connectivity" => {
            let status = resource.get("status")?.as_str()?;
            let device_id = resource.get("owner")?.get("rid")?.as_str()?.to_string();
            Some(HueLiveEvent::Connectivity {
                device_id,
                connected: status == "connected",
            })
        }
        _ => None,
    }
}

/// Convert broadcast receiver into an SSE-compatible stream
pub fn subscribe(tx: &broadcast::Sender<HueLiveEvent>) -> broadcast::Receiver<HueLiveEvent> {
    tx.subscribe()
}
