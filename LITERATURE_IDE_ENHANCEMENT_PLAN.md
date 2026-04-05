# Literature IDE Enhancement Plan
## "NovAura Author's Studio" - The Scrivener Killer

### Core Philosophy
Transform the Literature IDE from a simple writing tool into an **AI-powered literary co-author** that understands story structure, maintains continuity, checks facts, and can even create alternative versions.

---

## 1. Grammar & Spell Checker Engine

### Features
- **Real-time spell checking** with underlines (like Google Docs)
- **Grammar correction** with explanations
- **Sentence structure analysis** - suggests improvements for flow and clarity
- **Style suggestions** - passive voice detection, wordiness, repetition
- **Genre-aware** - fantasy has different rules than literary fiction

### Implementation
- Browser's built-in spellcheck as base layer
- AI-powered grammar engine for complex suggestions
- Custom dictionary for story-specific terms (character names, places, made-up words)
- Suggestion panel with one-click apply

---

## 2. Fact Checker System

### Features
- **Real-time fact detection** - identifies claims in text
- **AI verification** - checks against general knowledge
- **Source examples** - provides 2-3 examples of the fact from different contexts
- **Historical accuracy** - for historical fiction
- **Scientific plausibility** - for sci-fi
- **Custom fact database** - user can add world-specific "facts"

### Implementation
- Text analysis to extract factual claims
- AI calls to verify with sources
- Highlight system for unverified/verified claims
- Side panel showing fact status and sources

---

## 3. Enhanced Story Bible with Timeline

### Structure
```json
{
  "characters": [...],
  "settings": [...],
  "timeline": [
    {
      "id": "evt_001",
      "type": "death|injury|parting|trauma|relationship|birth|major_event",
      "date": "Chapter 3, Scene 2",
      "characters_involved": ["char_001", "char_002"],
      "description": "Father dies in battle",
      "impact": "Protagonist becomes heir, develops fear of war",
      "chapter_id": "ch3"
    }
  ],
  "relationships": {
    "char_001-char_002": {
      "type": "rivalry",
      "start": "evt_003",
      "current_status": "hostile",
      "evolution": [...]
    }
  },
  "consistency_checks": {
    "last_checked": "timestamp",
    "entries_checked": 3,
    "issues_found": []
  }
}
```

### Features
- **Automatic event extraction** - AI reads each entry and identifies major events
- **Relationship tracker** - how character dynamics evolve
- **Timeline visualization** - chronological story map
- **Consistency validation** - every 3 entries, checks for contradictions
- **Impact tracking** - how events affect characters going forward

---

## 4. AI Focus/Reset System

### Required Steps Structure
```json
{
  "ai_workflow": {
    "on_session_start": [
      "Review Story Bible summary",
      "Check recent timeline events",
      "Verify active character arcs",
      "Confirm current chapter goals"
    ],
    "on_each_entry": [
      "Analyze new content for events",
      "Update timeline if major events detected",
      "Check character consistency",
      "Suggest continuity fixes if needed"
    ],
    "every_3_entries": [
      "Full consistency audit",
      "Verify timeline alignment",
      "Check character arc progression",
      "Validate worldbuilding consistency"
    ],
    "on_user_request": [
      "Reset context from Story Bible",
      "Summarize current story state",
      "Identify plot threads to resolve",
      "Suggest next chapter direction"
    ]
  }
}
```

### Features
- **Structured AI prompts** - ensures AI follows proper workflow
- **Context resetting** - button to "remind AI of story state"
- **Progress tracking** - visual indicator of where we are in workflow
- **Audit reports** - shows what checks were run and results

---

## 5. Remaster/Remix Feature

### How It Works
1. **Analyze** - AI reads entire story, identifies plot structure, character arcs, themes
2. **Identify Improvements** - finds weak points, pacing issues, missed opportunities
3. **Generate Alternative** - creates new version with:
   - New title
   - Subtle plot changes that improve story
   - Alternative branching points ("what if" scenarios)
   - Enhanced character motivations
   - Improved pacing

### Output Options
- **Full remaster** - complete rewrite with improvements
- **Branching point** - story diverges at specific moment
- **Genre shift** - same story, different genre
- **Perspective flip** - same events, different POV

### Preservation
- Original story remains untouched
- Remaster is a new "file" in the project
- Can compare original vs remaster side-by-side
- Can cherry-pick improvements from remaster

---

## UI/UX Design

### New Panels
1. **Timeline Panel** - Visual story timeline with events
2. **Fact Check Panel** - Shows claims and verification status
3. **Grammar Panel** - Lists all suggestions with apply buttons
4. **AI Workflow Panel** - Shows current AI context and reset button
5. **Remaster Panel** - Generate and manage alternative versions

### Integration Points
- Story Bible gets Timeline tab
- Editor gets real-time underlines for spelling/grammar/facts
- Right panel gets Fact Check and Grammar tabs
- Bottom panel gets AI Workflow status

---

## Technical Architecture

### New Components
```
literature/
├── SpellCheckEngine.js      # Spell/grammar checking logic
├── FactChecker.js           # Fact verification system
├── StoryTimeline.js         # Timeline visualization
├── AIFocusManager.js        # AI workflow management
├── RemasterEngine.js        # Story remastering logic
├── GrammarPanel.jsx         # Grammar suggestions UI
├── FactCheckPanel.jsx       # Fact checking UI
├── TimelinePanel.jsx        # Timeline visualization UI
├── AIFocusPanel.jsx         # AI workflow UI
└── RemasterPanel.jsx        # Remaster generation UI
```

### Services
```
services/
└── literatureAIService.js   # Specialized AI calls for literature
```

---

## Implementation Priority

1. **Story Bible Enhancement** - Foundation for everything else
2. **AI Focus System** - Ensures AI has proper context
3. **Grammar/Spell Checker** - Immediate writing improvement
4. **Fact Checker** - For research-heavy writing
5. **Remaster Feature** - The "wow" feature

---

## Competitive Advantage

| Feature | Scrivener | Google Docs | NovAura Author's Studio |
|---------|-----------|-------------|------------------------|
| File Organization | ✅ | ❌ | ✅ |
| Real-time Collaboration | ❌ | ✅ | ✅ |
| AI Writing Assistant | ❌ | ❌ | ✅ |
| Story Bible | ✅ | ❌ | ✅ **Enhanced** |
| Timeline Tracking | Basic | ❌ | ✅ **Automatic** |
| Grammar Check | External | ✅ | ✅ **AI-enhanced** |
| Fact Checking | ❌ | ❌ | ✅ **Built-in** |
| Continuity Checking | Manual | ❌ | ✅ **Automatic** |
| Story Remastering | ❌ | ❌ | ✅ **Unique** |

**Result:** A tool that not only helps write, but actively improves the story.
