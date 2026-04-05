/**
 * StoryTimeline - Enhanced Story Bible with automatic timeline tracking
 * 
 * Features:
 * - Automatic event extraction from new entries
 * - Timeline visualization data
 * - Character arc tracking
 * - Relationship evolution tracking
 * - Consistency validation
 */

export const EVENT_TYPES = {
  DEATH: { id: 'death', label: 'Death', icon: '💀', color: '#ef4444' },
  INJURY: { id: 'injury', label: 'Injury', icon: '🤕', color: '#f97316' },
  PARTING: { id: 'parting', label: 'Parting', icon: '👋', color: '#8b5cf6' },
  TRAUMA: { id: 'trauma', label: 'Trauma', icon: '💔', color: '#ec4899' },
  BIRTH: { id: 'birth', label: 'Birth', icon: '👶', color: '#10b981' },
  REVELATION: { id: 'revelation', label: 'Revelation', icon: '💡', color: '#f59e0b' },
  RELATIONSHIP_CHANGE: { id: 'relationship_change', label: 'Relationship', icon: '💕', color: '#ec4899' },
  MAJOR_DECISION: { id: 'major_decision', label: 'Decision', icon: '🎯', color: '#3b82f6' },
  BATTLE: { id: 'battle', label: 'Battle', icon: '⚔️', color: '#dc2626' },
  JOURNEY: { id: 'journey', label: 'Journey', icon: '🗺️', color: '#06b6d4' },
  DISCOVERY: { id: 'discovery', label: 'Discovery', icon: '🔍', color: '#8b5cf6' },
  CORONATION: { id: 'coronation', label: 'Coronation', icon: '👑', color: '#fbbf24' },
  BETRAYAL: { id: 'betrayal', label: 'Betrayal', icon: '🗡️', color: '#7c2d12' },
  RESCUE: { id: 'rescue', label: 'Rescue', icon: '🦸', color: '#16a34a' },
  OTHER: { id: 'other', label: 'Other', icon: '📌', color: '#6b7280' }
};

export class StoryTimeline {
  constructor(data = null) {
    this.characters = data?.characters || [];
    this.settings = data?.settings || [];
    this.rules = data?.rules || [];
    this.timeline = data?.timeline || [];
    this.plotThreads = data?.plotThreads || [];
    this.relationships = data?.relationships || {};
    this.entries = data?.entries || []; // Track entries for consistency
    this.lastConsistencyCheck = data?.lastConsistencyCheck || null;
  }

  /**
   * Add a character
   */
  addCharacter(character) {
    const newChar = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: character.name,
      description: character.description || '',
      traits: character.traits || [],
      goals: character.goals || '',
      fears: character.fears || '',
      background: character.background || '',
      arc: character.arc || '',
      currentState: character.currentState || 'Active',
      relationships: character.relationships || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.characters.push(newChar);
    return newChar;
  }

  /**
   * Update character
   */
  updateCharacter(charId, updates) {
    const idx = this.characters.findIndex(c => c.id === charId);
    if (idx !== -1) {
      this.characters[idx] = {
        ...this.characters[idx],
        ...updates,
        updatedAt: Date.now()
      };
      return this.characters[idx];
    }
    return null;
  }

  /**
   * Add a major event to timeline
   */
  addEvent(event) {
    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: event.type || 'other',
      date: event.date || 'Unknown',
      dateOrder: event.dateOrder || this.timeline.length, // For sorting
      description: event.description,
      charactersInvolved: event.charactersInvolved || [],
      location: event.location || '',
      impact: event.impact || '',
      significance: event.significance || 'medium', // high, medium, low
      chapterId: event.chapterId || '',
      sceneId: event.sceneId || '',
      entryNumber: event.entryNumber || this.entries.length,
      createdAt: Date.now()
    };
    
    this.timeline.push(newEvent);
    
    // Sort timeline by dateOrder
    this.timeline.sort((a, b) => a.dateOrder - b.dateOrder);
    
    // Update character states if needed
    this.updateCharacterStatesForEvent(newEvent);
    
    return newEvent;
  }

  /**
   * Update character states based on event
   */
  updateCharacterStatesForEvent(event) {
    event.charactersInvolved.forEach(charName => {
      const char = this.characters.find(c => 
        c.name.toLowerCase() === charName.toLowerCase()
      );
      
      if (char) {
        // Update based on event type
        switch (event.type) {
          case 'death':
            if (event.description.includes(char.name)) {
              char.currentState = 'Deceased';
            } else {
              char.currentState = 'Grieving';
            }
            break;
          case 'injury':
            if (event.description.includes(char.name)) {
              char.currentState = 'Injured';
            }
            break;
          case 'trauma':
            char.currentState = 'Traumatized';
            break;
          case 'revelation':
            char.currentState = 'Enlightened';
            break;
          case 'parting':
            char.currentState = 'Separated';
            break;
        }
        char.updatedAt = Date.now();
      }
    });
  }

  /**
   * Update or create relationship
   */
  updateRelationship(char1Id, char2Id, updates) {
    const key = [char1Id, char2Id].sort().join('_');
    
    if (!this.relationships[key]) {
      const char1 = this.characters.find(c => c.id === char1Id);
      const char2 = this.characters.find(c => c.id === char2Id);
      
      this.relationships[key] = {
        character1: char1?.name || char1Id,
        character2: char2?.name || char2Id,
        char1Id,
        char2Id,
        type: 'neutral',
        status: 'established',
        evolution: [],
        createdAt: Date.now()
      };
    }
    
    // Add to evolution history
    if (updates.type || updates.status) {
      this.relationships[key].evolution.push({
        type: updates.type || this.relationships[key].type,
        status: updates.status || this.relationships[key].status,
        note: updates.note || '',
        timestamp: Date.now(),
        eventId: updates.eventId
      });
    }
    
    this.relationships[key] = {
      ...this.relationships[key],
      ...updates,
      updatedAt: Date.now()
    };
    
    return this.relationships[key];
  }

  /**
   * Add plot thread
   */
  addPlotThread(thread) {
    const newThread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: thread.name,
      description: thread.description,
      status: thread.status || 'open', // open, in_progress, resolved, abandoned
      priority: thread.priority || 'medium', // high, medium, low
      introducedAt: thread.introducedAt || `Entry ${this.entries.length}`,
      resolvedAt: null,
      relatedEvents: thread.relatedEvents || [],
      charactersInvolved: thread.charactersInvolved || [],
      createdAt: Date.now()
    };
    
    this.plotThreads.push(newThread);
    return newThread;
  }

  /**
   * Resolve plot thread
   */
  resolvePlotThread(threadId, resolution) {
    const thread = this.plotThreads.find(t => t.id === threadId);
    if (thread) {
      thread.status = 'resolved';
      thread.resolvedAt = `Entry ${this.entries.length}`;
      thread.resolution = resolution;
      thread.updatedAt = Date.now();
      return thread;
    }
    return null;
  }

  /**
   * Record an entry (chapter/scene)
   */
  recordEntry(entryData) {
    const entry = {
      number: this.entries.length + 1,
      chapterId: entryData.chapterId,
      content: entryData.content?.substring(0, 500), // Store preview
      wordCount: entryData.wordCount,
      eventsDetected: entryData.eventsDetected || [],
      timestamp: Date.now()
    };
    
    this.entries.push(entry);
    
    // Check if consistency check needed (every 3 entries)
    if (this.entries.length % 3 === 0) {
      return { entry, needsConsistencyCheck: true };
    }
    
    return { entry, needsConsistencyCheck: false };
  }

  /**
   * Get timeline for a specific character
   */
  getCharacterTimeline(charId) {
    const char = this.characters.find(c => c.id === charId);
    if (!char) return null;
    
    const events = this.timeline.filter(e => 
      e.charactersInvolved.some(name => 
        name.toLowerCase() === char.name.toLowerCase()
      )
    );
    
    return {
      character: char,
      events: events.sort((a, b) => a.dateOrder - b.dateOrder),
      eventCount: events.length
    };
  }

  /**
   * Get relationship timeline
   */
  getRelationshipTimeline(char1Id, char2Id) {
    const key = [char1Id, char2Id].sort().join('_');
    return this.relationships[key] || null;
  }

  /**
   * Check for timeline consistency
   */
  checkConsistency() {
    const issues = [];
    
    // Check for dead characters appearing
    const deadCharacters = this.characters.filter(c => c.currentState === 'Deceased');
    deadCharacters.forEach(char => {
      const deathEvent = this.timeline.find(e => 
        e.type === 'death' && e.description.includes(char.name)
      );
      
      if (deathEvent) {
        // Check for events after death involving this character
        const postDeathEvents = this.timeline.filter(e => 
          e.dateOrder > deathEvent.dateOrder &&
          e.charactersInvolved.some(name => 
            name.toLowerCase() === char.name.toLowerCase()
          )
        );
        
        if (postDeathEvents.length > 0) {
          issues.push({
            type: 'timeline_error',
            severity: 'high',
            description: `${char.name} appears in events after their death`,
            character: char.name,
            deathEvent,
            conflictingEvents: postDeathEvents
          });
        }
      }
    });
    
    // Check relationship evolution for contradictions
    Object.values(this.relationships).forEach(rel => {
      const evolutions = rel.evolution;
      for (let i = 1; i < evolutions.length; i++) {
        const prev = evolutions[i - 1];
        const curr = evolutions[i];
        
        // Check for impossible transitions
        if (prev.status === 'enemies' && curr.status === 'lovers' && 
            !evolutions.slice(0, i).some(e => e.status === 'reconciling')) {
          issues.push({
            type: 'relationship_error',
            severity: 'medium',
            description: `${rel.character1} and ${rel.character2} jump from enemies to lovers without reconciliation`,
            relationship: rel,
            transition: { from: prev.status, to: curr.status }
          });
        }
      }
    });
    
    // Check for unresolved plot threads that haven't been mentioned
    const staleThreads = this.plotThreads.filter(t => 
      t.status === 'open' && 
      this.entries.length - (t.introducedAt?.match(/\d+/)?.[0] || 0) > 10
    );
    
    if (staleThreads.length > 0) {
      issues.push({
        type: 'plot_thread_warning',
        severity: 'low',
        description: `${staleThreads.length} plot threads have been open for many entries`,
        threads: staleThreads
      });
    }
    
    this.lastConsistencyCheck = Date.now();
    
    return {
      checkedAt: this.lastConsistencyCheck,
      issueCount: issues.length,
      issues,
      status: issues.length === 0 ? 'consistent' : 
              issues.some(i => i.severity === 'high') ? 'has_errors' : 'has_warnings'
    };
  }

  /**
   * Get story summary for AI context
   */
  getStorySummary() {
    const parts = [];
    
    parts.push(`STORY OVERVIEW`);
    parts.push(`- Characters: ${this.characters.length}`);
    parts.push(`- Major Events: ${this.timeline.length}`);
    parts.push(`- Plot Threads: ${this.plotThreads.length} (${this.plotThreads.filter(t => t.status === 'open').length} open)`);
    parts.push(`- Entries Written: ${this.entries.length}`);
    parts.push('');
    
    if (this.timeline.length > 0) {
      parts.push(`RECENT EVENTS:`);
      this.timeline.slice(-5).forEach((evt, i) => {
        const typeInfo = EVENT_TYPES[evt.type.toUpperCase()] || EVENT_TYPES.OTHER;
        parts.push(`${i + 1}. [${typeInfo.label}] ${evt.description.substring(0, 60)}${evt.description.length > 60 ? '...' : ''}`);
      });
      parts.push('');
    }
    
    if (this.characters.length > 0) {
      parts.push(`CHARACTER STATES:`);
      this.characters.forEach(char => {
        parts.push(`- ${char.name}: ${char.currentState}`);
      });
      parts.push('');
    }
    
    if (this.plotThreads.filter(t => t.status === 'open').length > 0) {
      parts.push(`OPEN PLOT THREADS:`);
      this.plotThreads.filter(t => t.status === 'open').forEach(thread => {
        parts.push(`- ${thread.name}: ${thread.description.substring(0, 50)}${thread.description.length > 50 ? '...' : ''}`);
      });
    }
    
    return parts.join('\n');
  }

  /**
   * Export all data
   */
  export() {
    return {
      characters: this.characters,
      settings: this.settings,
      rules: this.rules,
      timeline: this.timeline,
      plotThreads: this.plotThreads,
      relationships: this.relationships,
      entries: this.entries,
      lastConsistencyCheck: this.lastConsistencyCheck,
      stats: {
        characterCount: this.characters.length,
        eventCount: this.timeline.length,
        plotThreadCount: this.plotThreads.length,
        openThreads: this.plotThreads.filter(t => t.status === 'open').length,
        entryCount: this.entries.length
      }
    };
  }

  /**
   * Import data
   */
  import(data) {
    this.characters = data.characters || [];
    this.settings = data.settings || [];
    this.rules = data.rules || [];
    this.timeline = data.timeline || [];
    this.plotThreads = data.plotThreads || [];
    this.relationships = data.relationships || {};
    this.entries = data.entries || [];
    this.lastConsistencyCheck = data.lastConsistencyCheck || null;
  }
}

export default StoryTimeline;
