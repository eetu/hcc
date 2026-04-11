use std::sync::Arc;
use std::time::{Duration, SystemTime};

use tokio::sync::OnceCell;

use crate::AppState;

use super::client::HueError;

const BRIDGE_CACHE_FILE: &str = "/tmp/hue-bridge-address";
const FILE_CACHE_TTL: Duration = Duration::from_secs(3600);

static DISCOVERED_ADDRESS: OnceCell<String> = OnceCell::const_new();

pub async fn get_bridge_address(state: &Arc<AppState>) -> Result<String, HueError> {
    // 1. From env
    if !state.settings.hue_bridge_address.is_empty() {
        return Ok(state.settings.hue_bridge_address.clone());
    }

    // 2. From OnceCell (already discovered this process)
    if let Some(addr) = DISCOVERED_ADDRESS.get() {
        return Ok(addr.clone());
    }

    // 3. From file cache
    if let Some(addr) = read_file_cache() {
        // Store in OnceCell too (ignore if already set by concurrent call)
        let _ = DISCOVERED_ADDRESS.set(addr.clone());
        return Ok(addr);
    }

    // 4. Discover via meethue.com (OnceCell deduplicates concurrent calls)
    let client = state.http_client.clone();
    let addr = DISCOVERED_ADDRESS
        .get_or_try_init(|| discover_bridge(client))
        .await
        .map_err(HueError::Http)?;

    Ok(addr.clone())
}

fn read_file_cache() -> Option<String> {
    let metadata = std::fs::metadata(BRIDGE_CACHE_FILE).ok()?;
    let modified = metadata.modified().ok()?;
    if SystemTime::now().duration_since(modified).ok()? > FILE_CACHE_TTL {
        return None;
    }
    let value = std::fs::read_to_string(BRIDGE_CACHE_FILE).ok()?;
    let trimmed = value.trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

fn write_file_cache(address: &str) {
    let _ = std::fs::write(BRIDGE_CACHE_FILE, address);
}

#[derive(serde::Deserialize)]
struct BridgeDiscovery {
    internalipaddress: Option<String>,
}

async fn discover_bridge(client: reqwest::Client) -> Result<String, reqwest::Error> {
    let bridges: Vec<BridgeDiscovery> = client
        .get("https://discovery.meethue.com/")
        .send()
        .await?
        .json()
        .await?;

    let address = bridges
        .into_iter()
        .find_map(|b| b.internalipaddress)
        .expect("No Hue bridge found on network");

    tracing::info!("Discovered Hue bridge at {address}");
    write_file_cache(&address);
    Ok(address)
}
