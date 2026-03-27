// Novaura Portable - Desktop EXE with local storage
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem, WindowEvent};
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use chrono::Utc;

mod storage;
mod session;
mod backup;
mod context;

use storage::StorageManager;
use session::SessionManager;
use context::ContextManager;

// Global app state
pub struct AppState {
    storage: Arc<Mutex<StorageManager>>,
    session: Arc<Mutex<SessionManager>>,
    context: Arc<Mutex<ContextManager>>,
    app_dir: PathBuf,
}

fn main() {
    // Initialize system tray
    let quit = CustomMenuItem::new("quit", "Quit");
    let hide = CustomMenuItem::new("hide", "Hide");
    let show = CustomMenuItem::new("show", "Show");
    let backup_now = CustomMenuItem::new("backup", "Backup Now");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(backup_now)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .setup(|app| {
            // Get or create app data directory
            let app_dir = get_app_dir(app);
            std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");
            
            println!("📁 Novaura Portable");
            println!("💾 Data directory: {:?}", app_dir);
            
            // Initialize storage managers
            let storage = Arc::new(Mutex::new(
                StorageManager::new(&app_dir).expect("Failed to initialize storage")
            ));
            
            let session = Arc::new(Mutex::new(
                SessionManager::new(&app_dir).expect("Failed to initialize session manager")
            ));
            
            let context = Arc::new(Mutex::new(
                ContextManager::new(&app_dir).expect("Failed to initialize context manager")
            ));
            
            // Create project directories
            let projects_dir = app_dir.join("projects");
            let backups_dir = app_dir.join("backups");
            let downloads_dir = app_dir.join("downloads");
            
            std::fs::create_dir_all(&projects_dir).unwrap();
            std::fs::create_dir_all(&backups_dir).unwrap();
            std::fs::create_dir_all(&downloads_dir).unwrap();
            
            // Manage state
            app.manage(AppState {
                storage,
                session,
                context,
                app_dir: app_dir.clone(),
            });
            
            // Start auto-save timer
            let app_handle = app.handle();
            start_autosave_timer(app_handle);
            
            // Load previous session if exists
            if let Some(window) = app.get_window("main") {
                load_previous_session(&window, &app_dir);
            }
            
            Ok(())
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    save_session_before_exit(app);
                    std::process::exit(0);
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        window.hide().unwrap();
                    }
                }
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                "backup" => {
                    if let Some(state) = app.try_state::<AppState>() {
                        let storage = state.storage.lock().unwrap();
                        match storage.create_backup() {
                            Ok(path) => println!("✅ Backup created: {:?}", path),
                            Err(e) => eprintln!("❌ Backup failed: {}", e),
                        }
                    }
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                // Save session before closing
                save_window_session(event.window());
                
                // Hide to tray instead of closing
                event.window().hide().unwrap();
                api.prevent_close();
            }
            WindowEvent::Resized { .. } | WindowEvent::Moved { .. } => {
                // Auto-save window position/size
                save_window_session(event.window());
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            // Session management
            save_session,
            load_session,
            clear_session,
            
            // Context/AI storage
            save_conversation,
            load_conversations,
            get_conversation_context,
            delete_conversation,
            append_to_context,
            get_context_window,
            clear_context,
            
            // Backup management
            create_backup,
            list_backups,
            restore_backup,
            delete_backup,
            
            // File operations
            read_file,
            write_file,
            list_directory,
            create_directory,
            delete_path,
            
            // Project management
            save_project,
            load_project,
            list_projects,
            delete_project,
            export_project,
            import_project,
            
            // Storage info
            get_storage_stats,
            get_app_directory,
            
            // Auto-save settings
            set_autosave_interval,
            get_autosave_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Novaura Portable");
}

fn get_app_dir(app: &tauri::App) -> PathBuf {
    // Check for portable mode (data in same folder as EXE)
    if std::env::args().any(|arg| arg == "--portable") {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                return exe_dir.join("NovauraData");
            }
        }
    }
    
    // Default: use app data directory
    app.path_resolver()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("NovauraPortable")
}

fn start_autosave_timer(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(300)); // 5 minutes
            
            if let Some(state) = app_handle.try_state::<AppState>() {
                let storage = state.storage.lock().unwrap();
                
                // Auto-save open projects
                if let Err(e) = storage.auto_save_projects() {
                    eprintln!("❌ Auto-save failed: {}", e);
                } else {
                    println!("✅ Auto-save completed at {}", Utc::now());
                }
            }
        }
    });
}

fn load_previous_session(window: &tauri::Window, app_dir: &PathBuf) {
    let session_file = app_dir.join("session.json");
    
    if session_file.exists() {
        if let Ok(content) = std::fs::read_to_string(&session_file) {
            if let Ok(session) = serde_json::from_str::<serde_json::Value>(&content) {
                // Restore window size/position
                if let Some(width) = session.get("width").and_then(|v| v.as_u64()) {
                    if let Some(height) = session.get("height").and_then(|v| v.as_u64()) {
                        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                            width: width as u32,
                            height: height as u32,
                        }));
                    }
                }
                
                if let Some(x) = session.get("x").and_then(|v| v.as_i64()) {
                    if let Some(y) = session.get("y").and_then(|v| v.as_i64()) {
                        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                            x: x as i32,
                            y: y as i32,
                        }));
                    }
                }
                
                println!("✅ Previous session restored");
            }
        }
    }
}

fn save_window_session(window: &tauri::Window) {
    if let Ok(size) = window.inner_size() {
        if let Ok(position) = window.outer_position() {
            let session = serde_json::json!({
                "width": size.width,
                "height": size.height,
                "x": position.x,
                "y": position.y,
                "timestamp": Utc::now().to_rfc3339(),
            });
            
            if let Ok(app_dir) = window.app_handle().path_resolver().app_data_dir() {
                let session_file = app_dir.join("NovauraPortable").join("session.json");
                let _ = std::fs::create_dir_all(session_file.parent().unwrap());
                let _ = std::fs::write(session_file, session.to_string());
            }
        }
    }
}

fn save_session_before_exit(app: &tauri::AppHandle) {
    if let Some(window) = app.get_window("main") {
        save_window_session(&window);
    }
    
    println!("💾 Session saved before exit");
}

// Tauri commands
#[tauri::command]
fn save_session(state: tauri::State<AppState>, session_data: serde_json::Value) -> Result<(), String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    session.save(&session_data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_session(state: tauri::State<AppState>) -> Result<Option<serde_json::Value>, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    session.load().map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_session(state: tauri::State<AppState>) -> Result<(), String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    session.clear().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_conversation(
    state: tauri::State<AppState>,
    id: String,
    title: String,
    messages: Vec<serde_json::Value>,
) -> Result<(), String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.save_conversation(&id, &title, messages).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_conversations(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.list_conversations().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_conversation_context(
    state: tauri::State<AppState>,
    conversation_id: String,
    limit: Option<usize>,
) -> Result<Vec<serde_json::Value>, String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.get_context_window(&conversation_id, limit.unwrap_or(10)).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_conversation(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.delete_conversation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn append_to_context(
    state: tauri::State<AppState>,
    conversation_id: String,
    role: String,
    content: String,
) -> Result<(), String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.append_message(&conversation_id, &role, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_context_window(
    state: tauri::State<AppState>,
    conversation_id: String,
    max_tokens: Option<usize>,
) -> Result<String, String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.build_context_window(&conversation_id, max_tokens.unwrap_or(4000)).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_context(state: tauri::State<AppState>, conversation_id: String) -> Result<(), String> {
    let context = state.context.lock().map_err(|e| e.to_string())?;
    context.clear_conversation(&conversation_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_backup(state: tauri::State<AppState>) -> Result<String, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let path = storage.create_backup().map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_backups(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_backups().map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_backup(state: tauri::State<AppState>, backup_path: String) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.restore_backup(&backup_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_backup(state: tauri::State<AppState>, backup_path: String) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.delete_backup(&backup_path).map_err(|e| e.to_string())
}

// File operations
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<serde_json::Value>, String> {
    let mut entries = Vec::new();
    
    for entry in std::fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        
        entries.push(serde_json::json!({
            "name": entry.file_name().to_string_lossy().to_string(),
            "path": entry.path().to_string_lossy().to_string(),
            "is_dir": metadata.is_dir(),
            "size": metadata.len(),
            "modified": metadata.modified().ok().map(|t| {
                t.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()
            }),
        }));
    }
    
    Ok(entries)
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    if path.is_dir() {
        std::fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(path).map_err(|e| e.to_string())
    }
}

// Project management
#[tauri::command]
fn save_project(
    state: tauri::State<AppState>,
    id: String,
    name: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_project(&id, &name, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_project(state: tauri::State<AppState>, id: String) -> Result<Option<serde_json::Value>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.load_project(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_projects(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_projects().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.delete_project(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_project(state: tauri::State<AppState>, id: String, export_path: String) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.export_project(&id, &export_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_project(state: tauri::State<AppState>, import_path: String) -> Result<String, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.import_project(&import_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_storage_stats(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.get_stats().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_directory(state: tauri::State<AppState>) -> Result<String, String> {
    Ok(state.app_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn set_autosave_interval(minutes: u64) -> Result<(), String> {
    // Store in config
    Ok(())
}

#[tauri::command]
fn get_autosave_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "enabled": true,
        "interval_minutes": 5,
        "last_save": Utc::now().to_rfc3339(),
    }))
}
