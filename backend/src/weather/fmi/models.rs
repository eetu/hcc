use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct FmiObservation {
    pub time: DateTime<Utc>,
    pub temperature: Option<f64>,
    pub wind_speed: Option<f64>,
    pub wind_gust: Option<f64>,
    pub wind_direction: Option<f64>,
    pub humidity: Option<f64>,
    pub precipitation_1h: Option<f64>,
    pub cloud_cover: Option<f64>,
    pub pressure: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct FmiForecastPoint {
    pub time: DateTime<Utc>,
    pub temperature: Option<f64>,
    pub wind_speed: Option<f64>,
    pub wind_gust: Option<f64>,
    pub wind_direction: Option<f64>,
    pub precipitation_1h: Option<f64>,
    pub cloud_cover: Option<f64>,
    pub humidity: Option<f64>,
    pub weather_symbol: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct FmiWeatherData {
    pub observation: Option<FmiObservation>,
    pub forecasts: Vec<FmiForecastPoint>,
}
