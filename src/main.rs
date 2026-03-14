mod api;
mod collector;
mod db;
mod models;

use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};
use tokio::time::sleep;
use axum::{routing::get, Router};
use tower_http::cors::CorsLayer;
use std::collections::HashMap;

use collector::system::collect_system_data;
use db::database::{init_db, save_metrics, save_service_event, save_system_log, prune_old_data};
use api::handlers::{get_metrics, get_logs, SharedState, AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting server monitor");

    // 1. Database Initialization
    let db_url = "sqlite:monitor.db?mode=rwc";
    let pool = init_db(db_url).await?;
    tracing::info!("Database initialized successfully");

    // 2. Shared State initialization
    let metrics_state: SharedState = Arc::new(RwLock::new(None));
    let state_for_collector = metrics_state.clone();
    let pool_for_collector = pool.clone();

    // 3. App State for Axum
    let app_state = AppState {
        metrics: metrics_state,
        db: pool.clone(),
    };

    // 4. Background Collector
    tokio::spawn(async move {
        tracing::info!("Background collector started");
        
        let mut last_metrics_save = Instant::now();
        let mut last_prune = Instant::now();
        let mut previous_services: HashMap<String, String> = HashMap::new();

        loop {
            let snapshot = collect_system_data();
            
            // Memory Update
            {
                let mut lock = state_for_collector.write().unwrap();
                *lock = Some(snapshot.clone());
            }

            // Service Events
            for service in &snapshot.services {
                let current_status = service.status.clone();
                if let Some(old_status) = previous_services.get(&service.name) {
                    if *old_status != current_status {
                        tracing::warn!("Service {} changed: {} -> {}", service.name, old_status, current_status);
                        
                        let _ = save_service_event(&pool_for_collector, &service.name, &current_status).await;
                        
                        let level = if current_status == "active" { "info" } else { "warning" };
                        let msg = format!("Service '{}' changed status to: {}", service.name, current_status);
                        let _ = save_system_log(&pool_for_collector, level, &msg).await;
                    }
                }
                previous_services.insert(service.name.clone(), current_status);
            }

            // Periodic Save
            if last_metrics_save.elapsed() >= Duration::from_secs(60) {
                let _ = save_metrics(&pool_for_collector, snapshot.cpu_usage, snapshot.uptime).await;
                last_metrics_save = Instant::now();
            }

            // Pruning
            if last_prune.elapsed() >= Duration::from_secs(3600) {
                let _ = prune_old_data(&pool_for_collector).await;
                last_prune = Instant::now();
            }

            sleep(Duration::from_secs(5)).await;
        }
    });

    // 5. Axum Router
    let app = Router::new()
        .route("/api/metrics", get(get_metrics))
        .route("/api/logs", get(get_logs))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // 6. Start Server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("API Server running on http://{}", listener.local_addr()?);
    
    axum::serve(listener, app).await?;

    Ok(())
}