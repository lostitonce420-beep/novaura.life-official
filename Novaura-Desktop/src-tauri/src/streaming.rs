use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use tauri::{Window, Manager};

const OLLAMA_URL: &str = "http://localhost:11434";

pub struct StreamingOllamaClient {
    client: Client,
}

#[derive(Serialize, Clone)]
pub struct StreamChunk {
    pub chunk: String,
    pub done: bool,
}

#[derive(Serialize)]
pub struct GenerationRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    pub stream: bool,
}

#[derive(Deserialize)]
struct GenerationResponse {
    response: String,
    done: bool,
}

impl StreamingOllamaClient {
    pub fn new() -> Self {
        StreamingOllamaClient {
            client: Client::new(),
        }
    }

    pub async fn generate_stream(
        &self,
        window: Window,
        request: GenerationRequest,
    ) -> Result<(), String> {
        let url = format!("{}/api/generate", OLLAMA_URL);
        
        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let mut stream = response.bytes_stream();
        
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                        // Parse NDJSON (newline-delimited JSON)
                        for line in text.lines() {
                            if line.trim().is_empty() { continue; }
                            
                            if let Ok(parsed) = serde_json::from_str::<GenerationResponse>(line) {
                                let _ = window.emit("ollama-stream", StreamChunk {
                                    chunk: parsed.response,
                                    done: parsed.done,
                                });
                            }
                        }
                    }
                }
                Err(e) => {
                    let _ = window.emit("ollama-stream", StreamChunk {
                        chunk: format!("Error: {}", e),
                        done: true,
                    });
                }
            }
        }

        Ok(())
    }

    pub async fn is_running(&self) -> Result<bool, reqwest::Error> {
        match self.client.get(format!("{}/api/tags", OLLAMA_URL)).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(_) => Ok(false),
        }
    }
}

impl Default for StreamingOllamaClient {
    fn default() -> Self {
        Self::new()
    }
}
