use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct WeatherResponse {
    pub current: Option<CurrentWeather>,
    pub hourly: Vec<HourlyForecast>,
    pub daily: Vec<DailyForecast>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentWeather {
    pub time: String,
    pub temperature: f64,
    pub temperature_apparent: f64,
    pub wind_speed: f64,
    pub wind_gust: Option<f64>,
    pub wind_direction: f64,
    pub humidity: f64,
    pub precipitation_1h: f64,
    pub cloud_cover: Option<f64>,
    pub pressure: Option<f64>,
    pub weather_symbol: i32,
    pub sunrise: String,
    pub sunset: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HourlyForecast {
    pub time: String,
    pub temperature: f64,
    pub temperature_apparent: f64,
    pub wind_speed: f64,
    pub wind_gust: Option<f64>,
    pub wind_direction: f64,
    pub humidity: Option<f64>,
    pub precipitation_1h: f64,
    pub cloud_cover: Option<f64>,
    pub weather_symbol: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyForecast {
    pub date: String,
    pub temperature_max: f64,
    pub temperature_min: f64,
    pub precipitation: f64,
    pub precipitation_type: String,
    pub weather_symbol: i32,
    pub sunrise: String,
    pub sunset: String,
}
