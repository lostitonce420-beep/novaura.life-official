use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::mpsc;
use tauri::{Manager, Window};

pub struct FileWatcher {
    watcher: Option<RecommendedWatcher>,
}

#[derive(Clone, serde::Serialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub kind: String,
}

impl FileWatcher {
    pub fn new() -> Self {
        FileWatcher { watcher: None }
    }

    pub fn watch_directory(
        &mut self,
        window: Window,
        path: String,
    ) -> Result<(), String> {
        let (tx, mut rx) = mpsc::channel(100);

        let watcher = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.try_send(event);
                }
            },
            Config::default(),
        )
        .map_err(|e| e.to_string())?;

        self.watcher = Some(watcher);

        if let Some(ref mut w) = self.watcher {
            w.watch(Path::new(&path), RecursiveMode::Recursive)
                .map_err(|e| e.to_string())?;
        }

        // Spawn task to forward events to frontend
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                let kind = match event.kind {
                    notify::EventKind::Create(_) => "create",
                    notify::EventKind::Modify(_) => "modify",
                    notify::EventKind::Remove(_) => "delete",
                    _ => "unknown",
                };

                for path in event.paths {
                    let _ = window.emit("file-change", FileChangeEvent {
                        path: path.to_string_lossy().to_string(),
                        kind: kind.to_string(),
                    });
                }
            }
        });

        Ok(())
    }

    pub fn stop_watching(&mut self) {
        self.watcher = None;
    }
}

impl Default for FileWatcher {
    fn default() -> Self {
        Self::new()
    }
}
