use axum::{extract::State, Json};
use crate::models::metrics::SystemSnapshot;
use std::sync::{Arc, RwLock};

pub type SharedState = Arc<RwLock<Option<SystemSnapshot>>>;

pub async fn get_metrics(
    State(state): State<SharedState>,
) -> Json<Option<SystemSnapshot>> {
    let snapshot = state.read().unwrap();
    Json(snapshot.clone())
}
