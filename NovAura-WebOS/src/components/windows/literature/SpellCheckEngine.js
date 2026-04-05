/**
 * SpellCheckEngine - Advanced spell checking, grammar correction, and sentence structure analysis
 * 
 * Features:
 * - Real-time spell checking with suggestions
 * - Grammar and style analysis
 * - Sentence structure improvements
 * - Genre-aware suggestions
 * - Custom dictionary support for story-specific terms
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export class SpellCheckEngine {
  constructor(options = {}) {
    this.customDictionary = new Set(options.customDictionary || []);
    this.genre = options.genre || 'general'; // general, fantasy, scifi, horror, romance, etc.
    this.checkStyle = options.checkStyle !== false; // Enable style checking
    this.checkGrammar = options.checkGrammar !== false; // Enable grammar checking
    this.ignoredWords = new Set();
    this.cache = new Map(); // Cache results
  }

  // Common words to ignore in spell check (very basic list, browser handles most)
  static COMMON_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
  ]);

  // Style rules
  static STYLE_RULES = {
    passiveVoice: {
      pattern: /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|\w+en)\b/gi,
      message: 'Consider using active voice for stronger prose',
      severity: 'suggestion'
    },
    weakAdverbs: {
      words: ['very', 'really', 'quite', 'rather', 'pretty', 'fairly', 'somewhat', 'kind of', 'sort of'],
      message: 'Consider a stronger word choice instead',
      severity: 'suggestion'
    },
    filterWords: {
      words: ['suddenly', 'immediately', 'sudden', 'abrupt', 'began to', 'started to', 'managed to'],
      message: 'Filter words can weaken the narrative',
      severity: 'suggestion'
    },
    repeatedWords: {
      message: 'Word repetition detected',
      severity: 'suggestion'
    },
    sentenceLength: {
      maxLength: 40,
      message: 'Consider breaking this long sentence into shorter ones',
      severity: 'suggestion'
    },
    dialogueTags: {
      weakTags: ['said', 'say', 'says'],
      message: 'Consider using action beats or stronger dialogue tags',
      severity: 'info'
    }
  };

  /**
   * Add words to custom dictionary
   */
  addToDictionary(words) {
    if (Array.isArray(words)) {
      words.forEach(w => this.customDictionary.add(w.toLowerCase()));
    } else {
      this.customDictionary.add(words.toLowerCase());
    }
  }

  /**
   * Ignore word for this session
   */
  ignoreWord(word) {
    this.ignoredWords.add(word.toLowerCase());
  }

  /**
   * Extract all words from HTML content
   */
  extractWords(html) {
    // Remove HTML tags
    const text = html.replace(/<[^>]+>/g, ' ');
    // Split into words, keeping position info
    const words = [];
    const regex = /\b[\w']+\b/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      words.push({
        word: match[0],
        index: match.index,
        length: match[0].length
      });
    }
    
    return words;
  }

  /**
   * Basic spell check using browser API + custom logic
   */
  async checkSpelling(html) {
    const issues = [];
    const words = this.extractWords(html);
    
    // Use browser spell check API if available
    const text = html.replace(/<[^>]+>/g, ' ');
    
    for (const { word, index } of words) {
      const lowerWord = word.toLowerCase();
      
      // Skip if in dictionary or ignored
      if (this.customDictionary.has(lowerWord) || 
          this.ignoredWords.has(lowerWord) ||
          SpellCheckEngine.COMMON_WORDS.has(lowerWord) ||
          word.length <= 2) {
        continue;
      }

      // Skip numbers
      if (/^\d+$/.test(word)) continue;

      // Check cache
      if (this.cache.has(lowerWord)) {
        const cached = this.cache.get(lowerWord);
        if (!cached.valid) {
          issues.push({
            type: 'spelling',
            word,
            index,
            suggestions: cached.suggestions,
            message: `Possible misspelling: "${word}"`
          });
        }
        continue;
      }

      // Note: Actual spell checking would use a dictionary API or service
      // For now, we'll flag potential issues for AI review
      if (this.looksLikeTypo(word)) {
        issues.push({
          type: 'spelling',
          word,
          index,
          suggestions: [],
          message: `Possible misspelling: "${word}"`
        });
      }
    }

    return issues;
  }

  /**
   * Heuristic to detect potential typos
   */
  looksLikeTypo(word) {
    // Multiple consecutive consonants (unlikely in English)
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(word)) return true;
    
    // Multiple consecutive vowels
    if (/[aeiou]{4,}/i.test(word)) return true;
    
    // Unusual character patterns
    if (/[^a-zA-Z'\-]/.test(word)) return true;
    
    // Very long words
    if (word.length > 20) return true;
    
    return false;
  }

  /**
   * Check grammar and style
   */
  checkGrammarAndStyle(html) {
    const issues = [];
    const text = html.replace(/<[^>]+>/g, ' ');
    const sentences = this.extractSentences(text);
    const words = text.toLowerCase().split(/\s+/);
    
    // Check passive voice
    if (this.checkStyle) {
      const passiveMatches = text.matchAll(SpellCheckEngine.STYLE_RULES.passiveVoice.pattern);
      for (const match of passiveMatches) {
        issues.push({
          type: 'style',
          subtype: 'passive_voice',
          text: match[0],
          index: match.index,
          message: SpellCheckEngine.STYLE_RULES.passiveVoice.message,
          severity: SpellCheckEngine.STYLE_RULES.passiveVoice.severity,
          suggestion: this.suggestActiveVoice(match[0])
        });
      }
    }

    // Check weak adverbs
    SpellCheckEngine.STYLE_RULES.weakAdverbs.words.forEach(adverb => {
      let index = text.toLowerCase().indexOf(adverb);
      while (index !== -1) {
        issues.push({
          type: 'style',
          subtype: 'weak_adverb',
          text: text.substr(index, adverb.length),
          index,
          message: SpellCheckEngine.STYLE_RULES.weakAdverbs.message,
          severity: SpellCheckEngine.STYLE_RULES.weakAdverbs.severity,
          context: this.getContext(text, index, adverb.length)
        });
        index = text.toLowerCase().indexOf(adverb, index + 1);
      }
    });

    // Check filter words
    SpellCheckEngine.STYLE_RULES.filterWords.words.forEach(filter => {
      let index = text.toLowerCase().indexOf(filter);
      while (index !== -1) {
        issues.push({
          type: 'style',
          subtype: 'filter_word',
          text: text.substr(index, filter.length),
          index,
          message: SpellCheckEngine.STYLE_RULES.filterWords.message,
          severity: SpellCheckEngine.STYLE_RULES.filterWords.severity
        });
        index = text.toLowerCase().indexOf(filter, index + 1);
      }
    });

    // Check sentence length
    sentences.forEach((sentence, i) => {
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > SpellCheckEngine.STYLE_RULES.sentenceLength.maxLength) {
        // Find position in original text
        const index = text.indexOf(sentence);
        issues.push({
          type: 'style',
          subtype: 'long_sentence',
          text: sentence.substring(0, 50) + '...',
          index,
          message: SpellCheckEngine.STYLE_RULES.sentenceLength.message,
          severity: SpellCheckEngine.STYLE_RULES.sentenceLength.severity,
          wordCount
        });
      }
    });

    // Check for word repetition (within paragraph)
    const wordCounts = {};
    words.forEach(w => {
      if (w.length > 3) { // Only check significant words
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });
    
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 3) { // Word appears more than 3 times
        const indices = [];
        let idx = text.toLowerCase().indexOf(word);
        while (idx !== -1) {
          indices.push(idx);
          idx = text.toLowerCase().indexOf(word, idx + 1);
        }
        
        issues.push({
          type: 'style',
          subtype: 'repetition',
          word,
          count,
          indices,
          message: `"${word}" appears ${count} times. Consider using synonyms.`,
          severity: 'suggestion'
        });
      }
    });

    return issues;
  }

  /**
   * Extract sentences from text
   */
  extractSentences(text) {
    // Simple sentence splitting - could be improved
    return text
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Get context around a position
   */
  getContext(text, index, length, contextLength = 30) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + length + contextLength);
    return text.substring(start, end);
  }

  /**
   * Suggest active voice version
   */
  suggestActiveVoice(passivePhrase) {
    // This would ideally use AI for better suggestions
    return `Consider rewriting in active voice (e.g., "The dragon defeated the knight" instead of "The knight was defeated by the dragon")`;
  }

  /**
   * Get suggestions for a misspelled word
   */
  async getSpellingSuggestions(word) {
    // This would call an API or use a dictionary
    // For now, return empty array - real implementation would use
    // a service like LanguageTool, OpenAI, or similar
    return [];
  }

  /**
   * Full analysis - spelling + grammar + style
   */
  async analyze(html) {
    const [spelling, grammar] = await Promise.all([
      this.checkSpelling(html),
      Promise.resolve(this.checkGrammarAndStyle(html))
    ]);

    return {
      spelling,
      grammar,
      totalIssues: spelling.length + grammar.length,
      summary: {
        spellingErrors: spelling.length,
        grammarSuggestions: grammar.filter(g => g.type === 'grammar').length,
        styleSuggestions: grammar.filter(g => g.type === 'style').length
      }
    };
  }

  /**
   * Apply a correction
   */
  applyCorrection(html, issue, replacement) {
    const text = html.replace(/<[^>]+>/g, '§§§§'); // Markup placeholder
    const before = text.substring(0, issue.index);
    const after = text.substring(issue.index + (issue.word || issue.text).length);
    const corrected = before + replacement + after;
    
    // Restore HTML tags (this is simplified - real implementation would need
    // to track tag positions more carefully)
    return corrected.replace(/§§§§/g, (match, offset) => {
      // Find original tag at this position
      // This is a placeholder for proper implementation
      return match;
    });
  }
}

/**
 * AI-powered advanced grammar and style checking
 */
export async function aiGrammarCheck(text, genre = 'general', storyBible = null) {
  const token = localStorage.getItem('auth_token');
  
  let prompt = `You are a professional editor specializing in ${genre} fiction. 
Analyze the following text for:
1. Grammar errors (with corrections)
2. Awkward sentence structures (with improved versions)
3. Word choice improvements
4. Flow and rhythm issues
5. Show vs tell opportunities

Text to analyze:
"""
${text}
"""

Provide your analysis in this JSON format:
{
  "issues": [
    {
      "type": "grammar|style|structure|word_choice|flow",
      "original": "the problematic text",
      "suggestion": "the improved version",
      "explanation": "why this change improves the writing",
      "severity": "high|medium|low"
    }
  ],
  "overall_feedback": "brief overall assessment",
  "readability_score": 1-10
}`;

  try {
    const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
      provider: 'gemini',
      prompt: prompt,
      maxTokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent edits
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // Try to parse JSON response
    const content = res.data.content || res.data.response || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { issues: [], overall_feedback: content, readability_score: 5 };
  } catch (err) {
    console.error('AI grammar check failed:', err);
    return { issues: [], overall_feedback: 'Error checking grammar', readability_score: 5 };
  }
}

export default SpellCheckEngine;
