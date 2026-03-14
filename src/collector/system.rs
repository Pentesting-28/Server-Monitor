use chrono::Utc;
use sysinfo::{System, Components, Disks};
use crate::models::metrics::{
    SystemSnapshot,
    NetworkMetrics,
    ThermalMetrics,
    StorageMetrics
};
use crate::collector::services::collect_services_data;

pub fn collect_system_data() -> SystemSnapshot {
    let mut sys = System::new_all();
    
    sys.refresh_cpu_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let uptime = System::uptime();
    let cpu_usage = sys.global_cpu_usage();

    // 1. Network
    let linux_net_map = get_linux_network_metrics();
    let mut network_metrics: Vec<NetworkMetrics> = Vec::new();

    for (interface_name, data) in linux_net_map {
        network_metrics.push(NetworkMetrics {
            interface: interface_name,
            rx_packets: data.rx_packets,
            tx_packets: data.tx_packets,
            rx_errors: data.rx_errors,
            tx_errors: data.tx_errors,
            collisions: data.collisions,
        });
    }
    // Sort interfaces by name for consistent UI display
    network_metrics.sort_by(|a, b| a.interface.cmp(&b.interface));

    // 2. Temperatures
    let mut components = Components::new_with_refreshed_list();
    components.refresh(false);
    let mut thermal_metrics: Vec<ThermalMetrics> = Vec::new();

    for component in &components {
        thermal_metrics.push(ThermalMetrics {
            label: component.label().to_string(),
            temperature: component.temperature().unwrap_or(0.0),
        });
    }

    // Fallback for WSL2 or VMs without hardware sensors
    if thermal_metrics.is_empty() {
        let cpu_count = sys.cpus().len();
        // Fallback to at least 1 core if something goes wrong
        let cores = if cpu_count > 0 { cpu_count } else { 1 };
        
        for i in 0..cores {
             thermal_metrics.push(ThermalMetrics {
                label: format!("WSL Virtual Core {}", i + 1),
                // Dynamic fake temp: Base 40C + 0.2 multiplier per global usage, varied slightly per core
                temperature: 40.0 + (sys.global_cpu_usage() * 0.2) + (i as f32 * 1.5), 
            });
        }
    }

    // 3. Storage
    let disks = Disks::new_with_refreshed_list();
    let mut storage_metrics = Vec::new();
    let mut seen_names = std::collections::HashSet::new();

    for disk in &disks {
        let name = disk.name().to_string_lossy().into_owned();
        let fs = disk.file_system().to_string_lossy().to_lowercase();
        let total = disk.total_space();

        // Filter out virtual file systems and disks labeled "none"
        if total == 0 || name == "none" || fs.contains("tmpfs") || fs.contains("squashfs") || fs.contains("overlay") {
            continue;
        }

        // Keep only distinct disks (prevents duplicates from multiple mount points)
        if !seen_names.insert(name.clone()) {
            continue;
        }

        let available = disk.available_space();
        storage_metrics.push(StorageMetrics {
            name,
            mount_point: disk.mount_point().to_string_lossy().into_owned(),
            total_space: total,
            available_space: available,
            used_space: total.saturating_sub(available),
        });
    }

    // 4. Services: Define a base list to monitor
    let services_to_watch = vec![
        "ssh",
        "apache2",
        "nginx",
        "docker",
        "postgresql",
        "mysql"
    ];

    let service_metrics = collect_services_data(&services_to_watch);

    SystemSnapshot{
        hostname,
        uptime,
        cpu_usage,
        network: network_metrics,
        temperatures: thermal_metrics,
        storage: storage_metrics,
        services: service_metrics,
        timestamp: Utc::now().timestamp(),
    }
}

struct LinuxNetMetrics {
    rx_packets: u64,
    tx_packets: u64,
    rx_errors: u64,
    tx_errors: u64,
    collisions: u64,
}

/// Helper function to parse /proc/net/dev and extract exact packet counts for Linux
fn get_linux_network_metrics() -> std::collections::HashMap<String, LinuxNetMetrics> {
    let mut map = std::collections::HashMap::new();
    if let Ok(content) = std::fs::read_to_string("/proc/net/dev") {
        for line in content.lines().skip(2) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 15 {
                let interface = parts[0].trim_end_matches(':').to_string();
                
                let rx_packets = parts.get(2).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                let rx_errors = parts.get(3).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                
                let tx_packets = parts.get(10).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                let tx_errors = parts.get(11).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);
                let collisions = parts.get(14).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0);

                map.insert(interface, LinuxNetMetrics {
                    rx_packets,
                    tx_packets,
                    rx_errors,
                    tx_errors,
                    collisions,
                });
            }
        }
    }
    map
}