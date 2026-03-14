use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::error::Error;

pub async fn init_db(db_url: &str) -> Result<SqlitePool, Box<dyn Error>> {

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS metrics_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cpu_usage REAL NOT NULL,
            uptime INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS service_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_name TEXT NOT NULL,
            status TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await?;

    tracing::info!("Database initialized and tables verified");
    Ok(pool)
}

pub async fn save_metrics(pool: &SqlitePool, cpu: f32, uptime: u64) -> Result<(), Box<dyn Error>> {
    sqlx::query("INSERT INTO metrics_history (cpu_usage, uptime) VALUES (?, ?)")
        .bind(cpu)
        .bind(uptime as i64)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn save_service_event(pool: &SqlitePool, name: &str, status: &str) -> Result<(), Box<dyn Error>> {
    sqlx::query("INSERT INTO service_history (service_name, status) VALUES (?, ?)")
        .bind(name)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn prune_old_data(pool: &SqlitePool) -> Result<(), Box<dyn Error>> {
    sqlx::query("DELETE FROM metrics_history WHERE timestamp < datetime('now', '-24 hours')")
        .execute(pool)
        .await?;
    
    sqlx::query("DELETE FROM service_history WHERE timestamp < datetime('now', '-24 hours')")
        .execute(pool)
        .await?;

    tracing::info!("Database pruning completed");
    Ok(())
}
