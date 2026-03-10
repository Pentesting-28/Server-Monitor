use sysinfo::{System, Networks, Components};
use crate::models::metrics::{
    SystemSnapshot,
    NetworkMetrics,
    ThermalMetrics
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

    let components = Components::new_with_refreshed_list();
    let mut thermal_metrics: Vec<ThermalMetrics> = Vec::new();

    for component in &components {
        thermal_metrics.push(ThermalMetrics {
            label: component.label().to_string(),
            temperature: component.temperature().unwrap_or(0.0),
        });
    }

    SystemSnapshot{
        hostname,
        uptime,
        network: network_metrics,
        temperatures: thermal_metrics,
        timestamp: Utc::now().timestamp(),
    }
}