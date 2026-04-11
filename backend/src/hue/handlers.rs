use std::sync::Arc;

use actix_web::{web, HttpResponse};
use actix_web_lab::sse;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio_stream::wrappers::BroadcastStream;
use utoipa::ToSchema;

use crate::AppState;

use super::client::{hue_fetch, hue_put};
use super::data::fetch_hue_data;
use super::events::subscribe;
use super::models::GroupedLightResource;

// ---- GET /api/hue ----

#[utoipa::path(
    get,
    path = "/api/hue",
    responses(
        (status = 200, description = "Hue sensors and light groups", body = super::models::HueResponse),
        (status = 502, description = "Failed to fetch Hue data")
    )
)]
pub async fn get_data(state: web::Data<Arc<AppState>>) -> HttpResponse {
    match fetch_hue_data(&state).await {
        Ok(data) => HttpResponse::Ok().json(data),
        Err(e) => {
            tracing::error!("Failed to fetch Hue data: {e}");
            HttpResponse::BadGateway().json(serde_json::json!({"error": e.to_string()}))
        }
    }
}

// ---- GET /api/hue/events (SSE) ----

#[utoipa::path(
    get,
    path = "/api/hue/events",
    responses(
        (status = 200, description = "Server-sent events stream of Hue device changes")
    )
)]
pub async fn events_sse(state: web::Data<Arc<AppState>>) -> sse::Sse<impl futures_util::Stream<Item = Result<sse::Event, std::convert::Infallible>>> {
    let rx = subscribe(&state.hue_events_tx);
    let stream = BroadcastStream::new(rx).filter_map(|result| async move {
        match result {
            Ok(event) => {
                let json = serde_json::to_string(&event).ok()?;
                Some(Ok::<_, std::convert::Infallible>(sse::Event::Data(sse::Data::new(json))))
            }
            Err(_) => None,
        }
    });

    sse::Sse::from_stream(stream).with_keep_alive(std::time::Duration::from_secs(30))
}

// ---- POST /api/hue/pair ----

#[derive(Debug, Deserialize, ToSchema)]
pub struct PairRequest {
    #[serde(rename = "bridgeIp")]
    pub bridge_ip: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PairResponse {
    pub message: String,
    #[serde(rename = "HUE_BRIDGE_ADDRESS")]
    pub hue_bridge_address: String,
    #[serde(rename = "HUE_BRIDGE_USER")]
    pub hue_bridge_user: String,
    #[serde(rename = "HUE_BRIDGE_USER_CLIENT_KEY")]
    pub hue_bridge_user_client_key: String,
}

#[utoipa::path(
    post,
    path = "/api/hue/pair",
    request_body = PairRequest,
    responses(
        (status = 200, description = "Pairing successful", body = PairResponse),
        (status = 400, description = "Pairing failed")
    )
)]
pub async fn pair(
    state: web::Data<Arc<AppState>>,
    body: web::Json<PairRequest>,
) -> HttpResponse {
    let bridge_ip = body
        .bridge_ip
        .clone()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| state.settings.hue_bridge_address.clone());

    if bridge_ip.is_empty() {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "bridgeIp required (or set HUE_BRIDGE_ADDRESS)"}));
    }

    let url = format!("https://{bridge_ip}/api");
    let payload = serde_json::json!({
        "devicetype": "hcc#server",
        "generateclientkey": true,
    });

    let res = match state.hue_client.post(&url).json(&payload).send().await {
        Ok(r) => r,
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": e.to_string()}));
        }
    };

    let entries: Vec<serde_json::Value> = match res.json().await {
        Ok(v) => v,
        Err(e) => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": e.to_string()}));
        }
    };

    let entry = &entries[0];
    if let Some(error) = entry.get("error") {
        let desc = error
            .get("description")
            .and_then(|d| d.as_str())
            .unwrap_or("Pairing failed");
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": desc}));
    }

    if let Some(success) = entry.get("success") {
        let username = success
            .get("username")
            .and_then(|u| u.as_str())
            .unwrap_or_default();
        let clientkey = success
            .get("clientkey")
            .and_then(|c| c.as_str())
            .unwrap_or_default();

        return HttpResponse::Ok().json(PairResponse {
            message: "Pairing successful. Add these to your .env:".into(),
            hue_bridge_address: bridge_ip,
            hue_bridge_user: username.into(),
            hue_bridge_user_client_key: clientkey.into(),
        });
    }

    HttpResponse::BadRequest().json(serde_json::json!({"error": "Unexpected response"}))
}

// ---- POST /api/hue/toggleGroup/{id} ----

#[utoipa::path(
    post,
    path = "/api/hue/toggleGroup/{id}",
    params(("id" = String, Path, description = "Grouped light resource ID")),
    responses(
        (status = 200, description = "Group toggled"),
        (status = 502, description = "Failed to toggle group")
    )
)]
pub async fn toggle_group(
    state: web::Data<Arc<AppState>>,
    path: web::Path<String>,
) -> HttpResponse {
    let group_id = path.into_inner();

    let current = match hue_fetch::<GroupedLightResource>(
        &state,
        &format!("/clip/v2/resource/grouped_light/{group_id}"),
    )
    .await
    {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Failed to get group {group_id}: {e}");
            return HttpResponse::BadGateway()
                .json(serde_json::json!({"error": e.to_string()}));
        }
    };

    let is_on = current.data[0].on.on;
    let body = serde_json::json!({"on": {"on": !is_on}});

    match hue_put(
        &state,
        &format!("/clip/v2/resource/grouped_light/{group_id}"),
        &body,
    )
    .await
    {
        Ok(()) => HttpResponse::Ok().finish(),
        Err(e) => {
            tracing::error!("Failed to toggle group {group_id}: {e}");
            HttpResponse::BadGateway()
                .json(serde_json::json!({"error": e.to_string()}))
        }
    }
}
