use sysinfo::{System, Networks};
use crate::models::metrics::{
    SystemSnapshot,
    NetworkMetrics,
    // ThermalMetrics
};
use chrono::Utc;

pub fn collect_system_data() -> SystemSnapshot {
    let mut sys = System::new_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime = System::uptime();
    let networks = Networks::new_with_refreshed_list();
    let mut network_metrics: Vec<NetworkMetrics> = Vec::new();
    for (interface_name, data) in networks.iter() {
        network_metrics.push(NetworkMetrics {
            interface: interface_name.clone(),
            rx_packets: data.packets_received(),
            tx_packets: data.packets_transmitted(),
            rx_errors: data.errors_on_received(),
            tx_errors: data.errors_on_transmitted(),
            collisions: 0,
        });
    }

    SystemSnapshot{
        hostname,
        uptime,
        network: network_metrics,
        temperatures: Vec::new(),
        timestamp: Utc::now().timestamp(),
    }
}