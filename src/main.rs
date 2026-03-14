mod api;
mod collector;
mod db;
mod models;

use std::sync::{Arc, RwLock};
use std::time::Duration;
use tokio::time::sleep;
use axum::{routing::get, Router};
use tower_http::cors::CorsLayer;

use collector::system::collect_system_data;
use db::database::init_db;
use api::handlers::{get_metrics, SharedState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    tracing_subscriber::fmt::init();
    tracing::info!("Starting server monitor");

    let db_url = "sqlite:monitor.db?mode=rwc";
    let _pool = init_db(db_url).await?;
    tracing::info!("Database initialized successfully");

    let state: SharedState = Arc::new(RwLock::new(None));
    let state_for_collector = state.clone();

    tokio::spawn(async move {
        tracing::info!("Background collector started");
        loop {
            let snapshot = collect_system_data();
            {
                let mut lock = state_for_collector.write().unwrap();
                *lock = Some(snapshot);
            }

            sleep(Duration::from_secs(5)).await;
        }
    });

    let app = Router::new()
        .route("/api/metrics", get(get_metrics))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("API Server running on http://{}", listener.local_addr()?);
    
    axum::serve(listener, app).await?;

    Ok(())
}