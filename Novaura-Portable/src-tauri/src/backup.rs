use std::path::PathBuf;
use chrono::{Utc, Duration};
use std::collections::HashMap;

/// Backup configuration
#[derive(Clone, Debug)]
pub struct BackupConfig {
    /// Auto-backup interval in hours (0 = disabled)
    pub auto_backup_interval: u64,
    /// Maximum number of backups to keep
    pub max_backups: usize,
    /// Include projects in backup
    pub include_projects: bool,
    /// Include conversations in backup
    pub include_conversations: bool,
    /// Include settings in backup
    pub include_settings: bool,
    /// Compress backup
    pub compress: bool,
}

impl Default for BackupConfig {
    fn default() -> Self {
        Self {
            auto_backup_interval: 24, // Daily
            max_backups: 10,
            include_projects: true,
            include_conversations: true,
            include_settings: true,
            compress: true,
        }
    }
}

/// Backup metadata
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct BackupInfo {
    pub id: String,
    pub filename: String,
    pub created_at: String,
    pub size_bytes: u64,
    pub contents: BackupContents,
    pub version: String,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct BackupContents {
    pub projects_count: usize,
    pub conversations_count: usize,
    pub total_messages: usize,
    pub settings_included: bool,
}

/// Backup manager
pub struct BackupManager {
    config: BackupConfig,
    backup_dir: PathBuf,
}

impl BackupManager {
    pub fn new(data_dir: &PathBuf, config: Option<BackupConfig>) -> Self {
        let backup_dir = data_dir.join("backups");
        std::fs::create_dir_all(&backup_dir).unwrap();
        
        Self {
            config: config.unwrap_or_default(),
            backup_dir,
        }
    }
    
    /// Get backup directory path
    pub fn get_backup_dir(&self) -> &PathBuf {
        &self.backup_dir
    }
    
    /// Clean old backups based on retention policy
    pub fn clean_old_backups(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let mut backups = self.list_backups_with_metadata()?;
        
        if backups.len() <= self.config.max_backups {
            return Ok(0);
        }
        
        // Sort by date (oldest first)
        backups.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        
        let to_delete = backups.len() - self.config.max_backups;
        let mut deleted = 0;
        
        for backup in backups.iter().take(to_delete) {
            let path = self.backup_dir.join(&backup.filename);
            if path.exists() {
                std::fs::remove_file(&path)?;
                deleted += 1;
            }
        }
        
        Ok(deleted)
    }
    
    /// List all backups with metadata
    pub fn list_backups_with_metadata(&self) -> Result<Vec<BackupInfo>, Box<dyn std::error::Error>> {
        let mut backups = Vec::new();
        
        for entry in std::fs::read_dir(&self.backup_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if let Some(ext) = path.extension() {
                if ext == "zip" || ext == "backup" {
                    let metadata = entry.metadata()?;
                    let filename = path.file_name().unwrap().to_string_lossy().to_string();
                    
                    // Try to extract metadata from filename or file
                    let info = BackupInfo {
                        id: format!("backup_{}", metadata.modified()?.duration_since(std::time::UNIX_EPOCH)?.as_secs()),
                        filename: filename.clone(),
                        created_at: Utc::now().to_rfc3339(), // Placeholder
                        size_bytes: metadata.len(),
                        contents: BackupContents {
                            projects_count: 0,
                            conversations_count: 0,
                            total_messages: 0,
                            settings_included: true,
                        },
                        version: env!("CARGO_PKG_VERSION").to_string(),
                    };
                    
                    backups.push(info);
                }
            }
        }
        
        // Sort by filename (which contains timestamp)
        backups.sort_by(|a, b| b.filename.cmp(&a.filename));
        
        Ok(backups)
    }
    
    /// Check if auto-backup is due
    pub fn is_backup_due(&self, last_backup: Option<&str>) -> bool {
        if self.config.auto_backup_interval == 0 {
            return false;
        }
        
        let interval = Duration::hours(self.config.auto_backup_interval as i64);
        
        match last_backup {
            None => true,
            Some(timestamp) => {
                if let Ok(last) = chrono::DateTime::parse_from_rfc3339(timestamp) {
                    Utc::now() - last.to_utc() > interval
                } else {
                    true
                }
            }
        }
    }
    
    /// Get storage usage breakdown
    pub fn get_storage_breakdown(&self, data_dir: &PathBuf) -> Result<HashMap<String, u64>, Box<dyn std::error::Error>> {
        let mut breakdown = HashMap::new();
        
        // Calculate sizes
        breakdown.insert("projects".to_string(), self.get_dir_size(&data_dir.join("projects"))?);
        breakdown.insert("conversations".to_string(), self.get_file_size(&data_dir.join("context.db"))?);
        breakdown.insert("session".to_string(), self.get_file_size(&data_dir.join("session.json"))?);
        breakdown.insert("settings".to_string(), self.get_file_size(&data_dir.join("novaura.db"))?);
        breakdown.insert("backups".to_string(), self.get_dir_size(&self.backup_dir)?);
        
        Ok(breakdown)
    }
    
    fn get_dir_size(&self, path: &PathBuf) -> Result<u64, Box<dyn std::error::Error>> {
        let mut total = 0u64;
        if path.exists() {
            for entry in walkdir::WalkDir::new(path) {
                let entry = entry?;
                if entry.file_type().is_file() {
                    total += entry.metadata()?.len();
                }
            }
        }
        Ok(total)
    }
    
    fn get_file_size(&self, path: &PathBuf) -> Result<u64, Box<dyn std::error::Error>> {
        if path.exists() {
            Ok(std::fs::metadata(path)?.len())
        } else {
            Ok(0)
        }
    }
}

/// Export formats
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ExportFormat {
    Json,
    Markdown,
    Html,
    Pdf,
}

impl ExportFormat {
    pub fn extension(&self) -> &'static str {
        match self {
            ExportFormat::Json => "json",
            ExportFormat::Markdown => "md",
            ExportFormat::Html => "html",
            ExportFormat::Pdf => "pdf",
        }
    }
}

/// Export conversation to various formats
pub fn export_conversation(
    conversation: &serde_json::Value,
    format: ExportFormat,
) -> Result<String, Box<dyn std::error::Error>> {
    match format {
        ExportFormat::Json => {
            Ok(serde_json::to_string_pretty(conversation)?)
        }
        ExportFormat::Markdown => {
            let title = conversation.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled");
            let messages = conversation.get("messages").and_then(|v| v.as_array()).unwrap_or(&vec![]);
            
            let mut md = format!("# {}\n\n", title);
            md.push_str(&format!("*Exported from Novaura on {}*\n\n", Utc::now().format("%Y-%m-%d %H:%M")));
            md.push_str("---\n\n");
            
            for msg in messages {
                let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
                let content = msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
                
                let role_label = match role {
                    "user" => "**User**",
                    "assistant" => "**Aura**",
                    "system" => "*System*",
                    _ => role,
                };
                
                md.push_str(&format!("{}: {}\n\n", role_label, content));
            }
            
            Ok(md)
        }
        ExportFormat::Html => {
            let title = conversation.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled");
            let messages = conversation.get("messages").and_then(|v| v.as_array()).unwrap_or(&vec![]);
            
            let mut html = format!(r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{} - Novaura Conversation</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e0e0e0; }}
        .message {{ margin: 16px 0; padding: 12px 16px; border-radius: 8px; }}
        .user {{ background: rgba(0, 217, 255, 0.1); border-left: 3px solid #00d9ff; }}
        .assistant {{ background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; }}
        .system {{ background: rgba(100, 100, 100, 0.1); border-left: 3px solid #666; font-style: italic; }}
        .role {{ font-weight: 600; margin-bottom: 4px; color: #888; font-size: 12px; text-transform: uppercase; }}
        .content {{ line-height: 1.6; white-space: pre-wrap; }}
        header {{ margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #333; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .meta {{ color: #666; font-size: 12px; margin-top: 8px; }}
    </style>
</head>
<body>"#, title);
            
            html.push_str(&format!(r#"<header>
    <h1>{}</h1>
    <div class="meta">Exported from Novaura on {}</div>
</header>"#, title, Utc::now().format("%Y-%m-%d %H:%M UTC")));
            
            for msg in messages {
                let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
                let content = msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
                let created_at = msg.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
                
                html.push_str(&format!(r#"
<div class="message {}">
    <div class="role">{}</div>
    <div class="content">{}</div>
</div>"#, role, role, html_escape(content)));
            }
            
            html.push_str("</body></html>");
            Ok(html)
        }
        ExportFormat::Pdf => {
            // PDF export would require a library like printpdf
            // For now, return an error
            Err("PDF export not yet implemented".into())
        }
    }
}

fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\n', "<br>")
}

/// Sync status tracker
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct SyncStatus {
    pub last_sync: Option<String>,
    pub pending_changes: usize,
    pub sync_enabled: bool,
    pub last_error: Option<String>,
}

impl Default for SyncStatus {
    fn default() -> Self {
        Self {
            last_sync: None,
            pending_changes: 0,
            sync_enabled: false,
            last_error: None,
        }
    }
}
