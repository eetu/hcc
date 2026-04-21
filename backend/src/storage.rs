use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use rusqlite::Connection;
use serde::Serialize;
use tokio::sync::Mutex;
use utoipa::ToSchema;

use crate::hue::data::fetch_hue_data;
use crate::AppState;

pub struct Storage {
    conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SensorReading {
    pub sensor_id: String,
    pub sensor_name: String,
    pub temperature: f64,
    pub room_type: String,
    pub recorded_at: String,
}

impl Storage {
    pub fn open(path: &Path) -> rusqlite::Result<Self> {
        let conn = Connection::open(path)?;

        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA wal_autocheckpoint = 1000;

             CREATE TABLE IF NOT EXISTS sensor_readings (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 sensor_id TEXT NOT NULL,
                 sensor_name TEXT NOT NULL,
                 temperature REAL NOT NULL,
                 room_type TEXT NOT NULL,
                 recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
             );

             CREATE INDEX IF NOT EXISTS idx_readings_sensor_time
                 ON sensor_readings (sensor_id, recorded_at);
             CREATE INDEX IF NOT EXISTS idx_readings_time
                 ON sensor_readings (recorded_at);

             CREATE TABLE IF NOT EXISTS user_settings (
                 id INTEGER PRIMARY KEY CHECK (id = 1),
                 data TEXT NOT NULL DEFAULT '{}'
             );
             INSERT OR IGNORE INTO user_settings (id, data) VALUES (1, '{}');",
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub async fn insert_readings(&self, readings: &[SensorReading]) -> rusqlite::Result<()> {
        let conn = self.conn.lock().await;
        let mut stmt = conn.prepare_cached(
            "INSERT INTO sensor_readings (sensor_id, sensor_name, temperature, room_type)
             VALUES (?1, ?2, ?3, ?4)",
        )?;
        for r in readings {
            stmt.execute(rusqlite::params![
                r.sensor_id,
                r.sensor_name,
                r.temperature,
                r.room_type,
            ])?;
        }
        Ok(())
    }

    pub async fn query_readings(
        &self,
        sensor_id: Option<&str>,
        hours: u32,
        max_points: Option<u32>,
    ) -> rusqlite::Result<Vec<SensorReading>> {
        let conn = self.conn.lock().await;
        let cutoff = format!("-{hours} hours");

        match (sensor_id, max_points) {
            (Some(sid), Some(max)) => {
                let mut stmt = conn.prepare_cached(
                    "SELECT sensor_id, sensor_name, temperature, room_type, recorded_at
                     FROM (
                         SELECT sensor_id, sensor_name, temperature, room_type, recorded_at,
                                ROW_NUMBER() OVER (ORDER BY recorded_at) AS rn,
                                COUNT(*) OVER () AS total
                         FROM sensor_readings
                         WHERE sensor_id = ?1
                           AND recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?2)
                     )
                     WHERE (rn - 1) % MAX(1, (total + ?3 - 1) / ?3) = 0
                     ORDER BY recorded_at ASC",
                )?;
                let rows = stmt.query_map(rusqlite::params![sid, cutoff, max], row_to_reading)?
                    .collect::<rusqlite::Result<Vec<_>>>();
                rows
            }
            (Some(sid), None) => {
                let mut stmt = conn.prepare_cached(
                    "SELECT sensor_id, sensor_name, temperature, room_type, recorded_at
                     FROM sensor_readings
                     WHERE sensor_id = ?1 AND recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?2)
                     ORDER BY recorded_at ASC",
                )?;
                let rows = stmt.query_map(rusqlite::params![sid, cutoff], row_to_reading)?
                    .collect::<rusqlite::Result<Vec<_>>>();
                rows
            }
            (None, Some(max)) => {
                let mut stmt = conn.prepare_cached(
                    "SELECT sensor_id, sensor_name, temperature, room_type, recorded_at
                     FROM (
                         SELECT sensor_id, sensor_name, temperature, room_type, recorded_at,
                                ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY recorded_at) AS rn,
                                COUNT(*) OVER (PARTITION BY sensor_id) AS total
                         FROM sensor_readings
                         WHERE recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)
                     )
                     WHERE (rn - 1) % MAX(1, (total + ?2 - 1) / ?2) = 0
                     ORDER BY recorded_at ASC",
                )?;
                let rows = stmt.query_map(rusqlite::params![cutoff, max], row_to_reading)?
                    .collect::<rusqlite::Result<Vec<_>>>();
                rows
            }
            (None, None) => {
                let mut stmt = conn.prepare_cached(
                    "SELECT sensor_id, sensor_name, temperature, room_type, recorded_at
                     FROM sensor_readings
                     WHERE recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)
                     ORDER BY recorded_at ASC",
                )?;
                let rows = stmt.query_map(rusqlite::params![cutoff], row_to_reading)?
                    .collect::<rusqlite::Result<Vec<_>>>();
                rows
            }
        }
    }

    pub async fn get_settings(&self) -> rusqlite::Result<String> {
        let conn = self.conn.lock().await;
        conn.query_row(
            "SELECT data FROM user_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
    }

    pub async fn save_settings(&self, data: &str) -> rusqlite::Result<()> {
        let conn = self.conn.lock().await;
        conn.execute(
            "UPDATE user_settings SET data = ?1 WHERE id = 1",
            rusqlite::params![data],
        )?;
        Ok(())
    }

    pub async fn prune(&self, retain_days: u32) -> rusqlite::Result<usize> {
        let conn = self.conn.lock().await;
        let cutoff = format!("-{retain_days} days");
        conn.execute(
            "DELETE FROM sensor_readings WHERE recorded_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)",
            rusqlite::params![cutoff],
        )
    }
}

fn row_to_reading(row: &rusqlite::Row) -> rusqlite::Result<SensorReading> {
    Ok(SensorReading {
        sensor_id: row.get(0)?,
        sensor_name: row.get(1)?,
        temperature: row.get(2)?,
        room_type: row.get(3)?,
        recorded_at: row.get(4)?,
    })
}

pub fn start_recording_loop(state: Arc<AppState>) {
    if state.settings.history_retention_days == 0 {
        tracing::info!("Sensor history recording disabled (HCC_HISTORY_RETENTION_DAYS=0)");
        return;
    }

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(300));
        // Prune daily (every 288 ticks at 5min interval)
        let mut tick_count: u32 = 0;

        loop {
            interval.tick().await;

            match fetch_hue_data(&state).await {
                Ok(hue) => {
                    let readings: Vec<SensorReading> = hue
                        .sensors
                        .iter()
                        .filter(|s| s.enabled && s.connected)
                        .filter_map(|s| {
                            s.temperature.map(|t| SensorReading {
                                sensor_id: s.id.clone(),
                                sensor_name: s.name.clone(),
                                temperature: t,
                                room_type: format!("{:?}", s.room_type).to_lowercase(),
                                recorded_at: String::new(), // DB default
                            })
                        })
                        .collect();

                    if let Err(e) = state.storage.insert_readings(&readings).await {
                        tracing::error!("Failed to store sensor readings: {e}");
                    }
                }
                Err(e) => {
                    tracing::warn!("Skipping sensor recording, fetch failed: {e}");
                }
            }

            tick_count += 1;
            if tick_count.is_multiple_of(288) {
                match state.storage.prune(state.settings.history_retention_days).await {
                    Ok(n) if n > 0 => tracing::info!("Pruned {n} old sensor readings"),
                    Err(e) => tracing::error!("Failed to prune old readings: {e}"),
                    _ => {}
                }
            }
        }
    });
}
