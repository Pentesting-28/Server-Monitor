use sysinfo::{System};
use crate::models::metrics::{
    SystemSnapshot,
    // NetworkMetrics,
    // ThermalMetrics
};
use chrono::Utc;

pub fn collect_system_data() -> SystemSnapshot {
    let mut sys = System::new_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime = System::uptime();

    SystemSnapshot{
        hostname,
        uptime,
        network: Vec::new(),
        temperatures: Vec::new(),
        timestamp: Utc::now().timestamp(),
    }
}