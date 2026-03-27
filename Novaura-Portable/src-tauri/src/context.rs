use rusqlite::{Connection, params, Result as SqlResult};
use std::path::PathBuf;
use chrono::Utc;
use uuid::Uuid;

/// ContextManager handles AI conversation storage and context window management
/// Uses SQLite for local persistence with efficient token management
pub struct ContextManager {
    db: Connection,
}

impl ContextManager {
    pub fn new(data_dir: &PathBuf) -> SqlResult<Self> {
        let db_path = data_dir.join("context.db");
        let db = Connection::open(db_path)?;
        
        let manager = Self { db };
        manager.init_tables()?;
        
        Ok(manager)
    }
    
    fn init_tables(&self) -> SqlResult<()> {
        // Conversations table
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                model TEXT,
                system_prompt TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                total_tokens INTEGER DEFAULT 0,
                is_archived BOOLEAN DEFAULT 0
            )",
            [],
        )?;
        
        // Messages table with FTS5 for search
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                tokens INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // Create indexes
        self.db.execute(
            "CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at)",
            [],
        )?;
        
        self.db.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC)",
            [],
        )?;
        
        // Create FTS5 virtual table for full-text search
        self.db.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
                content,
                content_rowid=id
            )",
            [],
        )?;
        
        // Triggers to keep FTS index in sync
        self.db.execute(
            "CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
                INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
            END",
            [],
        )?;
        
        self.db.execute(
            "CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
                INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.id, old.content);
            END",
            [],
        )?;
        
        // Context summaries for long conversations
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS context_summaries (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                summary TEXT NOT NULL,
                message_range_start TEXT NOT NULL,
                message_range_end TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        Ok(())
    }
    
    /// Save or update a conversation
    pub fn save_conversation(
        &self,
        id: &str,
        title: &str,
        messages: Vec<serde_json::Value>,
    ) -> SqlResult<()> {
        let now = Utc::now().to_rfc3339();
        let tx = self.db.unchecked_transaction()?;
        
        // Insert or update conversation
        self.db.execute(
            "INSERT INTO conversations (id, title, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?3)
             ON CONFLICT(id) DO UPDATE SET
             title = ?2,
             updated_at = ?3",
            params![id, title, now],
        )?;
        
        // Clear existing messages and re-insert
        self.db.execute("DELETE FROM messages WHERE conversation_id = ?1", [id])?;
        
        let mut total_tokens = 0;
        
        for msg in messages {
            let msg_id = msg.get("id").and_then(|v| v.as_str()).unwrap_or(&Uuid::new_v4().to_string());
            let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
            let content = msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
            let tokens = msg.get("tokens").and_then(|v| v.as_u64()).unwrap_or(0) as i64;
            let metadata = msg.get("metadata").map(|v| v.to_string()).unwrap_or_default();
            
            total_tokens += tokens;
            
            self.db.execute(
                "INSERT INTO messages (id, conversation_id, role, content, tokens, created_at, metadata)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![msg_id, id, role, content, tokens, now, metadata],
            )?;
        }
        
        // Update total token count
        self.db.execute(
            "UPDATE conversations SET total_tokens = ?1 WHERE id = ?2",
            params![total_tokens, id],
        )?;
        
        tx.commit()?;
        Ok(())
    }
    
    /// Get list of all conversations
    pub fn list_conversations(&self) -> SqlResult<Vec<serde_json::Value>> {
        let mut stmt = self.db.prepare(
            "SELECT id, title, model, created_at, updated_at, total_tokens, is_archived
             FROM conversations 
             WHERE is_archived = 0
             ORDER BY updated_at DESC"
        )?;
        
        let conversations = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "model": row.get::<_, Option<String>>(2)?,
                "created_at": row.get::<_, String>(3)?,
                "updated_at": row.get::<_, String>(4)?,
                "total_tokens": row.get::<_, i64>(5)?,
                "is_archived": row.get::<_, bool>(6)?,
            }))
        })?;
        
        conversations.collect::<Result<Vec<_>, _>>()
    }
    
    /// Get full conversation with messages
    pub fn get_conversation(&self, id: &str) -> SqlResult<Option<serde_json::Value>> {
        let mut conv_stmt = self.db.prepare(
            "SELECT id, title, model, system_prompt, created_at, updated_at, total_tokens
             FROM conversations WHERE id = ?1"
        )?;
        
        let conversation = conv_stmt.query_row([id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "model": row.get::<_, Option<String>>(2)?,
                "system_prompt": row.get::<_, Option<String>>(3)?,
                "created_at": row.get::<_, String>(4)?,
                "updated_at": row.get::<_, String>(5)?,
                "total_tokens": row.get::<_, i64>(6)?,
            }))
        }).optional()?;
        
        if conversation.is_none() {
            return Ok(None);
        }
        
        // Get messages
        let mut msg_stmt = self.db.prepare(
            "SELECT id, role, content, tokens, created_at, metadata
             FROM messages 
             WHERE conversation_id = ?1 
             ORDER BY created_at ASC"
        )?;
        
        let messages = msg_stmt.query_map([id], |row| {
            let metadata: Option<String> = row.get(5)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "role": row.get::<_, String>(1)?,
                "content": row.get::<_, String>(2)?,
                "tokens": row.get::<_, i64>(3)?,
                "created_at": row.get::<_, String>(4)?,
                "metadata": metadata.and_then(|m| serde_json::from_str(&m).ok()),
            }))
        })?;
        
        let messages: Vec<_> = messages.collect::<Result<Vec<_>, _>>()?;
        
        let mut result = conversation.unwrap();
        if let Some(obj) = result.as_object_mut() {
            obj.insert("messages".to_string(), serde_json::json!(messages));
        }
        
        Ok(Some(result))
    }
    
    /// Get recent messages for context window (limited by count)
    pub fn get_context_window(&self, conversation_id: &str, limit: usize) -> SqlResult<Vec<serde_json::Value>> {
        let mut stmt = self.db.prepare(
            "SELECT id, role, content, tokens, created_at, metadata
             FROM messages 
             WHERE conversation_id = ?1 
             ORDER BY created_at DESC
             LIMIT ?2"
        )?;
        
        let messages = stmt.query_map(params![conversation_id, limit as i64], |row| {
            let metadata: Option<String> = row.get(5)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "role": row.get::<_, String>(1)?,
                "content": row.get::<_, String>(2)?,
                "tokens": row.get::<_, i64>(3)?,
                "created_at": row.get::<_, String>(4)?,
                "metadata": metadata.and_then(|m| serde_json::from_str(&m).ok()),
            }))
        })?;
        
        // Reverse to get chronological order
        let mut result: Vec<_> = messages.collect::<Result<Vec<_>, _>>()?;
        result.reverse();
        Ok(result)
    }
    
    /// Build a context window limited by max_tokens (approximate)
    pub fn build_context_window(&self, conversation_id: &str, max_tokens: usize) -> SqlResult<String> {
        // Get messages in reverse chronological order
        let mut stmt = self.db.prepare(
            "SELECT role, content, tokens
             FROM messages 
             WHERE conversation_id = ?1 
             ORDER BY created_at DESC"
        )?;
        
        let messages = stmt.query_map([conversation_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)? as usize,
            ))
        })?;
        
        let messages: Vec<_> = messages.collect::<Result<Vec<_>, _>>()?;
        
        let mut context_parts = Vec::new();
        let mut token_count = 0;
        
        // Start from most recent and work backwards
        for (role, content, tokens) in messages {
            if token_count + tokens > max_tokens {
                break;
            }
            context_parts.push(format!("{}: {}", role, content));
            token_count += tokens;
        }
        
        // Reverse to get chronological order
        context_parts.reverse();
        
        Ok(context_parts.join("\n\n"))
    }
    
    /// Append a message to conversation
    pub fn append_message(&self, conversation_id: &str, role: &str, content: &str) -> SqlResult<()> {
        let now = Utc::now().to_rfc3339();
        let msg_id = Uuid::new_v4().to_string();
        
        // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
        let estimated_tokens = (content.len() / 4) as i64;
        
        let tx = self.db.unchecked_transaction()?;
        
        self.db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, tokens, created_at, metadata)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![msg_id, conversation_id, role, content, estimated_tokens, now, "{}"],
        )?;
        
        // Update conversation timestamp
        self.db.execute(
            "UPDATE conversations SET updated_at = ?1, total_tokens = total_tokens + ?2 WHERE id = ?3",
            params![now, estimated_tokens, conversation_id],
        )?;
        
        tx.commit()?;
        Ok(())
    }
    
    /// Delete a conversation
    pub fn delete_conversation(&self, id: &str) -> SqlResult<()> {
        self.db.execute("DELETE FROM conversations WHERE id = ?1", [id])?;
        Ok(())
    }
    
    /// Clear all messages in a conversation (keep conversation metadata)
    pub fn clear_conversation(&self, id: &str) -> SqlResult<()> {
        let tx = self.db.unchecked_transaction()?;
        
        self.db.execute("DELETE FROM messages WHERE conversation_id = ?1", [id])?;
        self.db.execute(
            "UPDATE conversations SET total_tokens = 0, updated_at = ?1 WHERE id = ?2",
            params![Utc::now().to_rfc3339(), id],
        )?;
        
        tx.commit()?;
        Ok(())
    }
    
    /// Search messages across all conversations
    pub fn search_messages(&self, query: &str, limit: usize) -> SqlResult<Vec<serde_json::Value>> {
        let sql = format!(
            "SELECT m.id, m.conversation_id, m.role, m.content, m.created_at, c.title
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             WHERE m.id IN (SELECT rowid FROM messages_fts WHERE content MATCH ?1)
             ORDER BY m.created_at DESC
             LIMIT {}",
            limit
        );
        
        let mut stmt = self.db.prepare(&sql)?;
        
        let results = stmt.query_map([query], |row| {
            Ok(serde_json::json!({
                "message_id": row.get::<_, String>(0)?,
                "conversation_id": row.get::<_, String>(1)?,
                "role": row.get::<_, String>(2)?,
                "content": row.get::<_, String>(3)?,
                "created_at": row.get::<_, String>(4)?,
                "conversation_title": row.get::<_, String>(5)?,
            }))
        })?;
        
        results.collect::<Result<Vec<_>, _>>()
    }
    
    /// Archive old conversations (soft delete)
    pub fn archive_conversation(&self, id: &str) -> SqlResult<()> {
        self.db.execute(
            "UPDATE conversations SET is_archived = 1 WHERE id = ?1",
            [id],
        )?;
        Ok(())
    }
    
    /// Get conversation statistics
    pub fn get_stats(&self) -> SqlResult<serde_json::Value> {
        let total_conversations: i64 = self.db.query_row(
            "SELECT COUNT(*) FROM conversations",
            [],
            |row| row.get(0),
        )?;
        
        let total_messages: i64 = self.db.query_row(
            "SELECT COUNT(*) FROM messages",
            [],
            |row| row.get(0),
        )?;
        
        let total_tokens: i64 = self.db.query_row(
            "SELECT COALESCE(SUM(total_tokens), 0) FROM conversations",
            [],
            |row| row.get(0),
        )?;
        
        let oldest_message: Option<String> = self.db.query_row(
            "SELECT MIN(created_at) FROM messages",
            [],
            |row| row.get(0),
        ).optional()?;
        
        Ok(serde_json::json!({
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "oldest_message": oldest_message,
        }))
    }
    
    /// Compact database (VACUUM)
    pub fn compact(&self) -> SqlResult<()> {
        self.db.execute("VACUUM", [])?;
        Ok(())
    }
}

/// Token estimation utility
pub fn estimate_tokens(text: &str) -> usize {
    // Rough approximation: 1 token ≈ 4 characters for English
    // More accurate for code (higher token density)
    let code_density = if text.contains('{') || text.contains(';') || text.contains("fn ") {
        3.5 // Code is more token-dense
    } else {
        4.0
    };
    
    (text.len() as f64 / code_density).ceil() as usize
}

/// Context window optimizer
pub fn optimize_context_window(messages: &[serde_json::Value], max_tokens: usize) -> Vec<serde_json::Value> {
    let mut result = Vec::new();
    let mut token_count = 0;
    
    // Always keep system message first
    if let Some(system_msg) = messages.first() {
        if system_msg.get("role").and_then(|v| v.as_str()) == Some("system") {
            result.push(system_msg.clone());
            let content = system_msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
            token_count += estimate_tokens(content);
        }
    }
    
    // Add messages from the end (most recent) until we hit the limit
    for msg in messages.iter().rev() {
        let content = msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
        let msg_tokens = estimate_tokens(content);
        
        if token_count + msg_tokens > max_tokens {
            break;
        }
        
        result.push(msg.clone());
        token_count += msg_tokens;
    }
    
    // Reverse to maintain chronological order
    result.reverse();
    result
}
