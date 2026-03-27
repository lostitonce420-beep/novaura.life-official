# Context & Background System Summary

## What We Built

### 1. Context Catalog System
A sophisticated memory management system that:
- **Catalogs engrams** into tagged, retrievable chunks
- **Stores full context** as JSON files
- **Retrieves via multiple strategies** (chronological, semantic, emotional, hybrid)
- **Works around context limits** by building optimal context strings

### 2. Interactive Mesh Water Background
A canvas-based animated background that:
- **Grid-based physics** - mesh points connected like springs
- **Water-like ripples** - mouse creates waves that propagate
- **Light trace** - glowing aura follows cursor
- **Floating particles** - drift and react to mouse
- **Customizable themes** - cosmic, aurora, sunset, ocean, etc.

---

## Files Created

### Backend (API)
```
novaura-api/
├── src/
│   ├── ai/
│   │   ├── engram-rag.ts         # 9 markers × 9 emotions
│   │   └── context-catalog.ts    # Chunking & retrieval
│   └── routes/
│       └── ai.ts                 # API endpoints
└── docs/
    ├── engram-rag.md
    ├── context-catalog.md
    └── ai-limits.md
```

### Frontend (React)
```
NovAura-WebOS/
└── src/components/
    ├── backgrounds/
    │   ├── MeshWaterBackground.jsx   # Interactive canvas bg
    │   ├── BackgroundDemo.jsx        # Demo with controls
    │   └── index.js                  # Exports & themes
    └── EngramVisualizer.jsx          # Memory browser
```

---

## Context Catalog Features

### Chunk Structure
```typescript
{
  id: "chunk_001",
  content: "Full text here...",
  summary: "One sentence summary",
  markers: ["preference", "skill"],
  primaryEmotion: "joy",
  emotionIntensity: 0.8,
  keywords: ["react", "typescript"],
  entities: ["Novaura"],
  topics: ["frontend", "web"],
  baseRelevance: 0.85,
  decayRate: 0.05
}
```

### Retrieval Strategies

| Strategy | Use Case | Speed |
|----------|----------|-------|
| `chronological` | Recent conversation | O(1) |
| `semantic` | Most relevant | O(n log n) |
| `emotional` | Mood-based | O(1) |
| `marker` | Category filter | O(1) |
| `hybrid` | **Best overall** | O(n log n) |

### Hybrid Scoring
```
score = 
  recency_weight × (10 - age_in_days) +
  relevance_weight × baseRelevance +
  emotional_weight × emotion_match +
  access_weight × accessCount
```

---

## Mesh Water Background Features

### Physics Parameters

| Param | Default | Effect |
|-------|---------|--------|
| `gridSize` | 40px | Distance between mesh points |
| `damping` | 0.95 | How fast waves settle |
| `tension` | 0.05 | Spring stiffness |
| `lightRadius` | 150px | Mouse glow size |
| `lightIntensity` | 0.8 | Glow brightness |

### Visual Effects
- **Wave propagation** - Mouse pushes mesh points, waves travel through grid
- **Spring return** - Points snap back to origin
- **Gradient lines** - Lines change color near mouse
- **Glow overlay** - Radial gradient at cursor
- **Floating particles** - Drift and get attracted to mouse

### Themes

```javascript
const themes = {
  cosmic:   { base: '#0a0a0f', line: '#00d9ff', glow: '#a855f7' },
  aurora:   { base: '#0f172a', line: '#a855f7', glow: '#10b981' },
  sunset:   { base: '#1a0a0a', line: '#fb5607', glow: '#ff006e' },
  ocean:    { base: '#0a1a1a', line: '#00d9ff', glow: '#00ff9f' },
  blueNight:{ base: '#0a1628', line: '#60a5fa', glow: '#fbbf24' },
};
```

---

## Integration Example

### Full Flow

```typescript
// 1. User chats with AI
const conversation = [
  { role: 'user', content: 'I want to learn React' },
  { role: 'assistant', content: 'Great! React is...' },
  ...
];

// 2. Store important bits as engrams
engramRAG.store({
  content: "User wants to learn React",
  marker: "goal",
  emotion: EMOTION_COLORS.JOY,
  intensity: 0.9
});

// 3. Create cataloged context window
const window = contextCatalog.createWindow(
  userId,
  tier,
  conversation,
  'conversation'
);

// 4. Later: User asks question
const userQuery = "What should I learn next?";

// 5. Retrieve relevant context
const relevantChunks = contextCatalog.retrieve(
  window.id,
  'hybrid',
  {
    text: userQuery,
    emotion: 'joy',
    limit: 10
  }
);

// 6. Build context string (respects tier limits)
const contextString = contextCatalog.buildContextString(
  relevantChunks,
  'summary'  // or 'detailed', 'bullets'
);

// 7. Send to AI
const response = await fetch('/ai/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: userQuery,
    context: contextString,
    conversation: conversation.slice(-5) // Recent turns
  })
});

// 8. Store new engram from response
engramRAG.store({
  content: `User learned: ${response.tip}`,
  marker: "skill",
  emotion: EMOTION_COLORS.CONTENTMENT,
  intensity: 0.7
});
```

---

## Working Around Context Limits

### Free Tier (4K tokens)
```typescript
// Strategy: Ultra-selective
const chunks = catalog.retrieve(windowId, 'hybrid', { limit: 5 });
const context = catalog.buildContextString(chunks, 'summary');
// ~500 tokens used
```

### Starter (8K)
```typescript
const chunks = catalog.retrieve(windowId, 'hybrid', { limit: 15 });
const context = catalog.buildContextString(chunks, 'detailed');
// ~1500 tokens used
```

### Pro (128K+)
```typescript
const chunks = catalog.retrieve(windowId, 'chronological', { limit: 100 });
const context = catalog.buildContextString(chunks, 'detailed');
// Full history available
```

---

## All Ways of Relevance

The system considers **10 dimensions** of relevance:

1. **Chronological** - What happened recently?
2. **Semantic** - Vector similarity to query
3. **Emotional** - Matching mood state
4. **Categorical** - Same marker/type
5. **Intensity** - How important
6. **Frequency** - How often recalled
7. **Recency** - Time decay factor
8. **Keywords** - Word overlap
9. **Entities** - Named things
10. **Topics** - Subject matter

All combine in the **hybrid retrieval strategy**!

---

## Quick Start

### Use Mesh Background
```jsx
import { MeshWaterBackground } from './components/backgrounds';

function App() {
  return (
    <div className="relative w-full h-screen">
      <MeshWaterBackground
        gridSize={40}
        lineColor="#00d9ff"
        glowColor="#a855f7"
      />
      <YourContent />
    </div>
  );
}
```

### Use Context Catalog
```typescript
import { contextCatalog } from './ai/context-catalog';

// Create
const window = contextCatalog.createWindow(userId, tier, data, 'conversation');

// Retrieve
const chunks = contextCatalog.retrieve(window.id, 'hybrid', { limit: 10 });
const context = contextCatalog.buildContextString(chunks, 'summary');

// Export
const json = contextCatalog.exportToJSON(window.id);
```

---

## Next Steps

- [ ] Add more interactive backgrounds (particles, waves, etc.)
- [ ] Vector database integration (Pinecone/pgvector)
- [ ] Memory consolidation daemon
- [ ] Cross-session linking
- [ ] Predictive pre-fetching
