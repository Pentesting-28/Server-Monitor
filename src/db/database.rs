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

    tracing::info!("Database initialized");
    Ok(pool)
}
