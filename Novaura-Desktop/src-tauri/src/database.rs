use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Engram {
    pub id: String,
    pub timestamp: String,
    pub content: String,
    pub category: String,
    pub tags: String,
    pub weight: f64,
    pub color: String,
    pub context: Option<String>,
    pub confidence: Option<f64>,
    pub recall_count: i64,
    pub last_accessed: String,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        // Get app data directory using standard dirs
        let home = std::env::var("APPDATA")
            .or_else(|_| std::env::var("HOME"))
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        let app_dir = std::path::PathBuf::from(home).join("NovauraDesktop");
        
        std::fs::create_dir_all(&app_dir).map_err(|e| {
            rusqlite::Error::InvalidPath(std::path::PathBuf::from(e.to_string()))
        })?;
        
        let db_path = app_dir.join("engrams.db");
        let conn = Connection::open(&db_path)?;
        
        // Initialize schema
        conn.execute(
            "CREATE TABLE IF NOT EXISTS engrams (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                weight REAL DEFAULT 0.5,
                color TEXT,
                context TEXT,
                confidence REAL,
                recall_count INTEGER DEFAULT 0,
                last_accessed TEXT NOT NULL
            )",
            [],
        )?;
        
        // Create indexes for faster queries
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_category ON engrams(category)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_timestamp ON engrams(timestamp)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_last_accessed ON engrams(last_accessed)",
            [],
        )?;
        
        // FTS (Full Text Search) for content
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS engrams_fts USING fts5(
                content,
                content_rowid=id
            )",
            [],
        )?;
        
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
    
    pub fn store_engram(
        &self,
        content: String,
        category: String,
        tags: Vec<String>,
        context: Option<String>,
        confidence: Option<f32>,
    ) -> Result<Engram> {
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().to_rfc3339();
        let tags_json = serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string());
        
        // Assign color based on category
        let color = Self::category_color(&category);
        
        let engram = Engram {
            id: id.clone(),
            timestamp: timestamp.clone(),
            content: content.clone(),
            category: category.clone(),
            tags: tags_json.clone(),
            weight: 0.5,
            color: color.to_string(),
            context: context.clone(),
            confidence: confidence.map(|c| c as f64),
            recall_count: 0,
            last_accessed: timestamp.clone(),
        };
        
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO engrams (
                id, timestamp, content, category, tags, weight, color, 
                context, confidence, recall_count, last_accessed
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                id, timestamp, content, category, tags_json, 0.5, color,
                context, confidence.map(|c| c as f64), 0, timestamp
            ],
        )?;
        
        // Also insert into FTS
        conn.execute(
            "INSERT INTO engrams_fts (rowid, content) VALUES (?1, ?2)",
            params![id, content],
        )?;
        
        Ok(engram)
    }
    
    pub fn search_engrams(
        &self,
        query: &str,
        category: Option<&str>,
        limit: usize,
    ) -> Result<Vec<Engram>> {
        let conn = self.conn.lock().unwrap();
        
        let sql = if let Some(cat) = category {
            "SELECT e.* FROM engrams e
             JOIN engrams_fts fts ON e.id = fts.rowid
             WHERE engrams_fts MATCH ?1 AND e.category = ?2
             ORDER BY e.weight DESC, e.recall_count DESC
             LIMIT ?3"
        } else {
            "SELECT e.* FROM engrams e
             JOIN engrams_fts fts ON e.id = fts.rowid
             WHERE engrams_fts MATCH ?1
             ORDER BY e.weight DESC, e.recall_count DESC
             LIMIT ?2"
        };
        
        let mut stmt = conn.prepare(sql)?;
        
        let engrams = if let Some(cat) = category {
            stmt.query_map(params![query, cat, limit as i64], |row| {
                Ok(Engram {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    content: row.get(2)?,
                    category: row.get(3)?,
                    tags: row.get(4)?,
                    weight: row.get(5)?,
                    color: row.get(6)?,
                    context: row.get(7)?,
                    confidence: row.get(8)?,
                    recall_count: row.get(9)?,
                    last_accessed: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?
        } else {
            stmt.query_map(params![query, limit as i64], |row| {
                Ok(Engram {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    content: row.get(2)?,
                    category: row.get(3)?,
                    tags: row.get(4)?,
                    weight: row.get(5)?,
                    color: row.get(6)?,
                    context: row.get(7)?,
                    confidence: row.get(8)?,
                    recall_count: row.get(9)?,
                    last_accessed: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?
        };
        
        // Update recall count and last_accessed
        for engram in &engrams {
            conn.execute(
                "UPDATE engrams SET recall_count = recall_count + 1, last_accessed = ?1 WHERE id = ?2",
                params![Utc::now().to_rfc3339(), &engram.id],
            )?;
        }
        
        Ok(engrams)
    }
    
    pub fn get_engram(&self, id: &str) -> Result<Option<Engram>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT * FROM engrams WHERE id = ?1"
        )?;
        
        let result = stmt.query_row(params![id], |row| {
            Ok(Engram {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                content: row.get(2)?,
                category: row.get(3)?,
                tags: row.get(4)?,
                weight: row.get(5)?,
                color: row.get(6)?,
                context: row.get(7)?,
                confidence: row.get(8)?,
                recall_count: row.get(9)?,
                last_accessed: row.get(10)?,
            })
        });
        
        match result {
            Ok(engram) => {
                // Update recall
                conn.execute(
                    "UPDATE engrams SET recall_count = recall_count + 1, last_accessed = ?1 WHERE id = ?2",
                    params![Utc::now().to_rfc3339(), id],
                )?;
                Ok(Some(engram))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
    
    pub fn delete_engram(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute("DELETE FROM engrams WHERE id = ?1", params![id])?;
        conn.execute("DELETE FROM engrams_fts WHERE rowid = ?1", params![id])?;
        
        Ok(())
    }
    
    pub fn update_engram_weight(&self, id: &str, weight: f32) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "UPDATE engrams SET weight = ?1 WHERE id = ?2",
            params![weight as f64, id],
        )?;
        
        Ok(())
    }
    
    pub fn get_engram_stats(&self) -> Result<crate::commands::EngramStats> {
        let conn = self.conn.lock().unwrap();
        
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM engrams",
            [],
            |row| row.get(0),
        )?;
        
        let mut stmt = conn.prepare(
            "SELECT category, COUNT(*) FROM engrams GROUP BY category"
        )?;
        
        let by_category: Vec<(String, i64)> = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            })?
            .collect::<Result<Vec<_>>>()?;
        
        Ok(crate::commands::EngramStats {
            total,
            by_category,
        })
    }
    
    fn category_color(category: &str) -> &'static str {
        match category {
            "preference" => "#9b59b6", // Purple
            "fact" => "#3498db",       // Blue
            "event" => "#e74c3c",      // Red
            "emotion" => "#f39c12",    // Orange
            "skill" => "#2ecc71",      // Green
            "relationship" => "#e91e63", // Pink
            "goal" => "#00bcd4",       // Cyan
            "memory" => "#95a5a6",     // Gray
            "code" => "#1abc9c",       // Teal
            "project" => "#e67e22",    // Dark Orange
            _ => "#607d8b",            // Blue Gray
        }
    }
}
