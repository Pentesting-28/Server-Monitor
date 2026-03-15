use axum::{extract::State, Json};
use crate::models::metrics::{SystemSnapshot, LogEntry};
use std::sync::{Arc, RwLock};
use sqlx::SqlitePool;

pub type SharedState = Arc<RwLock<Option<SystemSnapshot>>>;

#[derive(Clone)]
pub struct AppState {
    pub metrics: SharedState,
    pub db: SqlitePool,
}

pub async fn get_metrics(
    State(state): State<AppState>,
) -> Json<Option<SystemSnapshot>> {
    let snapshot = state.metrics.read().unwrap();
    Json(snapshot.clone())
}

pub async fn get_logs(
    State(state): State<AppState>,
) -> Json<Vec<LogEntry>> {
    // Usamos el query manual con tipo explícito para la base de datos
    let logs = sqlx::query_as::<sqlx::Sqlite, LogEntry>(
        "SELECT id, level, message, timestamp FROM system_logs ORDER BY timestamp DESC LIMIT 50"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Json(logs)
}
