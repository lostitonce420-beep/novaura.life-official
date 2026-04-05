/**
 * AI Terminal Control System
 * Gives AI agents full system-level development capabilities
 */

use std::process::{Command, Stdio};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use serde::{Serialize, Deserialize};
use tauri::{command, AppHandle, Manager};
use regex::Regex;

#[derive(Debug, Serialize, Deserialize)]
pub struct TerminalSession {
    id: String,
    cwd: String,
    env_vars: Vec<(String, String)>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    success: bool,
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
    duration_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    name: String,
    path: String,
    project_type: String, // "node", "python", "rust", "dotnet", etc.
    has_errors: bool,
    error_files: Vec<ErrorInfo>,
    dependencies_ok: bool,
    last_build_success: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorInfo {
    file: String,
    line: u32,
    column: u32,
    message: String,
    severity: String, // "error", "warning", "info"
    suggestion: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuildResult {
    success: bool,
    output: String,
    errors: Vec<ErrorInfo>,
    warnings: Vec<ErrorInfo>,
    artifacts: Vec<String>,
    duration_ms: u64,
}

// Global terminal sessions storage
lazy_static::lazy_static! {
    static ref SESSIONS: Mutex<Vec<TerminalSession>> = Mutex::new(Vec::new());
}

/// Execute a shell command with full output capture
#[command]
pub async fn terminal_execute(
    command: String,
    cwd: Option<String>,
    env_vars: Option<Vec<(String, String)>>,
) -> Result<CommandResult, String> {
    let start = std::time::Instant::now();
    
    // Determine shell based on OS
    let (shell, shell_arg) = if cfg!(target_os = "windows") {
        ("powershell", "-Command")
    } else {
        ("bash", "-c")
    };
    
    let mut cmd = Command::new(shell);
    cmd.arg(shell_arg).arg(&command);
    
    // Set working directory
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    
    // Set environment variables
    if let Some(vars) = env_vars {
        for (key, value) in vars {
            cmd.env(key, value);
        }
    }
    
    // Capture output
    cmd.stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;
    
    let duration = start.elapsed().as_millis() as u64;
    
    Ok(CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
        duration_ms: duration,
    })
}

/// Scan a project for errors based on its type
#[command]
pub async fn project_scan_errors(project_path: String) -> Result<Vec<ErrorInfo>, String> {
    let path = Path::new(&project_path);
    
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }
    
    // Detect project type
    let project_type = detect_project_type(path);
    
    match project_type.as_str() {
        "node" | "vite" | "react" => scan_node_errors(path).await,
        "rust" => scan_rust_errors(path).await,
        "python" => scan_python_errors(path).await,
        "dotnet" => scan_dotnet_errors(path).await,
        _ => Ok(vec![]), // Unknown project type
    }
}

/// Build/compile a project
#[command]
pub async fn project_build(
    project_path: String,
    build_type: Option<String>,
) -> Result<BuildResult, String> {
    let path = Path::new(&project_path);
    let project_type = detect_project_type(path);
    
    let start = std::time::Instant::now();
    
    let (cmd, args): (&str, Vec<&str>) = match project_type.as_str() {
        "node" | "vite" | "react" => ("npm", vec!["run", "build"]),
        "rust" => ("cargo", vec!["build", "--release"]),
        "python" => return python_build(path).await,
        "dotnet" => ("dotnet", vec!["build", "-c", "Release"]),
        _ => return Err("Unknown project type".to_string()),
    };
    
    let output = Command::new(cmd)
        .args(&args)
        .current_dir(path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Build failed: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr);
    
    // Parse errors from output
    let errors = parse_build_errors(&combined, &project_type);
    let warnings = parse_build_warnings(&combined, &project_type);
    
    let duration = start.elapsed().as_millis() as u64;
    
    Ok(BuildResult {
        success: output.status.success(),
        output: combined.clone(),
        errors: errors.clone(),
        warnings,
        artifacts: detect_artifacts(path, &project_type),
        duration_ms: duration,
    })
}

/// Hot-fix an error by applying AI-suggested changes
#[command]
pub async fn project_hotfix(
    project_path: String,
    error: ErrorInfo,
    fix_code: String,
) -> Result<bool, String> {
    let file_path = Path::new(&project_path).join(&error.file);
    
    // Read current file content
    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Apply fix (simple line replacement for now)
    let lines: Vec<&str> = content.lines().collect();
    let mut new_lines = lines.clone();
    
    if error.line as usize <= new_lines.len() {
        // Replace the problematic line with the fix
        new_lines[error.line as usize - 1] = &fix_code;
        
        let new_content = new_lines.join("\n");
        std::fs::write(&file_path, new_content)
            .map_err(|e| format!("Failed to write fix: {}", e))?;
        
        return Ok(true);
    }
    
    Err("Line number out of range".to_string())
}

/// Install dependencies for a project
#[command]
pub async fn project_install_deps(project_path: String) -> Result<CommandResult, String> {
    let path = Path::new(&project_path);
    let project_type = detect_project_type(path);
    
    let (cmd, args): (&str, Vec<&str>) = match project_type.as_str() {
        "node" | "vite" | "react" => ("npm", vec!["install"]),
        "rust" => ("cargo", vec!["fetch"]),
        "python" => ("pip", vec!["install", "-r", "requirements.txt"]),
        "dotnet" => ("dotnet", vec!["restore"]),
        _ => return Err("Unknown project type".to_string()),
    };
    
    let start = std::time::Instant::now();
    
    let output = Command::new(cmd)
        .args(&args)
        .current_dir(path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Install failed: {}", e))?;
    
    Ok(CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

/// Get project information
#[command]
pub async fn project_info(project_path: String) -> Result<ProjectInfo, String> {
    let path = Path::new(&project_path);
    
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }
    
    let project_type = detect_project_type(path);
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    let errors = scan_project_quick(path, &project_type).await?;
    
    Ok(ProjectInfo {
        name,
        path: project_path,
        project_type,
        has_errors: !errors.is_empty(),
        error_files: errors,
        dependencies_ok: check_dependencies(path),
        last_build_success: check_last_build(path),
    })
}

/// List files in project with error indicators
#[command]
pub async fn project_list_files(
    project_path: String,
    include_errors: bool,
) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&project_path);
    let mut files = vec![];
    
    for entry in walkdir::WalkDir::new(path)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let metadata = entry.metadata().ok();
        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        
        files.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir,
            size: metadata.as_ref().filter(|m| m.is_file()).map(|m| m.len()),
            modified: metadata.and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs().to_string()),
            has_errors: false, // Would need to scan
        });
    }
    
    Ok(files)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
    modified: Option<String>,
    has_errors: bool,
}

// Helper functions

fn detect_project_type(path: &Path) -> String {
    if path.join("Cargo.toml").exists() {
        "rust".to_string()
    } else if path.join("package.json").exists() {
        let pkg = std::fs::read_to_string(path.join("package.json")).unwrap_or_default();
        if pkg.contains("vite") { "vite".to_string() }
        else if pkg.contains("react") { "react".to_string() }
        else { "node".to_string() }
    } else if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
        "python".to_string()
    } else if path.join("*.csproj").exists() || path.join("*.sln").exists() {
        "dotnet".to_string()
    } else {
        "unknown".to_string()
    }
}

async fn scan_node_errors(path: &Path) -> Result<Vec<ErrorInfo>, String> {
    // Run TypeScript/ESLint check
    let output = Command::new("npx")
        .args(&["tsc", "--noEmit"])
        .current_dir(path)
        .output();
    
    match output {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            Ok(parse_typescript_errors(&stderr))
        }
        Err(_) => Ok(vec![]),
    }
}

async fn scan_rust_errors(path: &Path) -> Result<Vec<ErrorInfo>, String> {
    let output = Command::new("cargo")
        .args(&["check", "--message-format=short"])
        .current_dir(path)
        .output();
    
    match output {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            Ok(parse_rust_errors(&stderr))
        }
        Err(_) => Ok(vec![]),
    }
}

async fn scan_python_errors(path: &Path) -> Result<Vec<ErrorInfo>, String> {
    // Run flake8 or pylint
    let output = Command::new("python")
        .args(&["-m", "py_compile", "."])
        .current_dir(path)
        .output();
    
    match output {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            Ok(parse_python_errors(&stderr))
        }
        Err(_) => Ok(vec![]),
    }
}

async fn scan_dotnet_errors(path: &Path) -> Result<Vec<ErrorInfo>, String> {
    let output = Command::new("dotnet")
        .args(&["build", "--verbosity=quiet"])
        .current_dir(path)
        .output();
    
    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            Ok(parse_dotnet_errors(&stdout))
        }
        Err(_) => Ok(vec![]),
    }
}

fn parse_typescript_errors(output: &str) -> Vec<ErrorInfo> {
    let re = Regex::new(r"(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+TS(\d+):\s*(.+)$").unwrap();
    
    output.lines()
        .filter_map(|line| {
            re.captures(line).map(|cap| ErrorInfo {
                file: cap[1].to_string(),
                line: cap[2].parse().unwrap_or(0),
                column: cap[3].parse().unwrap_or(0),
                severity: cap[4].to_string(),
                message: cap[6].to_string(),
                suggestion: None,
            })
        })
        .collect()
}

fn parse_rust_errors(output: &str) -> Vec<ErrorInfo> {
    let re = Regex::new(r"error\[E\d+\]:\s*(.+)\s*-->\s*(.+):(\d+):(\d+)").unwrap();
    
    output.lines()
        .filter_map(|line| {
            re.captures(line).map(|cap| ErrorInfo {
                file: cap[2].to_string(),
                line: cap[3].parse().unwrap_or(0),
                column: cap[4].parse().unwrap_or(0),
                severity: "error".to_string(),
                message: cap[1].to_string(),
                suggestion: None,
            })
        })
        .collect()
}

fn parse_python_errors(output: &str) -> Vec<ErrorInfo> {
    // Python error format
    vec![] // Simplified
}

fn parse_dotnet_errors(output: &str) -> Vec<ErrorInfo> {
    vec![] // Simplified
}

fn parse_build_errors(output: &str, project_type: &str) -> Vec<ErrorInfo> {
    match project_type {
        "node" | "vite" | "react" => parse_typescript_errors(output),
        "rust" => parse_rust_errors(output),
        _ => vec![],
    }
}

fn parse_build_warnings(output: &str, _project_type: &str) -> Vec<ErrorInfo> {
    vec![] // Simplified
}

async fn python_build(path: &Path) -> Result<BuildResult, String> {
    // Python doesn't compile, but we can check syntax
    let output = Command::new("python")
        .args(&["-m", "compileall", "-q", "."])
        .current_dir(path)
        .output();
    
    match output {
        Ok(out) => Ok(BuildResult {
            success: out.status.success(),
            output: String::from_utf8_lossy(&out.stdout).to_string(),
            errors: vec![],
            warnings: vec![],
            artifacts: vec![],
            duration_ms: 0,
        }),
        Err(e) => Err(format!("Python build failed: {}", e)),
    }
}

fn detect_artifacts(path: &Path, project_type: &str) -> Vec<String> {
    let artifact_paths = match project_type {
        "node" | "vite" | "react" => vec![path.join("dist"), path.join("build")],
        "rust" => vec![path.join("target").join("release")],
        "dotnet" => vec![path.join("bin").join("Release")],
        _ => vec![],
    };
    
    artifact_paths.iter()
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}

fn check_dependencies(path: &Path) -> bool {
    if path.join("node_modules").exists() {
        true
    } else if path.join("Cargo.lock").exists() {
        true
    } else {
        false
    }
}

fn check_last_build(path: &Path) -> Option<bool> {
    // Check for dist/build folder existence as heuristic
    if path.join("dist").exists() || path.join("build").exists() {
        Some(true)
    } else {
        None
    }
}

async fn scan_project_quick(path: &Path, project_type: &str) -> Result<Vec<ErrorInfo>, String> {
    match project_type {
        "node" => scan_node_errors(path).await,
        "rust" => scan_rust_errors(path).await,
        _ => Ok(vec![]),
    }
}
