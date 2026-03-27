// ==================== SYSTEM RESOURCES ====================

use crate::system::{get_system_resources, SystemResources};
use tauri::{command, AppHandle};

#[command]
pub async fn get_resources() -> Result<SystemResources, String> {
    get_system_resources().await
}

// ==================== FILE WATCHING ====================

use crate::file_watcher::FileWatcher;
use std::sync::Mutex;
use tauri::Window;

#[command]
pub fn start_file_watching(
    window: Window,
    state: tauri::State<'_, FileWatcherState>,
    path: String,
) -> Result<(), String> {
    let mut watcher = state.watcher.lock().map_err(|e| e.to_string())?;
    watcher.watch_directory(window, path)
}

#[command]
pub fn stop_file_watching(
    state: tauri::State<'_, FileWatcherState>,
) -> Result<(), String> {
    let mut watcher = state.watcher.lock().map_err(|e| e.to_string())?;
    watcher.stop_watching();
    Ok(())
}

pub struct FileWatcherState {
    pub watcher: Mutex<FileWatcher>,
}

// ==================== STREAMING OLLAMA ====================

use crate::streaming::{GenerationRequest, StreamingOllamaClient};

#[command]
pub async fn ollama_generate_stream(
    window: Window,
    model: String,
    prompt: String,
    system: Option<String>,
) -> Result<(), String> {
    let client = StreamingOllamaClient::new();
    let request = GenerationRequest {
        model,
        prompt,
        system,
        stream: true,
    };
    
    client.generate_stream(window, request).await
}

// ==================== GLOBAL HOTKEYS ====================

#[command]
pub async fn register_global_hotkey(
    shortcut: String,
    command_id: String,
) -> Result<(), String> {
    println!("Registering hotkey: {} -> {}", shortcut, command_id);
    Ok(())
}

// ==================== TERMINAL / COMMAND EXECUTION ====================

use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[derive(serde::Serialize)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

#[command]
pub async fn execute_command(
    cmd: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<CommandOutput, String> {
    let mut command = TokioCommand::new(&cmd);
    command.args(&args);
    
    if let Some(dir) = cwd {
        command.current_dir(dir);
    }
    
    let output = command
        .output()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[command]
pub async fn execute_command_streaming(
    window: Window,
    cmd: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<(), String> {
    let mut command = TokioCommand::new(&cmd);
    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());
    
    if let Some(dir) = cwd {
        command.current_dir(dir);
    }
    
    let mut child = command.spawn().map_err(|e| e.to_string())?;
    
    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    
    let stdout_reader = BufReader::new(stdout);
    let stderr_reader = BufReader::new(stderr);
    
    let window_clone = window.clone();
    
    // Spawn stdout reader
    tokio::spawn(async move {
        let mut lines = stdout_reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = window_clone.emit("terminal-output", serde_json::json!({
                "stream": "stdout",
                "data": line
            }));
        }
    });
    
    // Spawn stderr reader
    tokio::spawn(async move {
        let mut lines = stderr_reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = window.emit("terminal-output", serde_json::json!({
                "stream": "stderr",
                "data": line
            }));
        }
    });
    
    Ok(())
}
