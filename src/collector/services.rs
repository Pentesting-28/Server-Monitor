use std::process::Command;
use crate::models::metrics::ServiceStatus;

pub fn check_service_status(service_name: &str) -> ServiceStatus {

    let output = Command::new("systemctl")
        .arg("is-active")
        .arg(service_name)
        .output();

    match output {
        Ok(out) => {
            let status_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
            ServiceStatus {
                name: service_name.to_string(),
                is_active: status_str == "active",
                status: status_str,
            }
        }
        Err(_) => ServiceStatus {
            name: service_name.to_string(),
            is_active: false,
            status: "unknown".to_string(),
        },
    }
}

pub fn collect_services_data(services: &[&str]) -> Vec<ServiceStatus> {
    services
        .iter()
        .map(|&name| check_service_status(name))
        .collect()
}
