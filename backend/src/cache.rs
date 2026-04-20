use std::time::{Duration, Instant};

use tokio::sync::RwLock;

struct CacheEntry<T> {
    key: String,
    data: T,
    created_at: Instant,
}

pub struct Cache<T> {
    inner: RwLock<Option<CacheEntry<T>>>,
    ttl: Duration,
}

impl<T: Clone> Cache<T> {
    pub fn new(ttl: Duration) -> Self {
        Self {
            inner: RwLock::new(None),
            ttl,
        }
    }

    pub async fn get(&self, key: &str) -> Option<T> {
        let guard = self.inner.read().await;
        guard.as_ref().and_then(|entry| {
            if entry.key == key && entry.created_at.elapsed() < self.ttl {
                Some(entry.data.clone())
            } else {
                None
            }
        })
    }

    /// Returns cached data even if expired (for fallback on error), only if key matches.
    pub async fn get_stale(&self, key: &str) -> Option<T> {
        let guard = self.inner.read().await;
        guard
            .as_ref()
            .filter(|entry| entry.key == key)
            .map(|entry| entry.data.clone())
    }

    pub async fn set(&self, key: String, data: T) {
        let mut guard = self.inner.write().await;
        *guard = Some(CacheEntry {
            key,
            data,
            created_at: Instant::now(),
        });
    }

    pub async fn has_data(&self) -> bool {
        self.inner.read().await.is_some()
    }
}
