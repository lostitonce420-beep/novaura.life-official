/**
 * AIFocusManager - Manages AI workflow, context, and required steps for literature projects
 * 
 * Features:
 * - Structured AI workflow with required steps
 * - Context resetting functionality
 * - Automatic consistency checking every 3 entries
 * - Story state summarization
 * - Audit reports
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export const AI_WORKFLOW_STEPS = {
  SESSION_START: [
    {
      id: 'review_bible',
      name: 'Review Story Bible',
      description: 'Load and summarize the Story Bible for context',
      required: true
    },
    {
      id: 'check_timeline',
      name: 'Check Recent Timeline Events',
      description: 'Review the last 3-5 major events in the timeline',
      required: true
    },
    {
      id: 'verify_arcs',
      name: 'Verify Active Character Arcs',
      description: 'Confirm current state of main character arcs',
      required: true
    },
    {
      id: 'chapter_goals',
      name: 'Confirm Chapter Goals',
      description: 'Understand what needs to happen in current chapter',
      required: false
    }
  ],
  ON_EACH_ENTRY: [
    {
      id: 'extract_events',
      name: 'Analyze New Content for Events',
      description: 'Identify any major events (deaths, injuries, partings, revelations)',
      required: true
    },
    {
      id: 'update_timeline',
      name: 'Update Timeline if Major Events',
      description: 'Add detected events to the story timeline',
      required: true
    },
    {
      id: 'check_consistency',
      name: 'Check Character Consistency',
      description: 'Ensure character actions align with established traits',
      required: true
    },
    {
      id: 'suggest_fixes',
      name: 'Suggest Continuity Fixes',
      description: 'Propose corrections if inconsistencies detected',
      required: false
    }
  ],
  EVERY_3_ENTRIES: [
    {
      id: 'full_audit',
      name: 'Full Consistency Audit',
      description: 'Comprehensive check of story consistency',
      required: true
    },
    {
      id: 'timeline_alignment',
      name: 'Verify Timeline Alignment',
      description: 'Ensure chronological consistency',
      required: true
    },
    {
      id: 'arc_progression',
      name: 'Check Character Arc Progression',
      description: 'Verify character development follows established arcs',
      required: true
    },
    {
      id: 'worldbuilding_check',
      name: 'Validate Worldbuilding Consistency',
      description: 'Ensure world rules remain consistent',
      required: true
    }
  ],
  ON_USER_REQUEST: [
    {
      id: 'reset_context',
      name: 'Reset Context from Story Bible',
      description: 'Reload all context from Story Bible and timeline',
      required: true
    },
    {
      id: 'summarize_state',
      name: 'Summarize Current Story State',
      description: 'Provide comprehensive summary of where story stands',
      required: true
    },
    {
      id: 'identify_threads',
      name: 'Identify Plot Threads to Resolve',
      description: 'List open plot threads that need resolution',
      required: false
    },
    {
      id: 'suggest_direction',
      name: 'Suggest Next Chapter Direction',
      description: 'Recommend what should happen next',
      required: false
    }
  ]
};

export class AIFocusManager {
  constructor(storyBible = null, options = {}) {
    this.storyBible = storyBible;
    this.entryCount = options.entryCount || 0;
    this.lastAuditTime = options.lastAuditTime || null;
    this.auditHistory = options.auditHistory || [];
    this.currentContext = options.currentContext || null;
    this.workflowState = options.workflowState || {};
  }

  /**
   * Build system prompt with full context
   */
  buildSystemPrompt(customInstructions = '') {
    const parts = [];

    // Core identity
    parts.push(`You are a literary AI co-author assistant helping with a creative writing project.`);

    // Story Bible context
    if (this.storyBible) {
      parts.push(`\n=== STORY BIBLE ===`);
      
      if (this.storyBible.characters?.length > 0) {
        parts.push(`\nCHARACTERS:`);
        this.storyBible.characters.forEach(char => {
          parts.push(`- ${char.name}: ${char.description || 'No description'}`);
          if (char.traits?.length) {
            parts.push(`  Traits: ${char.traits.join(', ')}`);
          }
          if (char.currentState) {
            parts.push(`  Current State: ${char.currentState}`);
          }
        });
      }

      if (this.storyBible.settings?.length > 0) {
        parts.push(`\nSETTINGS:`);
        this.storyBible.settings.forEach(setting => {
          parts.push(`- ${setting.name}: ${setting.description || 'No description'}`);
        });
      }

      if (this.storyBible.rules?.length > 0) {
        parts.push(`\nWORLD RULES:`);
        this.storyBible.rules.forEach(rule => {
          parts.push(`- ${rule}`);
        });
      }

      // Timeline - recent events
      if (this.storyBible.timeline?.length > 0) {
        const recentEvents = this.storyBible.timeline.slice(-5);
        parts.push(`\nRECENT EVENTS (last ${recentEvents.length}):`);
        recentEvents.forEach((evt, i) => {
          const idx = this.storyBible.timeline.indexOf(evt) + 1;
          parts.push(`${idx}. [${evt.type}] ${evt.description} (${evt.date})`);
          if (evt.characters_involved?.length) {
            parts.push(`   Characters: ${evt.characters_involved.join(', ')}`);
          }
        });
      }

      // Active plot threads
      if (this.storyBible.plotThreads?.length > 0) {
        const openThreads = this.storyBible.plotThreads.filter(t => t.status === 'open');
        if (openThreads.length > 0) {
          parts.push(`\nOPEN PLOT THREADS:`);
          openThreads.forEach(thread => {
            parts.push(`- ${thread.name}: ${thread.description}`);
          });
        }
      }
    }

    // Workflow context
    parts.push(`\n=== WORKFLOW CONTEXT ===`);
    parts.push(`Entry count: ${this.entryCount}`);
    if (this.lastAuditTime) {
      parts.push(`Last full audit: ${new Date(this.lastAuditTime).toLocaleString()}`);
    }
    if (this.currentContext) {
      parts.push(`Current chapter/scene: ${this.currentContext}`);
    }

    // Required workflow reminder
    parts.push(`\n=== REQUIRED WORKFLOW ===`);
    parts.push(`When analyzing new content, you MUST:`);
    parts.push(`1. Identify any major events (deaths, injuries, partings, trauma, revelations, relationship changes)`);
    parts.push(`2. Note specific dates or time references`);
    parts.push(`3. Check for character consistency with established traits`);
    parts.push(`4. Flag any potential continuity issues`);
    
    if (this.entryCount > 0 && this.entryCount % 3 === 0) {
      parts.push(`\n*** FULL AUDIT REQUIRED (every 3 entries) ***`);
      parts.push(`Perform comprehensive consistency check across:`);
      parts.push(`- Timeline continuity`);
      parts.push(`- Character arc progression`);
      parts.push(`- Worldbuilding consistency`);
      parts.push(`- Plot thread tracking`);
    }

    // Custom instructions
    if (customInstructions) {
      parts.push(`\n=== ADDITIONAL INSTRUCTIONS ===`);
      parts.push(customInstructions);
    }

    return parts.join('\n');
  }

  /**
   * Reset AI context with full story state
   */
  async resetContext() {
    this.workflowState = {
      lastReset: Date.now(),
      steps: AI_WORKFLOW_STEPS.ON_USER_REQUEST.map(step => ({
        ...step,
        completed: true,
        timestamp: Date.now()
      }))
    };

    return {
      systemPrompt: this.buildSystemPrompt(),
      summary: this.generateSummary(),
      steps: this.workflowState.steps
    };
  }

  /**
   * Process a new entry/chapter
   */
  async processEntry(entryContent, entryMetadata = {}) {
    this.entryCount++;
    
    const token = localStorage.getItem('auth_token');
    const systemPrompt = this.buildSystemPrompt();

    const analysisPrompt = `Analyze the following story entry for major events and consistency:

ENTRY METADATA:
- Chapter/Scene: ${entryMetadata.chapter || 'Unknown'}
- Entry #${this.entryCount}

ENTRY CONTENT:
"""
${entryContent}
"""

Respond with a JSON object:
{
  "major_events": [
    {
      "type": "death|injury|parting|trauma|birth|relationship_change|revelation|major_decision|other",
      "description": "what happened",
      "characters_involved": ["character names"],
      "date_reference": "any specific date mentioned",
      "significance": "high|medium|low",
      "impact": "how this affects the story"
    }
  ],
  "consistency_checks": [
    {
      "check": "what was checked",
      "passed": true|false,
      "issue": "description if failed",
      "suggestion": "how to fix if failed"
    }
  ],
  "character_states": [
    {
      "character": "name",
      "previous_state": "from bible",
      "current_state": "after this entry",
      "emotional_state": "current emotion"
    }
  ],
  "new_facts": ["any new worldbuilding facts established"],
  "open_questions": ["unresolved questions raised"],
  "continuity_alerts": ["any potential issues"],
  "full_audit_recommended": true|false
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: `${systemPrompt}\n\n${analysisPrompt}`,
        maxTokens: 4096,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      let analysis;
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = this.parseFallbackAnalysis(content);
      }

      // Update workflow state
      this.workflowState.lastEntry = {
        timestamp: Date.now(),
        entryNumber: this.entryCount,
        eventsDetected: analysis.major_events?.length || 0,
        issuesFound: analysis.continuity_alerts?.length || 0
      };

      // Check if full audit needed
      const needsFullAudit = this.entryCount % 3 === 0 || analysis.full_audit_recommended;
      
      if (needsFullAudit && !this.auditHistory.find(a => a.entryNumber === this.entryCount)) {
        analysis.fullAuditRecommended = true;
      }

      return {
        entryNumber: this.entryCount,
        analysis,
        needsFullAudit,
        workflowState: this.workflowState
      };

    } catch (err) {
      console.error('Entry processing failed:', err);
      return {
        entryNumber: this.entryCount,
        error: err.message,
        analysis: null
      };
    }
  }

  /**
   * Parse fallback analysis if JSON parsing fails
   */
  parseFallbackAnalysis(text) {
    const analysis = {
      major_events: [],
      consistency_checks: [],
      character_states: [],
      new_facts: [],
      open_questions: [],
      continuity_alerts: []
    };

    // Simple regex extraction as fallback
    const eventMatches = text.match(/(?:event|happened|occurred)[^:]*:([^\n]+)/gi);
    if (eventMatches) {
      analysis.major_events = eventMatches.map(m => ({
        type: 'other',
        description: m.replace(/[^:]+:/, '').trim()
      }));
    }

    return analysis;
  }

  /**
   * Perform full consistency audit
   */
  async performFullAudit(allContent = '') {
    const token = localStorage.getItem('auth_token');
    const systemPrompt = this.buildSystemPrompt();

    const auditPrompt = `Perform a comprehensive consistency audit of the story so far.

RECENT CONTENT:
"""
${allContent.substring(-10000)} // Last ~10k chars
"""

TIMELINE DATA:
${JSON.stringify(this.storyBible?.timeline?.slice(-10) || [], null, 2)}

Provide audit in JSON format:
{
  "timeline_consistency": {
    "status": "consistent|issues_found",
    "issues": [{"description": "", "severity": "high|medium|low"}]
  },
  "character_arc_progression": {
    "status": "on_track|needs_attention",
    "character_assessments": [
      {"character": "", "arc_progress": "", "concerns": []}
    ]
  },
  "worldbuilding_consistency": {
    "status": "consistent|issues_found",
    "rule_violations": [],
    "established_facts": []
  },
  "plot_thread_status": [
    {"thread": "", "status": "resolved|in_progress|forgotten", "last_mentioned": ""}
  ],
  "overall_assessment": "",
  "priority_fixes": ["most important issues to address"],
  "recommendations": ["suggestions for improvement"]
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: `${systemPrompt}\n\n${auditPrompt}`,
        maxTokens: 4096,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      let audit;
      if (jsonMatch) {
        audit = JSON.parse(jsonMatch[0]);
      } else {
        audit = { error: 'Could not parse audit', raw: content };
      }

      // Record audit
      const auditRecord = {
        entryNumber: this.entryCount,
        timestamp: Date.now(),
        ...audit
      };
      this.auditHistory.push(auditRecord);
      this.lastAuditTime = Date.now();

      return auditRecord;

    } catch (err) {
      console.error('Full audit failed:', err);
      return {
        entryNumber: this.entryCount,
        timestamp: Date.now(),
        error: err.message
      };
    }
  }

  /**
   * Generate story summary
   */
  generateSummary() {
    const parts = [];

    parts.push(`STORY SUMMARY (Entry #${this.entryCount})`);
    parts.push('');

    if (this.storyBible?.timeline?.length > 0) {
      parts.push(`Timeline: ${this.storyBible.timeline.length} major events`);
      
      const byType = {};
      this.storyBible.timeline.forEach(evt => {
        byType[evt.type] = (byType[evt.type] || 0) + 1;
      });
      
      parts.push(`Events by type:`);
      Object.entries(byType).forEach(([type, count]) => {
        parts.push(`  - ${type}: ${count}`);
      });
    }

    if (this.storyBible?.characters?.length > 0) {
      parts.push(`\nCharacters: ${this.storyBible.characters.length}`);
      this.storyBible.characters.forEach(char => {
        parts.push(`  - ${char.name}: ${char.currentState || char.description || 'Active'}`);
      });
    }

    if (this.storyBible?.plotThreads?.length > 0) {
      const open = this.storyBible.plotThreads.filter(t => t.status === 'open');
      const resolved = this.storyBible.plotThreads.filter(t => t.status === 'resolved');
      parts.push(`\nPlot Threads: ${open.length} open, ${resolved.length} resolved`);
    }

    if (this.auditHistory.length > 0) {
      const lastAudit = this.auditHistory[this.auditHistory.length - 1];
      parts.push(`\nLast Audit: ${new Date(lastAudit.timestamp).toLocaleString()}`);
      if (lastAudit.timeline_consistency?.status) {
        parts.push(`Timeline Status: ${lastAudit.timeline_consistency.status}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Export workflow state
   */
  exportState() {
    return {
      entryCount: this.entryCount,
      lastAuditTime: this.lastAuditTime,
      auditHistory: this.auditHistory,
      currentContext: this.currentContext,
      workflowState: this.workflowState
    };
  }

  /**
   * Import workflow state
   */
  importState(state) {
    this.entryCount = state.entryCount || 0;
    this.lastAuditTime = state.lastAuditTime || null;
    this.auditHistory = state.auditHistory || [];
    this.currentContext = state.currentContext || null;
    this.workflowState = state.workflowState || {};
  }
}

export default AIFocusManager;
