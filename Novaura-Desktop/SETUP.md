# Novaura Desktop - Setup Guide

## Prerequisites

1. **Rust** (required for Tauri)
   ```bash
   # Windows (PowerShell)
   winget install Rustlang.Rustup
   
   # Or download from https://rustup.rs/
   ```

2. **Node.js** v18 or higher
   ```bash
   # Check version
   node --version
   ```

3. **Tauri CLI**
   ```bash
   cargo install tauri-cli
   ```

4. **WebView2** (Windows only)
   - Usually pre-installed on Windows 11
   - Download from: https://developer.microsoft.com/microsoft-edge/webview2/

## Setup

1. **Navigate to desktop directory**
   ```bash
   cd Novaura-Desktop
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Install Rust dependencies** (automatic on first build)
   ```bash
   cargo fetch
   ```

## Development

Run in development mode:
```bash
cargo tauri dev
```

This will:
1. Start the Vite dev server
2. Compile Rust code
3. Launch the desktop app
4. Auto-reload on changes

## Building for Production

### Windows (.exe)
```bash
cargo tauri build --target x86_64-pc-windows-msvc
```
Output: `src-tauri/target/release/NovauraDesktop.exe`

### macOS (.app)
```bash
cargo tauri build --target x86_64-apple-darwin
# For M1/M2 Macs:
cargo tauri build --target aarch64-apple-darwin
```

### Linux (.AppImage)
```bash
cargo tauri build --target x86_64-unknown-linux-gnu
```

## Optional: Ollama for Local AI

1. **Download Ollama**: https://ollama.com/download
2. **Install a model**:
   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text  # For embeddings
   ```
3. **Start Ollama** (runs automatically after install)

## Project Structure

```
Novaura-Desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   ├── lib.rs         # Core functions
│   │   ├── commands.rs    # Frontend→Backend commands
│   │   ├── database.rs    # SQLite engram storage
│   │   └── ollama.rs      # Local AI client
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── build.rs           # Build script
├── index.html             # Main UI
├── package.json           # Node dependencies
└── vite.config.js         # Vite config
```

## Features

- ✅ Native desktop app (Windows, Mac, Linux)
- ✅ Local SQLite database for engrams
- ✅ Full-text search for memories
- ✅ Local AI via Ollama integration
- ✅ Native file system access
- ✅ System tray integration
- ✅ Auto-updater ready
- ✅ System notifications

## Next Steps

1. **Integrate with Web OS**: Replace the simple HTML with your full React Web OS
2. **Add engram capture**: Hook into chat/actions to save memories
3. **Build installer**: Create .msi, .dmg, or .AppImage
4. **Code signing**: Sign the executable for distribution
