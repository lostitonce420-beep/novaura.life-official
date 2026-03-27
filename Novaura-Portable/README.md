# Novaura Portable

A standalone desktop application for **Novaura Web OS** with local SQLite storage for session persistence, backups, and offline operation.

## Features

### 🗄️ Local Storage
- **SQLite Database**: Fast, reliable local storage for all app data
- **Session Persistence**: Restore window positions, open files, and theme settings
- **Conversation History**: Full-text search across all AI conversations
- **Project Storage**: Save and organize local projects

### 💾 Backup & Export
- **Automatic Backups**: Configurable auto-backup every 5 minutes
- **Manual Backups**: One-click backup creation from system tray
- **Export Formats**: JSON, Markdown, HTML for conversations
- **Restore**: Easy backup restoration

### 🤖 AI Context Management
- **Smart Context Windows**: Automatic token-based context optimization
- **Conversation Search**: Full-text search with FTS5
- **Message History**: Persistent chat history across sessions
- **Offline Mode**: Basic functionality without internet

### 🖥️ Native Integration
- **System Tray**: Minimize to tray, quick actions
- **File System Access**: Read/write local files
- **Custom Titlebar**: Frameless window with custom controls
- **Window State**: Remember size, position, maximized state

## Project Structure

```
Novaura-Portable/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── main.rs      # Entry point, Tauri setup
│   │   ├── storage.rs   # Project & settings storage
│   │   ├── session.rs   # Window state & desktop session
│   │   ├── context.rs   # AI conversation storage
│   │   └── backup.rs    # Backup & export utilities
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── src/
│   └── tauri-bridge.js  # JavaScript → Rust bridge
├── public/              # Static assets
├── dist/                # Production build (created by build)
└── package.json
```

## Development

### Prerequisites
- Rust 1.70+
- Node.js 18+
- Tauri CLI: `cargo install tauri-cli`

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

### Production Builds
```bash
# Windows
cargo tauri build --target x86_64-pc-windows-msvc

# macOS
cargo tauri build --target x86_64-apple-darwin
cargo tauri build --target aarch64-apple-darwin

# Linux
cargo tauri build --target x86_64-unknown-linux-gnu
```

## Data Storage

### Portable Mode
Run with `--portable` flag to store data in the same folder as the EXE:
```bash
NovauraPortable.exe --portable
```
Data is stored in `NovauraData/` folder.

### Standard Mode
Data is stored in the OS-specific app data directory:
- **Windows**: `%APPDATA%/NovauraPortable/`
- **macOS**: `~/Library/Application Support/NovauraPortable/`
- **Linux**: `~/.local/share/NovauraPortable/`

### Database Files
- `novaura.db` - Projects and settings
- `context.db` - AI conversations and messages
- `session.json` - Window state and desktop session

## API Reference

### Session Management
```javascript
import { saveSession, loadSession, autoSaveSession } from './tauri-bridge';

// Save desktop state
await saveSession({
  openWindows: [...],
  theme: 'cosmic',
  desktopItems: [...]
});

// Load previous session
const session = await loadSession();

// Auto-save with debouncing
autoSaveSession(sessionData, 2000); // 2 second delay
```

### AI Conversations
```javascript
import { 
  saveConversation, 
  loadConversations, 
  getContextWindow,
  appendToContext 
} from './tauri-bridge';

// Save conversation
await saveConversation('conv-123', 'My Chat', [
  { role: 'user', content: 'Hello', tokens: 2 },
  { role: 'assistant', content: 'Hi!', tokens: 3 }
]);

// Get optimized context for AI
const context = await getContextWindow('conv-123', 4000);

// Append message
await appendToContext('conv-123', 'user', 'New message');
```

### File Operations
```javascript
import { readFile, writeFile, listDirectory } from './tauri-bridge';

// Read file
const content = await readFile('/path/to/file.txt');

// Write file
await writeFile('/path/to/file.txt', 'Hello World');

// List directory
const entries = await listDirectory('/path/to/dir');
```

### Backup Management
```javascript
import { createBackup, listBackups, restoreBackup } from './tauri-bridge';

// Create manual backup
const path = await createBackup();

// List all backups
const backups = await listBackups();

// Restore from backup
await restoreBackup('/path/to/backup.zip');
```

## Configuration

### Auto-save Settings
```javascript
// Change auto-save interval (in minutes)
await setAutosaveInterval(10);

// Get current status
const status = await getAutosaveStatus();
// { enabled: true, interval_minutes: 5, last_save: '...' }
```

### Storage Stats
```javascript
const stats = await getStorageStats();
// {
//   total_projects: 5,
//   open_projects: 2,
//   total_snapshots: 20,
//   storage_used_mb: 12.5
// }
```

## Security

- **CSP**: Configured to allow connections to api.novaura.life
- **File System**: Scoped to app data and user directories only
- **SQLite**: Local-only, no network access
- **Updates**: Automatic updates from official source

## License

MIT - Aura x Nova
