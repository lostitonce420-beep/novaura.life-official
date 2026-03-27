# NovAura Rebuild Roadmap
## Cascading Logic Architecture

---

## 🎯 Priority Tier 1 (Alibaba Demo - Must Work)

### 1. Workspace/Studio (`WorkspaceWindow.jsx`)
**Current:** Shell  
**Rebuild:** Unified dashboard with cascading data flow

**Cascading Logic:**
```
User opens Studio
    ↓
Load Projects → Check Auth → Fetch Stats
    ↓                          ↓
Render Cards ←── Real-time sync ←── WebSocket updates
    ↓
Quick Actions → Open related apps (cascading window opens)
```

**Required Features:**
- Project cards with live status
- Recent activity feed (cascading from all apps)
- Quick stats aggregation
- Template gallery
- "New Project" → Cascades to IDE/Builder

---

### 2. Vibe Coding (`VibeCodingWindow.jsx`)
**Current:** Shell  
**Rebuild:** AI-pair programming with live cascading

**Cascading Logic:**
```
User describes vibe → Parse intent → Detect tech stack
    ↓                                    ↓
Generate boilerplate ←── Apply vibe modifiers ←── Mood/color/tempo
    ↓
Live preview ←── Auto-refresh on code change ←── File watcher
    ↓
Voice input → Transcribe → AI interpret → Code change
```

**Required Features:**
- Voice-to-code (Gemini Live)
- Mood-based theming
- Real-time preview
- Vibe presets (Chill, Energetic, Dark, Neon)

---

### 3. Constructor (`ConstructorWindow.jsx`)
**Current:** Shell  
**Rebuild:** Visual component builder with cascading props

**Cascading Logic:**
```
Drag component → Drop canvas → Auto-generate props interface
    ↓                                    ↓
Prop change → Cascade to preview ←── Real-time compile
    ↓
Style change → Update CSS-in-JS → Hot reload preview
    ↓
Export → Format code → Pipeline validation → Download/Apply
```

**Required Features:**
- Drag-drop UI builder
- Props panel with types
- Style editor (Tailwind)
- Export to BuilderBot project

---

## 🎯 Priority Tier 2 (Post-Demo Polish)

### 4. Art Studio (`ArtStudioWindow.jsx`)
**Cascading:** Sketch → AI enhance → Layer effects → Export

### 5. Comic Creator (`ComicCreatorWindow.jsx`)
**Cascading:** Script → Panel layout → Character gen → Bubble text → Export

### 6. Clothing Creator (`ClothingCreatorWindow.jsx`)
**Cascading:** Base template → Design overlay → Pattern apply → 3D preview

---

## 🧬 Cascading Architecture Pattern

Every rebuild must implement:

### 1. **Event Cascade Layer**
```javascript
// events/cascade.js
export const createCascade = () => ({
  emit: (event, data) => {
    listeners[event]?.forEach(fn => fn(data));
    // Cascade to parent if not handled
    parent?.emit(event, data);
  },
  on: (event, fn) => {
    listeners[event] = [...(listeners[event] || []), fn];
  }
});
```

### 2. **State Cascade Layer**
```javascript
// stores/cascadeStore.js
const useCascadeStore = create((set, get) => ({
  // Local state
  value: null,
  
  // Upstream dependencies
  deps: {},
  
  // Downstream subscribers
  subscribers: new Set(),
  
  setValue: (v) => {
    set({ value: v });
    // Cascade to subscribers
    get().subscribers.forEach(fn => fn(v));
  },
  
  subscribe: (fn) => {
    get().subscribers.add(fn);
    return () => get().subscribers.delete(fn);
  }
}));
```

### 3. **Pipeline Integration**
Every app must hook into `PipelineEngine.js`:
```javascript
const result = await runPipeline(
  userPrompt,
  projectFiles,
  config,
  {
    onPhaseStart: (phase) => updateUI(phase),
    onCodeUpdate: (blocks) => updatePreview(blocks),
    onComplete: (blocks) => finalize(blocks)
  }
);
```

---

## 🛠️ Rebuild Strategy

### Phase 1: Core Infrastructure (Today)
1. ✅ PipelineEngine (exists)
2. ✅ AIAdjusters (exists)
3. 🔄 Event Cascade Bus (NEW)
4. 🔄 State Sync Layer (NEW)

### Phase 2: Workspace Studio (This Weekend)
1. Dashboard layout
2. Project cards with live data
3. Activity feed (aggregate from all apps)
4. Quick action buttons

### Phase 3: Vibe Coding (Next Week)
1. Voice input integration
2. Mood detection
3. Real-time preview
4. Vibe presets

### Phase 4: Constructor (Following Week)
1. Drag-drop canvas
2. Component library
3. Props panel
4. Export pipeline

---

## 📋 Immediate Action Items

### 1. Create Event Bus
File: `src/utils/EventBus.js`
Purpose: Cross-app communication cascade

### 2. Create State Sync
File: `src/utils/StateSync.js`
Purpose: Persistent state across sessions

### 3. Rebuild WorkspaceWindow
File: `src/components/windows/WorkspaceWindow.jsx`
Pattern: Master-detail with cascading data

### 4. Test Pipeline Integration
Verify: All apps can trigger pipeline generation

---

## 🎯 Alibaba Demo Show Flow

```
1. "Open Workspace" 
   → Shows unified dashboard (rebuilt)
   
2. "Create new project"
   → Workspace cascades to BuilderBot IDE
   
3. "Build a React app"
   → IDE triggers PipelineEngine
   → Shows cascading passes in real-time
   → Pass 1: Foundation
   → Pass 2: Depth  
   → Pass 3: Branching
   → Kimi: Approved
   
4. "Open Vibe Coding"
   → Shows voice interface (rebuilt shell)
   → "This feature launches Q2"
   
5. "Generate art for this"
   → PixAI (fully working)
   
6. "Deploy"
   → Website Builder (fully working)
```

---

## 🔥 Critical Path

**Today:** Event Bus + State Sync  
**Tomorrow:** Workspace rebuild  
**Weekend:** Vibe Coding shell → functional  
**Monday:** Full integration test  
**Tuesday:** Alibaba demo ready

---

**Which component should I build first?**
- A) Event Bus (cross-app communication)
- B) Workspace Studio (unified dashboard)
- C) Rebuild Vibe Coding with voice
- D) Fix existing broken cascading in PipelinePanel
