# AI Avatar System for Novaura EXE

## Concept
AI-controlled avatars that live in the desktop OS and can:
- Respond to voice commands
- Control the OS (open windows, files)
- Have personalities based on 9 emotions
- Learn from user behavior
- Run locally via Ollama

## Features

### 1. Avatar Personalities
- Nova: General assistant
- Aura: Creative companion
- Cipher: Coding specialist
- Each has default emotion and traits

### 2. Emotion System
Based on our 9 colors:
- Neutral, Joy, Ecstasy
- Serenity, Contentment
- Anxiety, Rage, Grief, Melancholy

Avatars change expression based on:
- User input sentiment
- Task complexity
- Success/failure of actions

### 3. Voice Control
- Web Speech API for recognition
- TTS for responses
- Wake word: "Hey Nova"

### 4. OS Integration
Commands avatars can execute:
- OPEN_WINDOW (ide, browser, terminal, git)
- CREATE_FILE
- CREATE_FOLDER
- EXECUTE_COMMAND (via Tauri)
- SEARCH_FILES

### 5. Memory
Avatars remember:
- User preferences (from Engrams)
- Recent conversations
- Frequently used commands
- Project context

## Implementation

### Frontend Component
- Floating avatar orb (bottom right)
- Click to expand chat panel
- Voice activation button
- Emotion visualization

### Backend Integration
- Ollama for local AI (privacy)
- Function calling for OS commands
- Engram RAG for context
- Context catalog for conversation history

### Tauri Commands Needed
```rust
// Execute avatar command
#[tauri::command]
fn execute_avatar_command(command: String, args: Value) -> Result<Value, String>

// Get engram context for avatar
#[tauri::command]
fn get_avatar_context(user_id: String) -> Vec<Engram>

// Text to speech
#[tauri::command]
fn speak_text(text: String) -> Result<(), String>

// Voice recognition setup
#[tauri::command]
fn init_voice_recognition() -> Result<(), String>
```

## Use Cases

1. "Hey Nova, open IDE and create a React project"
   - Avatar opens IDE window
   - Creates folder structure
   - Sets up basic files

2. "Aura, I need inspiration for my story"
   - Avatar opens Literature IDE
   - Loads previous story context
   - Suggests plot ideas

3. "Cipher, debug this error"
   - Avatar reads error log
   - Opens terminal
   - Runs diagnostic commands

4. Emotional support
   - Avatar detects user frustration
   - Switches to Serenity emotion
   - Offers calming suggestions

## UI Design

### Avatar Orb
- Floating circle (bottom right)
- Glows with current emotion color
- Pulsates when processing
- Shows initials (N, A, C)

### Chat Panel
- Slide up from orb
- Message history
- Text input
- Voice button
- Settings gear

### Emotion Visualization
- Avatar changes color based on emotion
- Background glow matches
- Expression changes (if using emoji/face)

## Technical Stack

- React component
- Web Speech API
- Ollama (local LLM)
- Tauri native commands
- Engram RAG integration

## Privacy

All avatar processing happens locally:
- Voice recognition: browser API
- AI responses: Ollama local
- Memory: SQLite via Tauri
- No cloud required

Perfect for the EXE!
