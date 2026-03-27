use reqwest::Client;
use serde::{Deserialize, Serialize};

const OLLAMA_URL: &str = "http://localhost:11434";

pub struct OllamaClient {
    client: Client,
}

impl OllamaClient {
    pub fn new() -> Self {
        OllamaClient {
            client: Client::new(),
        }
    }
    
    pub async fn is_running(&self) -> Result<bool, reqwest::Error> {
        match self.client.get(format!("{}/api/tags", OLLAMA_URL)).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(_) => Ok(false),
        }
    }
    
    pub async fn generate(&self, request: GenerationRequest) -> Result<String, reqwest::Error> {
        let url = format!("{}/api/generate", OLLAMA_URL);
        
        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await?;
        
        let result: GenerationResponse = response.json().await?;
        Ok(result.response)
    }
    
    pub async fn chat(&self, request: ChatRequest) -> Result<String, reqwest::Error> {
        let url = format!("{}/api/chat", OLLAMA_URL);
        
        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await?;
        
        let result: ChatResponse = response.json().await?;
        Ok(result.message.content)
    }
    
    pub async fn list_models(&self) -> Result<Vec<crate::commands::OllamaModel>, reqwest::Error> {
        let url = format!("{}/api/tags", OLLAMA_URL);
        
        let response = self.client
            .get(&url)
            .send()
            .await?;
        
        let result: ModelsResponse = response.json().await?;
        
        let models = result.models.into_iter().map(|m| {
            crate::commands::OllamaModel {
                name: m.name,
                size: format_size(m.size),
                modified: m.modified_at,
            }
        }).collect();
        
        Ok(models)
    }
}

fn format_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    format!("{:.1} {}", size, UNITS[unit_index])
}

#[derive(Serialize)]
pub struct GenerationRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
}

#[derive(Deserialize)]
struct GenerationResponse {
    response: String,
}

#[derive(Serialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
}

#[derive(Deserialize)]
struct ChatResponse {
    message: Message,
}

#[derive(Deserialize)]
struct Message {
    content: String,
}

#[derive(Deserialize)]
struct ModelsResponse {
    models: Vec<Model>,
}

#[derive(Deserialize)]
struct Model {
    name: String,
    size: u64,
    modified_at: String,
}

impl Default for OllamaClient {
    fn default() -> Self {
        Self::new()
    }
}
