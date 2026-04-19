use std::sync::Arc;

use actix_web::{web, HttpResponse};

use super::converter::{FmiConverter, WeatherConverter};
use crate::AppState;

// ---- FMI ----

#[utoipa::path(
    get,
    path = "/api/weather/fmi",
    responses(
        (status = 200, description = "Weather data from FMI"),
        (status = 502, description = "Failed to fetch weather data")
    )
)]
pub async fn fmi(state: web::Data<Arc<AppState>>) -> HttpResponse {
    if let Some(cached) = state.weather_cache.get().await {
        tracing::debug!("Returning cached FMI weather data");
        return HttpResponse::Ok().json(cached);
    }

    let settings = &state.settings;

    match super::fmi::client::fetch_all(
        &state.http_client,
        &settings.fmi_base_url,
        &settings.position_lat,
        &settings.position_lon,
    )
    .await
    {
        Ok(fmi_data) => {
            let lat: f64 = settings
                .position_lat
                .parse()
                .expect("POSITION_LAT must be a valid number");
            let lon: f64 = settings
                .position_lon
                .parse()
                .expect("POSITION_LON must be a valid number");
            let converter = FmiConverter;
            let response = converter.convert(&fmi_data, lat, lon);
            state.weather_cache.set(response.clone()).await;
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to fetch FMI weather data: {e}");
            fmi_fallback_or_error(&state).await
        }
    }
}

async fn fmi_fallback_or_error(state: &AppState) -> HttpResponse {
    if let Some(stale) = state.weather_cache.get_stale().await {
        tracing::warn!("Returning stale cached weather data");
        HttpResponse::Ok().json(stale)
    } else {
        HttpResponse::BadGateway().json(serde_json::json!({"error": "No cached data available"}))
    }
}

// ---- Tomorrow.io ----

#[utoipa::path(
    get,
    path = "/api/weather/tomorrow",
    responses(
        (status = 200, description = "Tomorrow.io weather data"),
        (status = 502, description = "Failed to fetch weather data")
    )
)]
pub async fn tomorrow(state: web::Data<Arc<AppState>>) -> HttpResponse {
    if let Some(cached) = state.tomorrow_cache.get().await {
        tracing::debug!("Returning cached Tomorrow.io weather data");
        return HttpResponse::Ok().json(cached);
    }

    let settings = &state.settings;

    let fields = [
        "precipitationProbabilityAvg",
        "precipitationIntensity",
        "precipitationType",
        "windSpeed",
        "windGust",
        "windDirection",
        "temperature",
        "temperatureApparent",
        "cloudCover",
        "cloudBase",
        "cloudCeiling",
        "weatherCode",
        "sunriseTime",
        "sunsetTime",
        "rainAccumulation",
        "snowAccumulation",
    ];

    let timesteps = "current,1d,1h";

    let url = format!(
        "{}/v4/timelines?location={},{}&apikey={}&timesteps={}&fields={}&timezone=Europe/Helsinki",
        settings.tomorrow_io_base_url,
        settings.position_lat,
        settings.position_lon,
        settings.tomorrow_io_api_key,
        timesteps,
        fields.join(","),
    );

    match state.http_client.get(&url).send().await {
        Ok(res) if res.status().is_success() => match res.json::<serde_json::Value>().await {
            Ok(data) => {
                state.tomorrow_cache.set(data.clone()).await;
                HttpResponse::Ok().json(data)
            }
            Err(e) => {
                tracing::error!("Failed to parse Tomorrow.io response: {e}");
                tomorrow_fallback_or_error(&state).await
            }
        },
        Ok(res) => {
            tracing::error!("Tomorrow.io responded with status {}", res.status());
            tomorrow_fallback_or_error(&state).await
        }
        Err(e) => {
            tracing::error!("Failed to fetch Tomorrow.io weather: {e}");
            tomorrow_fallback_or_error(&state).await
        }
    }
}

async fn tomorrow_fallback_or_error(state: &AppState) -> HttpResponse {
    if let Some(stale) = state.tomorrow_cache.get_stale().await {
        tracing::warn!("Returning stale cached weather data");
        HttpResponse::Ok().json(stale)
    } else {
        HttpResponse::BadGateway().json(serde_json::json!({"error": "No cached data available"}))
    }
}
