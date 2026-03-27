# Novaura Desktop

A downloadable desktop version of the Novaura Web OS, wrapped with Tauri for native performance.

## Features

- 🖥️ Native desktop app (Windows, Mac, Linux)
- 💾 Local file system access
- 🔔 Native notifications
- 🔒 Local storage for user data
- 🌐 Offline-first capability
- 🚀 Auto-updater

## Tech Stack

- **Frontend**: React + Vite (shared with Web OS)
- **Desktop Shell**: Tauri (Rust)
- **Local Database**: SQLite
- **AI**: Ollama integration for local inference

## Project Structure

```
Novaura-Desktop/
├── src/                    # React source (symlinked from Web OS)
├── src-tauri/             # Rust Tauri code
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   ├── lib.rs         # Core functions
│   │   └── commands.rs    # Frontend→Backend commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

## Development

### Prerequisites

1. **Rust**: https://rustup.rs/
2. **Node.js**: v18+
3. **Tauri CLI**: `cargo install tauri-cli`

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

## Commands

The desktop app exposes these native commands to the frontend:

- `read_file(path)` - Read local files
- `write_file(path, contents)` - Write local files
- `list_directory(path)` - List directory contents
- `show_notification(title, body)` - Native notifications
- `get_app_data_dir()` - Get app data directory
- `store_engram(engram)` - Store memory engram
- `search_engrams(query)` - Search engrams
- `invoke_ollama(prompt)` - Local AI inference

## Building

### Windows
```bash
cargo tauri build --target x86_64-pc-windows-msvc
```

### macOS
```bash
cargo tauri build --target x86_64-apple-darwin
cargo tauri build --target aarch64-apple-darwin  # M1/M2
```

### Linux
```bash
cargo tauri build --target x86_64-unknown-linux-gnu
```
