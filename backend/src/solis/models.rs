use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SolisWidgetData {
    /// Current AC output power
    pub power: f64,
    pub power_unit: String,
    /// Energy generated today
    pub today_energy: f64,
    pub today_energy_unit: String,
    /// Energy generated this month
    pub month_energy: f64,
    pub month_energy_unit: String,
    /// Energy generated this year
    pub year_energy: f64,
    pub year_energy_unit: String,
    /// Total lifetime energy generated
    pub total_energy: f64,
    pub total_energy_unit: String,
    /// Grid power: positive = exporting, negative = importing
    pub grid_power: Option<f64>,
    pub grid_power_unit: Option<String>,
    /// Battery state of charge (%)
    pub battery_soc: Option<f64>,
    /// Battery power: positive = charging, negative = discharging
    pub battery_power: Option<f64>,
    pub battery_power_unit: Option<String>,
    /// 1 = online, 2 = offline, 3 = alarm
    pub status: u8,
    /// Data timestamp from inverter (UTC+8 ms)
    pub updated_at: i64,
}
