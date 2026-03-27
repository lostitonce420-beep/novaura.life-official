use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{command, AppHandle};
use crate::AppState;

// ==================== FILE SYSTEM COMMANDS ====================

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
    modified: Option<String>,
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    
    for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        let modified = metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs().to_string());
        
        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: if metadata.is_file() { Some(metadata.len()) } else { None },
            modified,
        });
    }
    
    Ok(entries)
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

// ==================== APP DATA COMMANDS ====================

#[command]
pub async fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    app.path_resolver()
        .app_data_dir()
        .ok_or("Could not get app data dir".to_string())
        .map(|p| p.to_string_lossy().to_string())
}

// ==================== NOTIFICATION COMMANDS ====================

#[command]
pub async fn show_notification(title: String, body: String) -> Result<(), String> {
    notify_rust::Notification::new()
        .summary(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ==================== ENGRAM (MEMORY) COMMANDS ====================

use crate::database::Engram;

#[command]
pub async fn store_engram(
    state: tauri::State<'_, AppState>,
    content: String,
    category: String,
    tags: Vec<String>,
    context: Option<String>,
    confidence: Option<f32>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let engram = db.store_engram(content, category, tags, context, confidence)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(engram.id)
}

#[command]
pub async fn search_engrams(
    state: tauri::State<'_, AppState>,
    query: String,
    category: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<Engram>, String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db.search_engrams(&query, category.as_deref(), limit.unwrap_or(10))
        .map_err(|e: rusqlite::Error| e.to_string())
}

#[command]
pub async fn get_engram_by_id(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<Engram>, String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db.get_engram(&id).map_err(|e: rusqlite::Error| e.to_string())
}

#[command]
pub async fn delete_engram(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db.delete_engram(&id).map_err(|e: rusqlite::Error| e.to_string())
}

#[command]
pub async fn update_engram_weight(
    state: tauri::State<'_, AppState>,
    id: String,
    weight: f32,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db.update_engram_weight(&id, weight).map_err(|e: rusqlite::Error| e.to_string())
}

#[derive(Serialize)]
pub struct EngramStats {
    pub total: i64,
    pub by_category: Vec<(String, i64)>,
}

#[command]
pub async fn get_engram_stats(
    state: tauri::State<'_, AppState>,
) -> Result<EngramStats, String> {
    let db = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let stats = db.get_engram_stats().map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(stats)
}

// ==================== OLLAMA (LOCAL AI) COMMANDS ====================

use crate::ollama::{OllamaClient, GenerationRequest, ChatRequest};

fn get_ollama_client() -> OllamaClient {
    OllamaClient::new()
}

#[command]
pub async fn ollama_generate(
    model: String,
    prompt: String,
    system: Option<String>,
) -> Result<String, String> {
    let request = GenerationRequest {
        model,
        prompt,
        system,
        stream: Some(false),
    };
    
    get_ollama_client().generate(request).await.map_err(|e: reqwest::Error| e.to_string())
}

#[command]
pub async fn ollama_chat(
    model: String,
    messages: Vec<serde_json::Value>,
) -> Result<String, String> {
    let request = ChatRequest {
        model,
        messages,
        stream: Some(false),
    };
    
    get_ollama_client().chat(request).await.map_err(|e: reqwest::Error| e.to_string())
}

#[derive(Serialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: String,
    pub modified: String,
}

#[command]
pub async fn ollama_list_models() -> Result<Vec<OllamaModel>, String> {
    get_ollama_client().list_models().await.map_err(|e: reqwest::Error| e.to_string())
}

#[command]
pub async fn check_ollama_status() -> Result<bool, String> {
    get_ollama_client().is_running().await.map_err(|e: reqwest::Error| e.to_string())
}

// ==================== SYSTEM COMMANDS ====================

#[derive(Serialize)]
pub struct SystemInfo {
    os: String,
    arch: String,
    version: String,
    app_version: String,
}

#[command]
pub async fn get_system_info(app: AppHandle) -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: app.package_info().version.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
