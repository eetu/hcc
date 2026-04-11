use std::env;

pub struct Settings {
    pub tomorrow_io_api_key: String,
    pub position_lat: String,
    pub position_lon: String,
    pub language: String,
    pub hue_bridge_address: String,
    pub hue_bridge_user: String,
    pub hue_room_types: String,
    pub port: u16,
}

impl Settings {
    pub fn from_env() -> Self {
        Self {
            tomorrow_io_api_key: env::var("TOMORROW_IO_API_KEY").unwrap_or_default(),
            position_lat: env::var("POSITION_LAT").expect("POSITION_LAT must be set"),
            position_lon: env::var("POSITION_LON").expect("POSITION_LON must be set"),
            language: env::var("LANGUAGE").unwrap_or_else(|_| "fi".into()),
            hue_bridge_address: env::var("HUE_BRIDGE_ADDRESS").unwrap_or_default(),
            hue_bridge_user: env::var("HUE_BRIDGE_USER").unwrap_or_default(),
            hue_room_types: env::var("HUE_ROOM_TYPES").unwrap_or_else(|_| "{}".into()),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(3001),
        }
    }
}
