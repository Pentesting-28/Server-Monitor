use sysinfo::{System, Networks, Components, Disks};
use crate::models::metrics::{
    SystemSnapshot,
    NetworkMetrics,
    ThermalMetrics,
    StorageMetrics
};
use chrono::Utc;

pub fn collect_system_data() -> SystemSnapshot {
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime = System::uptime();

    let mut networks = Networks::new_with_refreshed_list();
    networks.refresh(false); 
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

    let mut components = Components::new_with_refreshed_list();
    components.refresh(false);
    let mut thermal_metrics: Vec<ThermalMetrics> = Vec::new();

    for component in &components {
        thermal_metrics.push(ThermalMetrics {
            label: component.label().to_string(),
            temperature: component.temperature().unwrap_or(0.0),
        });
    }

    let disks = Disks::new_with_refreshed_list();
    let mut storage_metrics = Vec::new();

    for disk in &disks {
        let total = disk.total_space();
        let available = disk.available_space();
        storage_metrics.push(StorageMetrics {
            name: disk.name().to_string_lossy().into_owned(),
            mount_point: disk.mount_point().to_string_lossy().into_owned(),
            total_space: total,
            available_space: available,
            used_space: total.saturating_sub(available),
        });
    }

    SystemSnapshot{
        hostname,
        uptime,
        network: network_metrics,
        temperatures: thermal_metrics,
        storage: storage_metrics,
        timestamp: Utc::now().timestamp(),
    }
}