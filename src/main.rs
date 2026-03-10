// Import modules
mod api;
mod collector;
mod logs;
mod models;

// Import functions
use collector::system::collect_system_data;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting server monitor");
    let snapshot = collect_system_data();
    tracing::info!("Snapshot Collector: {:?}", snapshot);
}