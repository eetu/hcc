use std::sync::Arc;

use actix_web::{web, HttpResponse};

use super::models::PvForecast;
use crate::AppState;

const CACHE_KEY: &str = "pv";

#[utoipa::path(
    get,
    path = "/api/pv/forecast",
    responses(
        (status = 200, description = "Latest PV forecast", body = super::models::PvForecast),
        (status = 503, description = "No forecast available yet"),
    )
)]
pub async fn get_forecast(state: web::Data<Arc<AppState>>) -> HttpResponse {
    if let Some(cached) = state.pv_cache.get(CACHE_KEY).await {
        return HttpResponse::Ok().json(cached);
    }

    match state.storage.read_pv_forecast().await {
        Ok(Some(forecast)) => {
            state.pv_cache.set(CACHE_KEY.into(), forecast.clone()).await;
            HttpResponse::Ok().json(forecast)
        }
        Ok(None) => HttpResponse::ServiceUnavailable()
            .json(serde_json::json!({"error": "no forecast available yet"})),
        Err(e) => {
            tracing::error!("Failed to read PV forecast: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/pv/forecast",
    request_body = super::models::PvForecast,
    responses(
        (status = 200, description = "Forecast upserted"),
    )
)]
pub async fn post_forecast(
    state: web::Data<Arc<AppState>>,
    body: web::Json<PvForecast>,
) -> HttpResponse {
    let forecast = body.into_inner();
    match state.storage.upsert_pv_forecast(&forecast).await {
        Ok(n) => {
            state.pv_cache.set(CACHE_KEY.into(), forecast).await;
            tracing::info!("Upserted {n} PV forecast points");
            HttpResponse::Ok().json(serde_json::json!({"upserted": n}))
        }
        Err(e) => {
            tracing::error!("Failed to upsert PV forecast: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}
