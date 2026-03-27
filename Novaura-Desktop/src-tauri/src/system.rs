use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize, Deserialize)]
pub struct SystemResources {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub memory_percent: f32,
    pub disk_used: u64,
    pub disk_total: u64,
    pub disk_percent: f32,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub memory_mb: u64,
}

// Get system resources using sysinfo or platform-specific commands
pub async fn get_system_resources() -> Result<SystemResources, String> {
    #[cfg(target_os = "windows")]
    {
        get_windows_resources().await
    }
    #[cfg(target_os = "macos")]
    {
        get_macos_resources().await
    }
    #[cfg(target_os = "linux")]
    {
        get_linux_resources().await
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[cfg(target_os = "windows")]
async fn get_windows_resources() -> Result<SystemResources, String> {
    // Get memory info
    let memory_output = Command::new("wmic")
        .args(["ComputerSystem", "get", "TotalPhysicalMemory", "/value"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let memory_str = String::from_utf8_lossy(&memory_output.stdout);
    let memory_total: u64 = memory_str
        .lines()
        .find(|l| l.contains("TotalPhysicalMemory"))
        .and_then(|l| l.split('=').nth(1))
        .and_then(|v| v.trim().parse().ok())
        .unwrap_or(0);

    // Get CPU usage (simplified)
    let cpu_output = Command::new("wmic")
        .args(["cpu", "get", "loadpercentage", "/value"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let cpu_str = String::from_utf8_lossy(&cpu_output.stdout);
    let cpu_usage: f32 = cpu_str
        .lines()
        .find(|l| l.contains("LoadPercentage"))
        .and_then(|l| l.split('=').nth(1))
        .and_then(|v| v.trim().parse().ok())
        .unwrap_or(0.0);

    // Get disk info
    let disk_output = Command::new("wmic")
        .args(["logicaldisk", "get", "size,freespace,caption", "/format:csv"])
        .output()
        .map_err(|e| e.to_string())?;

    let mut disk_total = 0u64;
    let mut disk_free = 0u64;

    for line in String::from_utf8_lossy(&disk_output.stdout).lines().skip(1) {
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 4 {
            if let (Ok(free), Ok(total)) = (parts[2].parse::<u64>(), parts[3].parse::<u64>()) {
                if total > 0 {
                    disk_free += free;
                    disk_total += total;
                }
            }
        }
    }

    let disk_used = disk_total.saturating_sub(disk_free);
    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    Ok(SystemResources {
        cpu_usage,
        memory_used: memory_total / 2, // Estimate
        memory_total,
        memory_percent: 50.0,
        disk_used,
        disk_total,
        disk_percent,
    })
}

#[cfg(target_os = "macos")]
async fn get_macos_resources() -> Result<SystemResources, String> {
    // Get memory info using vm_stat
    let vm_output = Command::new("vm_stat")
        .output()
        .map_err(|e| e.to_string())?;
    
    let vm_str = String::from_utf8_lossy(&vm_output.stdout);
    
    // Parse vm_stat output
    let page_size = 4096u64;
    let mut memory_used = 0u64;
    
    for line in vm_str.lines() {
        if line.contains("Pages active") {
            if let Some(val) = line.split(':').nth(1) {
                if let Ok(pages) = val.trim().trim_end_matches('.').parse::<u64>() {
                    memory_used += pages * page_size;
                }
            }
        }
    }

    // Get total memory
    let mem_output = Command::new("sysctl")
        .args(["-n", "hw.memsize"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let memory_total: u64 = String::from_utf8_lossy(&mem_output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);

    // Get CPU usage
    let cpu_output = Command::new("top")
        .args(["-l", "1", "-n", "0"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let cpu_str = String::from_utf8_lossy(&cpu_output.stdout);
    let mut cpu_usage = 0.0f32;
    
    for line in cpu_str.lines() {
        if line.contains("CPU usage") {
            if let Some(user_idx) = line.find("user") {
                if let Ok(usage) = line[..user_idx].trim().parse::<f32>() {
                    cpu_usage = usage;
                }
            }
        }
    }

    // Get disk info
    let disk_output = Command::new("df")
        .args(["-k", "/"])
        .output()
        .map_err(|e| e.to_string())?;

    let disk_str = String::from_utf8_lossy(&disk_output.stdout);
    let mut disk_total = 0u64;
    let mut disk_used = 0u64;

    for line in disk_str.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 6 {
            if let (Ok(total), Ok(used)) = (parts[1].parse::<u64>(), parts[2].parse::<u64>()) {
                disk_total = total * 1024;
                disk_used = used * 1024;
            }
        }
    }

    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    Ok(SystemResources {
        cpu_usage,
        memory_used,
        memory_total,
        memory_percent,
        disk_used,
        disk_total,
        disk_percent,
    })
}

#[cfg(target_os = "linux")]
async fn get_linux_resources() -> Result<SystemResources, String> {
    // Read /proc/meminfo
    let meminfo = std::fs::read_to_string("/proc/meminfo")
        .map_err(|e| e.to_string())?;
    
    let mut memory_total = 0u64;
    let mut memory_free = 0u64;
    
    for line in meminfo.lines() {
        if line.starts_with("MemTotal:") {
            memory_total = parse_kb(line);
        } else if line.starts_with("MemAvailable:") {
            memory_free = parse_kb(line);
        }
    }

    let memory_used = memory_total.saturating_sub(memory_free);

    // Read /proc/stat for CPU
    let stat = std::fs::read_to_string("/proc/stat")
        .map_err(|e| e.to_string())?;
    
    let cpu_usage = 0.0f32; // Would need calculation over time

    // Get disk info using df
    let disk_output = Command::new("df")
        .args(["-B1", "/"])
        .output()
        .map_err(|e| e.to_string())?;

    let disk_str = String::from_utf8_lossy(&disk_output.stdout);
    let mut disk_total = 0u64;
    let mut disk_used = 0u64;

    for line in disk_str.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 6 {
            if let (Ok(total), Ok(used)) = (parts[1].parse::<u64>(), parts[2].parse::<u64>()) {
                disk_total = total;
                disk_used = used;
            }
        }
    }

    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    Ok(SystemResources {
        cpu_usage,
        memory_used: memory_used * 1024,
        memory_total: memory_total * 1024,
        memory_percent,
        disk_used,
        disk_total,
        disk_percent,
    })
}

#[cfg(target_os = "linux")]
fn parse_kb(line: &str) -> u64 {
    line.split_whitespace()
        .nth(1)
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
}
