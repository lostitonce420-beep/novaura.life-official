use std::path::PathBuf;
use chrono::Utc;

pub struct SessionManager {
    session_file: PathBuf,
}

impl SessionManager {
    pub fn new(data_dir: &PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let session_file = data_dir.join("session.json");
        
        Ok(Self { session_file })
    }
    
    pub fn save(&self, session_data: &serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
        let session_with_timestamp = serde_json::json!({
            "data": session_data,
            "saved_at": Utc::now().to_rfc3339(),
        });
        
        std::fs::write(&self.session_file, session_with_timestamp.to_string())?;
        Ok(())
    }
    
    pub fn load(&self) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
        if !self.session_file.exists() {
            return Ok(None);
        }
        
        let content = std::fs::read_to_string(&self.session_file)?;
        let session: serde_json::Value = serde_json::from_str(&content)?;
        
        Ok(Some(session))
    }
    
    pub fn clear(&self) -> Result<(), Box<dyn std::error::Error>> {
        if self.session_file.exists() {
            std::fs::remove_file(&self.session_file)?;
        }
        Ok(())
    }
    
    pub fn save_window_state(
        &self,
        width: u32,
        height: u32,
        x: i32,
        y: i32,
        maximized: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let state = serde_json::json!({
            "width": width,
            "height": height,
            "x": x,
            "y": y,
            "maximized": maximized,
            "timestamp": Utc::now().to_rfc3339(),
        });
        
        std::fs::write(&self.session_file, state.to_string())?;
        Ok(())
    }
    
    pub fn load_window_state(&self) -> Result<Option<WindowState>, Box<dyn std::error::Error>> {
        if !self.session_file.exists() {
            return Ok(None);
        }
        
        let content = std::fs::read_to_string(&self.session_file)?;
        let state: serde_json::Value = serde_json::from_str(&content)?;
        
        Ok(Some(WindowState {
            width: state.get("width").and_then(|v| v.as_u64()).unwrap_or(1200) as u32,
            height: state.get("height").and_then(|v| v.as_u64()).unwrap_or(800) as u32,
            x: state.get("x").and_then(|v| v.as_i64()).unwrap_or(100) as i32,
            y: state.get("y").and_then(|v| v.as_i64()).unwrap_or(100) as i32,
            maximized: state.get("maximized").and_then(|v| v.as_bool()).unwrap_or(false),
        }))
    }
}

pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub maximized: bool,
}

// Session data structures for the Web OS
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DesktopSession {
    pub open_windows: Vec<WindowData>,
    pub active_window_id: Option<String>,
    pub desktop_items: Vec<DesktopItem>,
    pub theme: String,
    pub taskbar_config: TaskbarConfig,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WindowData {
    pub id: String,
    pub app_id: String,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub minimized: bool,
    pub maximized: bool,
    pub state: serde_json::Value, // App-specific state
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DesktopItem {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub x: i32,
    pub y: i32,
    pub is_folder: bool,
    pub target_path: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskbarConfig {
    pub pinned_apps: Vec<String>,
    pub position: String, // "bottom", "top", "left", "right"
    pub auto_hide: bool,
    pub show_labels: bool,
}

impl Default for DesktopSession {
    fn default() -> Self {
        Self {
            open_windows: Vec::new(),
            active_window_id: None,
            desktop_items: Vec::new(),
            theme: "cosmic".to_string(),
            taskbar_config: TaskbarConfig::default(),
        }
    }
}

impl Default for TaskbarConfig {
    fn default() -> Self {
        Self {
            pinned_apps: vec![
                "browser".to_string(),
                "editor".to_string(),
                "terminal".to_string(),
                "ai-assistant".to_string(),
            ],
            position: "bottom".to_string(),
            auto_hide: false,
            show_labels: true,
        }
    }
}
