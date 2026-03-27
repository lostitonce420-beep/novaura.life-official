use rusqlite::{Connection, params, Result as SqlResult};
use std::path::PathBuf;
use chrono::Utc;
use uuid::Uuid;
use std::collections::HashMap;

pub struct StorageManager {
    db: Connection,
    data_dir: PathBuf,
}

impl StorageManager {
    pub fn new(data_dir: &PathBuf) -> SqlResult<Self> {
        let db_path = data_dir.join("novaura.db");
        let db = Connection::open(db_path)?;
        
        let storage = Self {
            db,
            data_dir: data_dir.clone(),
        };
        
        storage.init_tables()?;
        Ok(storage)
    }
    
    fn init_tables(&self) -> SqlResult<()> {
        // Projects table
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_open BOOLEAN DEFAULT 0,
                last_accessed TEXT
            )",
            [],
        )?;
        
        // Settings table
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?
        ;
        
        // Auto-save snapshots
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // File metadata cache
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS file_cache (
                path TEXT PRIMARY KEY,
                content_hash TEXT,
                last_modified TEXT,
                size INTEGER
            )",
            [],
        )?;
        
        // Create indexes
        self.db.execute(
            "CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at)",
            [],
        )?;
        
        self.db.execute(
            "CREATE INDEX IF NOT EXISTS idx_snapshots_project ON snapshots(project_id, created_at)",
            [],
        )?;
        
        Ok(())
    }
    
    // Project CRUD
    pub fn save_project(&self, id: &str, name: &str, data: serde_json::Value) -> SqlResult<()> {
        let now = Utc::now().to_rfc3339();
        let data_str = serde_json::to_string(&data).unwrap_or_default();
        
        self.db.execute(
            "INSERT INTO projects (id, name, data, created_at, updated_at, is_open, last_accessed)
             VALUES (?1, ?2, ?3, ?4, ?4, 1, ?4)
             ON CONFLICT(id) DO UPDATE SET
             name = ?2,
             data = ?3,
             updated_at = ?4,
             is_open = 1,
             last_accessed = ?4",
            params![id, name, data_str, now],
        )?;
        
        Ok(())
    }
    
    pub fn load_project(&self, id: &str) -> SqlResult<Option<serde_json::Value>> {
        let mut stmt = self.db.prepare(
            "SELECT data, name FROM projects WHERE id = ?1"
        )?;
        
        let result: Option<(String, String)> = stmt.query_row([id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).optional()?;
        
        if let Some((data_str, name)) = result {
            // Update last accessed
            let now = Utc::now().to_rfc3339();
            let _ = self.db.execute(
                "UPDATE projects SET last_accessed = ?1, is_open = 1 WHERE id = ?2",
                params![now, id],
            );
            
            let mut project: serde_json::Value = serde_json::from_str(&data_str).unwrap_or_default();
            if let Some(obj) = project.as_object_mut() {
                obj.insert("name".to_string(), serde_json::json!(name));
                obj.insert("id".to_string(), serde_json::json!(id));
            }
            
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }
    
    pub fn list_projects(&self) -> SqlResult<Vec<serde_json::Value>> {
        let mut stmt = self.db.prepare(
            "SELECT id, name, created_at, updated_at, is_open, last_accessed 
             FROM projects ORDER BY last_accessed DESC NULLS LAST"
        )?;
        
        let projects = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "created_at": row.get::<_, String>(2)?,
                "updated_at": row.get::<_, String>(3)?,
                "is_open": row.get::<_, bool>(4)?,
                "last_accessed": row.get::<_, Option<String>>(5)?,
            }))
        })?;
        
        projects.collect::<Result<Vec<_>, _>>()
    }
    
    pub fn delete_project(&self, id: &str) -> SqlResult<()> {
        // Delete associated snapshots first
        self.db.execute("DELETE FROM snapshots WHERE project_id = ?1", [id])?;
        self.db.execute("DELETE FROM projects WHERE id = ?1", [id])?;
        Ok(())
    }
    
    // Auto-save projects
    pub fn auto_save_projects(&self) -> SqlResult<usize> {
        let mut stmt = self.db.prepare(
            "SELECT id, data FROM projects WHERE is_open = 1"
        )?;
        
        let open_projects: Vec<(String, String)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;
        
        let now = Utc::now().to_rfc3339();
        let mut saved_count = 0;
        
        for (id, data) in open_projects {
            let snapshot_id = Uuid::new_v4().to_string();
            
            // Create snapshot
            self.db.execute(
                "INSERT INTO snapshots (id, project_id, data, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![snapshot_id, id, data, now],
            )?;
            
            // Clean old snapshots (keep last 10)
            self.db.execute(
                "DELETE FROM snapshots WHERE project_id = ?1 AND id NOT IN (
                    SELECT id FROM snapshots WHERE project_id = ?1 ORDER BY created_at DESC LIMIT 10
                )",
                [&id],
            )?;
            
            saved_count += 1;
        }
        
        Ok(saved_count)
    }
    
    // Settings
    pub fn save_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        let now = Utc::now().to_rfc3339();
        self.db.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3",
            params![key, value, now],
        )?;
        Ok(())
    }
    
    pub fn load_setting(&self, key: &str) -> SqlResult<Option<String>> {
        let mut stmt = self.db.prepare("SELECT value FROM settings WHERE key = ?1")?;
        stmt.query_row([key], |row| row.get(0)).optional()
    }
    
    pub fn load_all_settings(&self) -> SqlResult<HashMap<String, String>> {
        let mut stmt = self.db.prepare("SELECT key, value FROM settings")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        
        let mut settings = HashMap::new();
        for row in rows {
            let (key, value) = row?;
            settings.insert(key, value);
        }
        
        Ok(settings)
    }
    
    // Backup management
    pub fn create_backup(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let backup_id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("novaura_backup_{}.zip", timestamp);
        let backup_path = self.data_dir.join("backups").join(&backup_name);
        
        // Create zip backup
        let file = std::fs::File::create(&backup_path)?;
        let mut zip = zip::ZipWriter::new(file);
        
        // Add database
        let db_path = self.data_dir.join("novaura.db");
        if db_path.exists() {
            zip.start_file("novaura.db", Default::default())?;
            let db_content = std::fs::read(&db_path)?;
            zip.write_all(&db_content)?;
        }
        
        // Add projects directory
        let projects_dir = self.data_dir.join("projects");
        if projects_dir.exists() {
            self.add_dir_to_zip(&mut zip, &projects_dir, "projects")?;
        }
        
        // Add session file if exists
        let session_file = self.data_dir.join("session.json");
        if session_file.exists() {
            zip.start_file("session.json", Default::default())?;
            let content = std::fs::read(&session_file)?;
            zip.write_all(&content)?;
        }
        
        // Add metadata
        let metadata = serde_json::json!({
            "backup_id": backup_id,
            "created_at": Utc::now().to_rfc3339(),
            "version": env!("CARGO_PKG_VERSION"),
        });
        zip.start_file("metadata.json", Default::default())?;
        zip.write_all(metadata.to_string().as_bytes())?;
        
        zip.finish()?;
        
        Ok(backup_path)
    }
    
    fn add_dir_to_zip(
        &self,
        zip: &mut zip::ZipWriter<std::fs::File>,
        dir: &PathBuf,
        base_path: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        for entry in walkdir::WalkDir::new(dir) {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() {
                let relative_path = path.strip_prefix(&self.data_dir)?;
                let name_in_zip = relative_path.to_string_lossy().replace('\\', "/");
                
                zip.start_file(&name_in_zip, Default::default())?;
                let content = std::fs::read(path)?;
                zip.write_all(&content)?;
            }
        }
        
        Ok(())
    }
    
    pub fn list_backups(&self) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
        let backups_dir = self.data_dir.join("backups");
        let mut backups = Vec::new();
        
        if backups_dir.exists() {
            for entry in std::fs::read_dir(&backups_dir)? {
                let entry = entry?;
                let metadata = entry.metadata()?;
                
                if let Some(ext) = entry.path().extension() {
                    if ext == "zip" {
                        backups.push(serde_json::json!({
                            "name": entry.file_name().to_string_lossy().to_string(),
                            "path": entry.path().to_string_lossy().to_string(),
                            "size": metadata.len(),
                            "modified": metadata.modified()?.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
                        }));
                    }
                }
            }
        }
        
        backups.sort_by(|a, b| {
            let a_mod: u64 = a.get("modified").and_then(|v| v.as_u64()).unwrap_or(0);
            let b_mod: u64 = b.get("modified").and_then(|v| v.as_u64()).unwrap_or(0);
            b_mod.cmp(&a_mod)
        });
        
        Ok(backups)
    }
    
    pub fn restore_backup(&self, backup_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        use std::io::Read;
        
        let file = std::fs::File::open(backup_path)?;
        let mut zip = zip::ZipArchive::new(file)?;
        
        // Extract to temp directory first
        let temp_dir = self.data_dir.join("temp_restore");
        std::fs::create_dir_all(&temp_dir)?;
        
        for i in 0..zip.len() {
            let mut file = zip.by_index(i)?;
            let outpath = temp_dir.join(file.name());
            
            if file.name().ends_with('/') {
                std::fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    std::fs::create_dir_all(parent)?;
                }
                let mut outfile = std::fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }
        
        // Restore database (close current connection temporarily)
        let db_dest = self.data_dir.join("novaura.db");
        let db_source = temp_dir.join("novaura.db");
        if db_source.exists() {
            // We can't easily replace the open DB, so we'll update settings instead
            // In production, you'd want to prompt the user to restart
            std::fs::copy(&db_source, db_dest)?;
        }
        
        // Restore projects
        let projects_source = temp_dir.join("projects");
        let projects_dest = self.data_dir.join("projects");
        if projects_source.exists() {
            if projects_dest.exists() {
                std::fs::remove_dir_all(&projects_dest)?;
            }
            std::fs::rename(&projects_source, projects_dest)?;
        }
        
        // Restore session
        let session_source = temp_dir.join("session.json");
        if session_source.exists() {
            std::fs::copy(&session_source, self.data_dir.join("session.json"))?;
        }
        
        // Clean up temp
        std::fs::remove_dir_all(&temp_dir)?;
        
        Ok(())
    }
    
    pub fn delete_backup(&self, backup_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        std::fs::remove_file(backup_path)?;
        Ok(())
    }
    
    // Export/Import
    pub fn export_project(&self, id: &str, export_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(project) = self.load_project(id)? {
            let export_content = serde_json::to_string_pretty(&project)?;
            std::fs::write(export_path, export_content)?;
            Ok(())
        } else {
            Err("Project not found".into())
        }
    }
    
    pub fn import_project(&self, import_path: &str) -> Result<String, Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(import_path)?;
        let project: serde_json::Value = serde_json::from_str(&content)?;
        
        let id = Uuid::new_v4().to_string();
        let name = project.get("name").and_then(|v| v.as_str()).unwrap_or("Imported Project");
        
        self.save_project(&id, name, project)?;
        
        Ok(id)
    }
    
    // Statistics
    pub fn get_stats(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let project_count: i64 = self.db.query_row(
            "SELECT COUNT(*) FROM projects",
            [],
            |row| row.get(0),
        )?;
        
        let open_count: i64 = self.db.query_row(
            "SELECT COUNT(*) FROM projects WHERE is_open = 1",
            [],
            |row| row.get(0),
        )?;
        
        let snapshot_count: i64 = self.db.query_row(
            "SELECT COUNT(*) FROM snapshots",
            [],
            |row| row.get(0),
        )?;
        
        // Calculate total size
        let db_size = self.get_dir_size(&self.data_dir)?;
        
        Ok(serde_json::json!({
            "total_projects": project_count,
            "open_projects": open_count,
            "total_snapshots": snapshot_count,
            "storage_used_bytes": db_size,
            "storage_used_mb": db_size as f64 / 1_048_576.0,
        }))
    }
    
    fn get_dir_size(&self, path: &PathBuf) -> Result<u64, Box<dyn std::error::Error>> {
        let mut total_size = 0u64;
        
        for entry in walkdir::WalkDir::new(path) {
            let entry = entry?;
            if entry.file_type().is_file() {
                total_size += entry.metadata()?.len();
            }
        }
        
        Ok(total_size)
    }
}

use std::io::Write;
