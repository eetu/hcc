use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

// ---- Public response types (match Next.js /api/hue shape) ----

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct HueResponse {
    pub sensors: Vec<Sensor>,
    pub groups: Vec<Group>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Sensor {
    pub id: String,
    pub device_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    #[serde(rename = "type")]
    pub room_type: RoomType,
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub battery: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion_updated_at: Option<String>,
    pub connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub state: GroupState,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct GroupState {
    pub on: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum RoomType {
    Inside,
    InsideCold,
    Outside,
}

// ---- CLIP v2 resource shapes (for deserialization from bridge) ----

#[derive(Debug, Deserialize)]
pub struct HueList<T> {
    pub data: Vec<T>,
}

#[derive(Debug, Deserialize)]
pub struct RoomResource {
    pub id: String,
    pub metadata: Metadata,
    pub children: Vec<ResourceRef>,
}

#[derive(Debug, Deserialize)]
pub struct Metadata {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct ResourceRef {
    pub rid: String,
    pub rtype: String,
}

#[derive(Debug, Deserialize)]
pub struct TemperatureResource {
    pub id: String,
    pub owner: Owner,
    pub enabled: bool,
    pub temperature: TemperatureData,
}

#[derive(Debug, Deserialize)]
pub struct TemperatureData {
    pub temperature: f64,
    pub temperature_report: Option<TemperatureReport>,
}

#[derive(Debug, Deserialize)]
pub struct TemperatureReport {
    pub temperature: f64,
}

#[derive(Debug, Deserialize)]
pub struct Owner {
    pub rid: String,
}

#[derive(Debug, Deserialize)]
pub struct GroupedLightResource {
    pub id: String,
    pub owner: GroupedLightOwner,
    pub on: OnState,
}

#[derive(Debug, Deserialize)]
pub struct GroupedLightOwner {
    pub rid: String,
    pub rtype: String,
}

#[derive(Debug, Deserialize)]
pub struct OnState {
    pub on: bool,
}

#[derive(Debug, Deserialize)]
pub struct DeviceResource {
    pub id: String,
    pub metadata: Metadata,
}

#[derive(Debug, Deserialize)]
pub struct DevicePowerResource {
    pub owner: Owner,
    pub power_state: PowerState,
}

#[derive(Debug, Deserialize)]
pub struct PowerState {
    pub battery_level: Option<u8>,
}

#[derive(Debug, Deserialize)]
pub struct MotionResource {
    pub owner: Owner,
    pub motion: MotionData,
}

#[derive(Debug, Deserialize)]
pub struct MotionData {
    pub motion: bool,
    pub motion_report: Option<MotionReport>,
}

#[derive(Debug, Deserialize)]
pub struct MotionReport {
    pub motion: bool,
    pub changed: String,
}

#[derive(Debug, Deserialize)]
pub struct ZigbeeConnectivityResource {
    pub owner: Owner,
    pub status: String,
}
