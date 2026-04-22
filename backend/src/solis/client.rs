use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::Utc;
use hmac::{Hmac, KeyInit, Mac};
use sha1::Sha1;

use crate::AppState;

use super::models::SolisWidgetData;

const CONTENT_TYPE: &str = "application/json";

#[derive(Debug, thiserror::Error)]
pub enum SolisError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error {status}: {message}")]
    Api { status: u16, message: String },
    #[error("Missing field in response: {0}")]
    MissingField(&'static str),
}

fn gmt_date() -> String {
    Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string()
}

fn md5_base64(body: &str) -> String {
    let digest = md5::compute(body.as_bytes());
    STANDARD.encode(digest.as_ref())
}

fn hmac_sha1_base64(secret: &str, message: &str) -> String {
    let mut mac =
        Hmac::<Sha1>::new_from_slice(secret.as_bytes()).expect("HMAC accepts keys of any length");
    mac.update(message.as_bytes());
    STANDARD.encode(mac.finalize().into_bytes())
}

fn build_auth_headers(
    key_id: &str,
    key_secret: &str,
    path: &str,
    body: &str,
) -> (String, String, String) {
    let date = gmt_date();
    let content_md5 = md5_base64(body);
    let string_to_sign = format!("POST\n{content_md5}\n{CONTENT_TYPE}\n{date}\n{path}");
    let sig = hmac_sha1_base64(key_secret, &string_to_sign);
    let authorization = format!("API {key_id}:{sig}");

    tracing::debug!(
        body,
        content_md5,
        date,
        path,
        string_to_sign,
        authorization,
        "SolisCloud signing"
    );

    (date, content_md5, authorization)
}

pub async fn fetch_station_detail(state: &AppState) -> Result<SolisWidgetData, SolisError> {
    let settings = &state.settings;
    let path = "/v1/api/stationDetail";
    let body = format!(r#"{{"id":"{}"}}"#, settings.solis_station_id);

    let (date, content_md5, authorization) = build_auth_headers(
        &settings.solis_key_id,
        &settings.solis_key_secret,
        path,
        &body,
    );

    let url = format!("{}{}", settings.solis_base_url, path);

    let res = state
        .http_client
        .post(&url)
        .header("Content-Type", CONTENT_TYPE)
        .header("Date", &date)
        .header("Content-MD5", &content_md5)
        .header("Authorization", &authorization)
        .body(body)
        .send()
        .await?;

    let status = res.status().as_u16();
    let json: serde_json::Value = res.json().await?;

    if status != 200 {
        let message = json
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("unknown error")
            .to_string();
        return Err(SolisError::Api { status, message });
    }

    let code = json.get("code").and_then(|c| c.as_str()).unwrap_or("");
    if code != "0" {
        let message = json
            .get("msg")
            .and_then(|m| m.as_str())
            .unwrap_or("unknown error")
            .to_string();
        return Err(SolisError::Api {
            status: 200,
            message,
        });
    }

    let data = json.get("data").ok_or(SolisError::MissingField("data"))?;

    tracing::debug!("stationDetail data {data:?}");

    Ok(SolisWidgetData {
        power: data.get("power").and_then(|v| v.as_f64()).unwrap_or(0.0),
        power_unit: string_field(data, "powerStr"),
        today_energy: data
            .get("dayEnergy")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        today_energy_unit: string_field(data, "dayEnergyStr"),
        month_energy: data
            .get("monthEnergy")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        month_energy_unit: string_field(data, "monthEnergyStr"),
        year_energy: data
            .get("yearEnergy")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        year_energy_unit: string_field(data, "yearEnergyStr"),
        total_energy: data
            .get("allEnergy")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        total_energy_unit: string_field(data, "allEnergyStr"),
        grid_power: data.get("psum").and_then(|v| v.as_f64()),
        grid_power_unit: data
            .get("psumStr")
            .and_then(|v| v.as_str())
            .map(String::from),
        battery_soc: data.get("batteryPercent").and_then(|v| v.as_f64()),
        battery_power: data.get("batteryPower").and_then(|v| v.as_f64()),
        battery_power_unit: data
            .get("batteryPowerStr")
            .and_then(|v| v.as_str())
            .map(String::from),
        status: data.get("state").and_then(|v| v.as_u64()).unwrap_or(2) as u8,
        updated_at: data
            .get("dataTimestamp")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<i64>().ok())
            .or_else(|| data.get("dataTimestamp").and_then(|v| v.as_i64()))
            .unwrap_or(0),
    })
}

fn string_field(data: &serde_json::Value, key: &str) -> String {
    data.get(key)
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}
