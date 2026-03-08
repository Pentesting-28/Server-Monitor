mod api;
mod collector;
mod logs;
mod models;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting server monitor");
}