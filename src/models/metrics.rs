use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkMetrics {
    pub interface: String,
    pub rx_packets: u64,
    pub tx_packets: u64,
    pub rx_errors: u64,
    pub tx_errors: u64,
    pub collisions: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThermalMetrics {
    pub label: String,
    pub temperature: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageMetrics {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub used_space: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ServiceStatus {
    pub name: String,
    pub status: String, // "active", "inactive", "failed"
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemSnapshot {
    pub hostname: String,
    pub uptime: u64,
    pub cpu_usage: f32,
    pub network: Vec<NetworkMetrics>,
    pub temperatures: Vec<ThermalMetrics>,
    pub storage: Vec<StorageMetrics>,
    pub services: Vec<ServiceStatus>,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, sqlx::FromRow)]
pub struct LogEntry {
    pub id: i64,
    pub level: String,
    pub message: String,
    pub timestamp: String,
}
