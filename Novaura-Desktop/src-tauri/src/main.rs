// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};
use std::sync::Mutex;

// Commands module
mod commands {
    use serde::Serialize;
    use std::fs;
    use tauri::{command, AppHandle};
    use crate::AppState;

    #[derive(Serialize)]
    pub struct FileEntry {
        pub name: String,
        pub path: String,
        pub is_dir: bool,
        pub size: Option<u64>,
        pub modified: Option<String>,
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
        let path = std::path::Path::new(&path);
        if path.is_dir() {
            fs::remove_dir_all(path).map_err(|e| e.to_string())
        } else {
            fs::remove_file(path).map_err(|e| e.to_string())
        }
    }

    #[command]
    pub async fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
        app.path_resolver()
            .app_data_dir()
            .ok_or("Could not get app data dir".to_string())
            .map(|p| p.to_string_lossy().to_string())
    }

    #[command]
    pub async fn show_notification(title: String, body: String) -> Result<(), String> {
        notify_rust::Notification::new()
            .summary(&title)
            .body(&body)
            .show()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[derive(Serialize)]
    pub struct SystemInfo {
        pub os: String,
        pub arch: String,
        pub version: String,
        pub app_version: String,
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
}

// AppState
pub struct AppState;

fn main() {
    let quit = CustomMenuItem::new("quit", "Quit");
    let hide = CustomMenuItem::new("hide", "Hide");
    let tray_menu = SystemTrayMenu::new().add_item(quit).add_item(hide);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState)
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => std::process::exit(0),
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::list_directory,
            commands::create_directory,
            commands::delete_file,
            commands::get_app_data_dir,
            commands::show_notification,
            commands::get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
