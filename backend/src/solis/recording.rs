use std::sync::Arc;
use std::time::Duration;

use crate::AppState;

use super::client::fetch_station_detail;

const TICK_SECS: u64 = 300;
const PRUNE_EVERY_TICKS: u32 = 288;

pub fn start(state: Arc<AppState>) {
    if state.settings.solis_key_id.is_empty() {
        tracing::info!("Solis history recording disabled (SolisCloud not configured)");
        return;
    }
    if state.settings.history_retention_days == 0 {
        tracing::info!("Solis history recording disabled (HCC_HISTORY_RETENTION_DAYS=0)");
        return;
    }

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(TICK_SECS));
        let mut tick_count: u32 = 0;

        loop {
            interval.tick().await;

            match fetch_station_detail(&state).await {
                Ok(data) => {
                    state.solis_cache.set("station".into(), data.clone()).await;

                    if data.status == 2 {
                        tracing::debug!("Skipping Solis recording, inverter offline");
                    } else if let Err(e) = state.storage.insert_solis_reading(&data).await {
                        tracing::error!("Failed to store Solis reading: {e}");
                    }
                }
                Err(e) => {
                    tracing::warn!("Skipping Solis recording, fetch failed: {e}");
                }
            }

            tick_count += 1;
            if tick_count.is_multiple_of(PRUNE_EVERY_TICKS) {
                match state
                    .storage
                    .prune_solis(state.settings.history_retention_days)
                    .await
                {
                    Ok(n) if n > 0 => tracing::info!("Pruned {n} old Solis readings"),
                    Err(e) => tracing::error!("Failed to prune Solis readings: {e}"),
                    _ => {}
                }
            }
        }
    });
}
