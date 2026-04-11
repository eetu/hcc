use std::time::{Duration, Instant};

use tokio::sync::RwLock;

struct CacheEntry<T> {
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

    pub async fn get(&self) -> Option<T> {
        let guard = self.inner.read().await;
        guard.as_ref().and_then(|entry| {
            if entry.created_at.elapsed() < self.ttl {
                Some(entry.data.clone())
            } else {
                None
            }
        })
    }

    /// Returns cached data even if expired (for fallback on error).
    pub async fn get_stale(&self) -> Option<T> {
        let guard = self.inner.read().await;
        guard.as_ref().map(|entry| entry.data.clone())
    }

    pub async fn set(&self, data: T) {
        let mut guard = self.inner.write().await;
        *guard = Some(CacheEntry {
            data,
            created_at: Instant::now(),
        });
    }

    pub async fn has_data(&self) -> bool {
        self.inner.read().await.is_some()
    }
}
