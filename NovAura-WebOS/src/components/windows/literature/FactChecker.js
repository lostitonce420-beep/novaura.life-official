/**
 * FactChecker - AI-powered fact verification with source examples
 * 
 * Features:
 * - Extracts factual claims from text
 * - Verifies claims against general knowledge
 * - Provides 2-3 source examples for each fact
 * - Historical accuracy checking
 * - Scientific plausibility for sci-fi
 * - Custom fact database for worldbuilding
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export class FactChecker {
  constructor(options = {}) {
    this.worldFacts = new Map(options.worldFacts || []); // Story-specific facts
    this.verifiedClaims = new Map(); // Cache of verified claims
    this.unverifiedClaims = new Set();
    this.fictionMode = options.fictionMode !== false; // Assume fiction by default
  }

  /**
   * Add world-specific fact (for fantasy/scifi worldbuilding)
   */
  addWorldFact(fact, category = 'general') {
    const key = fact.toLowerCase().trim();
    this.worldFacts.set(key, {
      fact,
      category,
      verified: true,
      source: 'worldbuilding',
      timestamp: Date.now()
    });
  }

  /**
   * Extract potential factual claims from text
   */
  extractClaims(text) {
    const claims = [];
    
    // Patterns that suggest factual claims
    const patterns = [
      // Dates and historical references
      { 
        pattern: /\b(in|during|by|since|before|after)\s+(the\s+)?(year\s+)?\d{1,4}(\s+(BC|BCE|AD|CE))?\b/gi,
        type: 'historical_date'
      },
      // Historical events/figures
      {
        pattern: /\b(king|queen|emperor|president|general|battle of|war of|treaty of|the great|the first|the second)\s+([A-Z][a-z]+\s*)+/g,
        type: 'historical_figure'
      },
      // Scientific claims
      {
        pattern: /\b(light|sound|gravity|quantum|molecule|atom|planet|star|galaxy|species)\s+(travels?|moves?|works?|is|are|was|were)\s+/gi,
        type: 'scientific'
      },
      // Geographic references
      {
        pattern: /\b(in|at|near|from|to)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)*)(,\s*([A-Z][a-z]+))?\b/g,
        type: 'geographic'
      },
      // Numbers and statistics
      {
        pattern: /\b(\d+([,\.]\d+)?)\s*(miles?|kilometers?|feet|meters|tons?|pounds?|people|years?|percent)\b/gi,
        type: 'statistical'
      },
      // Medical/anatomical
      {
        pattern: /\b(heart|brain|liver|blood|bone|muscle|nerve)\s+(contains?|has|weighs?|pumps?|measures?)\s+/gi,
        type: 'medical'
      }
    ];

    patterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Get surrounding context (full sentence)
        const sentenceStart = text.lastIndexOf('.', match.index) + 1;
        const sentenceEnd = text.indexOf('.', match.index);
        const sentence = text.substring(
          sentenceStart === -1 ? 0 : sentenceStart,
          sentenceEnd === -1 ? text.length : sentenceEnd + 1
        ).trim();

        claims.push({
          text: match[0],
          fullSentence: sentence,
          type,
          index: match.index,
          length: match[0].length,
          confidence: this.assessConfidence(match[0], type)
        });
      }
    });

    // Also use AI to identify more subtle claims
    return claims;
  }

  /**
   * Assess confidence that this is actually a factual claim
   */
  assessConfidence(matchText, type) {
    // Lower confidence for ambiguous patterns
    if (type === 'geographic' && matchText.length < 10) return 'low';
    if (type === 'statistical' && matchText.match(/^\d+$/)) return 'low';
    return 'medium';
  }

  /**
   * Verify a claim using AI
   */
  async verifyClaim(claim, context = {}) {
    const cacheKey = `${claim.text}_${claim.type}`;
    
    // Check cache
    if (this.verifiedClaims.has(cacheKey)) {
      return this.verifiedClaims.get(cacheKey);
    }

    // Check world facts first
    const worldFact = this.worldFacts.get(claim.text.toLowerCase().trim());
    if (worldFact) {
      return {
        ...worldFact,
        isWorldbuilding: true
      };
    }

    // In fiction mode, many "facts" are acceptable if marked as worldbuilding
    if (this.fictionMode && context.isFiction) {
      return {
        claim: claim.text,
        verified: 'fiction',
        status: 'acceptable_in_fiction',
        message: 'This appears to be fictional content. Mark as worldbuilding fact if consistently used.',
        examples: []
      };
    }

    const token = localStorage.getItem('auth_token');
    
    const prompt = `You are a fact-checking assistant. Verify the following claim and provide 2-3 examples or sources that support or contradict it.

Claim: "${claim.text}"
Context: "${claim.fullSentence}"
Type: ${claim.type}
Genre: ${context.genre || 'general'}

Respond in JSON format:
{
  "verified": true|false|null,
  "confidence": "high|medium|low",
  "explanation": "brief explanation of verification",
  "examples": [
    {
      "type": "supporting|contradicting|related",
      "description": "brief description of the example",
      "source": "general source (e.g., 'historical records', 'scientific literature')"
    }
  ],
  "suggestions": ["suggested corrections if claim is false"]
}

If this is clearly fictional or worldbuilding content, set verified to null and note that it's acceptable for fiction.`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 1024,
        temperature: 0.2,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      let result;
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          verified: null,
          confidence: 'low',
          explanation: content,
          examples: [],
          suggestions: []
        };
      }

      // Add metadata
      result.claim = claim.text;
      result.type = claim.type;
      result.index = claim.index;
      result.timestamp = Date.now();

      // Cache result
      this.verifiedClaims.set(cacheKey, result);

      return result;
    } catch (err) {
      console.error('Fact verification failed:', err);
      return {
        claim: claim.text,
        verified: null,
        confidence: 'low',
        explanation: 'Unable to verify claim',
        examples: [],
        error: err.message
      };
    }
  }

  /**
   * Check an entire text for factual claims
   */
  async checkText(text, options = {}) {
    const claims = this.extractClaims(text);
    const results = [];

    // Limit concurrent AI calls
    const batchSize = 3;
    for (let i = 0; i < claims.length; i += batchSize) {
      const batch = claims.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(claim => this.verifyClaim(claim, options))
      );
      results.push(...batchResults);
    }

    return {
      totalClaims: claims.length,
      verified: results.filter(r => r.verified === true).length,
      unverified: results.filter(r => r.verified === null || r.verified === 'fiction').length,
      disputed: results.filter(r => r.verified === false).length,
      worldbuilding: results.filter(r => r.isWorldbuilding).length,
      claims: results
    };
  }

  /**
   * Mark a claim as worldbuilding (story fact)
   */
  markAsWorldbuilding(claim, explanation = '') {
    this.addWorldFact(claim, 'verified_worldbuilding');
    
    // Update any cached results
    const cacheKey = `${claim}_generic`;
    if (this.verifiedClaims.has(cacheKey)) {
      const cached = this.verifiedClaims.get(cacheKey);
      cached.isWorldbuilding = true;
      cached.worldbuildingNote = explanation;
    }
  }

  /**
   * Get statistics about fact checking
   */
  getStats() {
    const allClaims = Array.from(this.verifiedClaims.values());
    return {
      totalChecked: allClaims.length,
      verified: allClaims.filter(c => c.verified === true).length,
      disputed: allClaims.filter(c => c.verified === false).length,
      unverified: allClaims.filter(c => c.verified === null).length,
      worldbuildingFacts: this.worldFacts.size
    };
  }

  /**
   * Export fact database
   */
  exportFacts() {
    return {
      worldFacts: Array.from(this.worldFacts.entries()),
      verifiedClaims: Array.from(this.verifiedClaims.entries()),
      stats: this.getStats()
    };
  }

  /**
   * Import fact database
   */
  importFacts(data) {
    if (data.worldFacts) {
      this.worldFacts = new Map(data.worldFacts);
    }
    if (data.verifiedClaims) {
      this.verifiedClaims = new Map(data.verifiedClaims);
    }
  }
}

/**
 * Batch fact checking for multiple documents
 */
export async function batchFactCheck(documents, options = {}) {
  const checker = new FactChecker(options);
  const results = [];

  for (const doc of documents) {
    const result = await checker.checkText(doc.content, {
      genre: doc.genre,
      isFiction: doc.isFiction
    });
    results.push({
      documentId: doc.id,
      documentName: doc.name,
      ...result
    });
  }

  return results;
}

/**
 * Historical accuracy checker for historical fiction
 */
export async function checkHistoricalAccuracy(text, timePeriod) {
  const token = localStorage.getItem('auth_token');
  
  const prompt = `You are a historical accuracy consultant for historical fiction set in ${timePeriod}.

Analyze this text for historical accuracy:
"""
${text}
"""

Identify:
1. Anachronisms (things that don't fit the time period)
2. Historical inaccuracies
3. Acceptable fictionalizations (reasonable creative liberties)
4. Things that should be verified

Respond in JSON format:
{
  "issues": [
    {
      "type": "anachronism|inaccuracy|needs_verification",
      "text": "the problematic text",
      "explanation": "why this is inaccurate",
      "suggestion": "how to fix or a historically accurate alternative",
      "severity": "major|minor"
    }
  ],
  "periodAppropriateElements": ["elements that fit well"],
  "overallAccuracy": "high|medium|low",
  "notes": "additional context about the time period"
}`;

  try {
    const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
      provider: 'gemini',
      prompt: prompt,
      maxTokens: 2048,
      temperature: 0.2,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const content = res.data.content || res.data.response || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { issues: [], periodAppropriateElements: [], overallAccuracy: 'unknown', notes: content };
  } catch (err) {
    console.error('Historical accuracy check failed:', err);
    return { issues: [], error: err.message };
  }
}

export default FactChecker;
