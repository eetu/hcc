use rusqlite::Connection;

use super::models::{SolisReading, SolisWidgetData};

pub fn init_schema(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS solis_readings (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             power REAL NOT NULL,
             grid_power REAL,
             battery_soc REAL,
             battery_power REAL,
             today_energy REAL NOT NULL,
             status INTEGER NOT NULL,
             recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
         );
         CREATE INDEX IF NOT EXISTS idx_solis_readings_time
             ON solis_readings (recorded_at);",
    )
}

pub fn insert_reading(conn: &Connection, data: &SolisWidgetData) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare_cached(
        "INSERT INTO solis_readings
             (power, grid_power, battery_soc, battery_power, today_energy, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )?;
    stmt.execute(rusqlite::params![
        data.power,
        data.grid_power,
        data.battery_soc,
        data.battery_power,
        data.today_energy,
        data.status as i64,
    ])?;
    Ok(())
}

pub fn query_readings(
    conn: &Connection,
    hours: u32,
    max_points: Option<u32>,
) -> rusqlite::Result<Vec<SolisReading>> {
    let cutoff = format!("-{hours} hours");

    match max_points {
        Some(max) => {
            let total: u32 = conn.query_row(
                "SELECT COUNT(*) FROM solis_readings
                 WHERE recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)",
                rusqlite::params![cutoff],
                |r| r.get(0),
            )?;
            let step = (total / max).max(1);

            let mut stmt = conn.prepare_cached(
                "SELECT power, grid_power, battery_soc, battery_power,
                        today_energy, status, recorded_at
                 FROM (
                     SELECT *, ROW_NUMBER() OVER (ORDER BY recorded_at) AS rn
                     FROM solis_readings
                     WHERE recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)
                 )
                 WHERE rn % ?2 = 0
                 ORDER BY recorded_at ASC",
            )?;
            let rows = stmt
                .query_map(rusqlite::params![cutoff, step], row_to_reading)?
                .collect::<rusqlite::Result<Vec<_>>>();
            rows
        }
        None => {
            let mut stmt = conn.prepare_cached(
                "SELECT power, grid_power, battery_soc, battery_power,
                        today_energy, status, recorded_at
                 FROM solis_readings
                 WHERE recorded_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)
                 ORDER BY recorded_at ASC",
            )?;
            let rows = stmt
                .query_map(rusqlite::params![cutoff], row_to_reading)?
                .collect::<rusqlite::Result<Vec<_>>>();
            rows
        }
    }
}

pub fn prune(conn: &Connection, retain_days: u32) -> rusqlite::Result<usize> {
    let cutoff = format!("-{retain_days} days");
    conn.execute(
        "DELETE FROM solis_readings
         WHERE recorded_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?1)",
        rusqlite::params![cutoff],
    )
}

fn row_to_reading(row: &rusqlite::Row) -> rusqlite::Result<SolisReading> {
    Ok(SolisReading {
        power: row.get(0)?,
        grid_power: row.get(1)?,
        battery_soc: row.get(2)?,
        battery_power: row.get(3)?,
        today_energy: row.get(4)?,
        status: row.get::<_, i64>(5)? as u8,
        recorded_at: row.get(6)?,
    })
}
