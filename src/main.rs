// Import modules
mod api;
mod collector;
mod db;
mod models;

// Import functions
use collector::system::collect_system_data;
use db::database::init_db;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    tracing_subscriber::fmt::init();
    tracing::info!("Starting server monitor");
    tracing::info!("Initializing database...");

    let db_url = "sqlite:monitor.db?mode=rwc";
    let _pool = init_db(db_url).await?;
    
    tracing::info!("Database initialized successfully");

    let snapshot = collect_system_data();
    tracing::info!("Snapshot Collector: {:?}", snapshot);

    Ok(())
}