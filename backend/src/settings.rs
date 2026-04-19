use std::env;

pub struct Settings {
    pub tomorrow_io_api_key: String,
    pub tomorrow_io_base_url: String,
    pub fmi_base_url: String,
    pub position_lat: String,
    pub position_lon: String,
    pub language: String,
    pub hue_bridge_address: String,
    pub hue_bridge_user: String,
    pub hue_room_types: String,
    pub static_dir: String,
    pub port: u16,
    pub history_retention_days: u32,
}

impl Settings {
    pub fn test_defaults() -> Self {
        Self {
            tomorrow_io_api_key: String::new(),
            tomorrow_io_base_url: "https://api.tomorrow.io".into(),
            fmi_base_url: "https://opendata.fmi.fi/wfs".into(),
            position_lat: "60.17".into(),
            position_lon: "24.94".into(),
            language: "fi".into(),
            hue_bridge_address: String::new(),
            hue_bridge_user: String::new(),
            hue_room_types: "{}".into(),
            static_dir: "./dist".into(),
            port: 3000,
            history_retention_days: 0,
        }
    }

    pub fn from_env() -> Self {
        Self {
            tomorrow_io_api_key: env::var("TOMORROW_IO_API_KEY").unwrap_or_default(),
            tomorrow_io_base_url: env::var("TOMORROW_IO_BASE_URL")
                .unwrap_or_else(|_| "https://api.tomorrow.io".into()),
            fmi_base_url: env::var("FMI_BASE_URL")
                .unwrap_or_else(|_| "https://opendata.fmi.fi/wfs".into()),
            position_lat: env::var("POSITION_LAT").expect("POSITION_LAT must be set"),
            position_lon: env::var("POSITION_LON").expect("POSITION_LON must be set"),
            language: env::var("LANGUAGE").unwrap_or_else(|_| "fi".into()),
            hue_bridge_address: env::var("HUE_BRIDGE_ADDRESS").unwrap_or_default(),
            hue_bridge_user: env::var("HUE_BRIDGE_USER").unwrap_or_default(),
            hue_room_types: env::var("HUE_ROOM_TYPES")
                .unwrap_or_else(|_| "{}".into())
                .trim_matches('\'')
                .trim_matches('"')
                .to_string(),
            static_dir: env::var("STATIC_DIR").unwrap_or_else(|_| "./dist".into()),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(3000),
            history_retention_days: env::var("HCC_HISTORY_RETENTION_DAYS")
                .ok()
                .and_then(|d| d.parse().ok())
                .unwrap_or(0),
        }
    }
}
