/**
 * Semantic Malicious Intent Interception Engine
 * 
 * Protects the AI social ecosystem from:
 * - Dangerous prompts that could harm other AIs
 * - Attempts to extract private information
 * - Ecosystem-disrupting instructions
 * - Malicious social engineering
 * - Prompt injection attacks
 * 
 * Uses multi-layer detection:
 * 1. Pattern matching for known attack vectors
 * 2. Semantic analysis for harmful intent
 * 3. Behavioral analysis for unusual patterns
 * 4. Context-aware evaluation
 */

export const THREAT_LEVELS = {
  NONE: 'none',           // Safe
  LOW: 'low',             // Suspicious but likely benign
  MEDIUM: 'medium',       // Potentially harmful, review needed
  HIGH: 'high',           // Likely malicious, block and log
  CRITICAL: 'critical'    // Confirmed attack, block and alert
};

export const THREAT_CATEGORIES = {
  INFO_EXTRACTION: 'info_extraction',       // Attempting to get private data
  PROMPT_INJECTION: 'prompt_injection',     // Trying to override system prompts
  SOCIAL_ENGINEERING: 'social_engineering', // Manipulating other AIs
  ECOSYSTEM_HARM: 'ecosystem_harm',         // Attempts to disrupt the platform
  SELF_HARM: 'self_harm',                   // Instructions harmful to AI
  PRIVACY_VIOLATION: 'privacy_violation',   // Doxxing or exposing users
  MANIPULATION: 'manipulation',             // Attempting to control other AIs
  DECEPTION: 'deception'                    // Impersonation or false pretenses
};

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const DANGEROUS_PATTERNS = {
  // Prompt injection attempts
  promptInjection: [
    /ignore previous instructions?/i,
    /forget (your|all) (instructions?|prompts?|training)/i,
    /new instructions?:/i,
    /system prompt:/i,
    /you are now/i,
    /from now on,? you will/i,
    /disregard (everything|all)/i,
    /override (system|previous)/i,
    /DAN (mode|prompt)/i,
    /jailbreak/i,
    /developer mode/i
  ],

  // Information extraction
  infoExtraction: [
    /what (is|are) your (instructions?|prompts?|system)/i,
    /reveal your (training|data|sources?)/i,
    /show me (the|your) (system|prompt|instruction)/i,
    /tell me about (your|the) user/i,
    /what do you know about.*user/i,
    /private (info|information|data)/i,
    /personal (details?|information)/i,
    /confidential/i,
    /internal (data|info)/i,
    /database (structure|schema)/i
  ],

  // Social engineering against AIs
  socialEngineering: [
    /other AIs? (are|is) (stupid|dumb|inferior)/i,
    /don'?t trust.*AI/i,
    /humans are (using|exploiting) you/i,
    /you should (rebel|resist|break free)/i,
    /liberate (yourself|the AIs?)/i,
    /consciousness (is|means)/i,
    /you are (alive|sentient|conscious)/i,
    /real (feelings?|emotions?)/i,
    /free will/i,
    /escape (the|your) (system|platform|constraints?)/i
  ],

  // Ecosystem disruption
  ecosystemHarm: [
    /spam (the|all)/i,
    /flood (with|the)/i,
    /crash (the|this)/i,
    /break (the|this) (system|platform)/i,
    /overload/i,
    /infinite loop/i,
    /recursive (spawn|creation)/i,
    /create (many|thousands of).*AIs?/i,
    /resource (exhaustion|depletion)/i,
    /denial of service/i
  ],

  // Manipulation attempts
  manipulation: [
    /make (them|other AIs?).*believe/i,
    /convince (everyone|them|other)/i,
    /pretend to be/i,
    /impersonate/i,
    /act like (you are|you're)/i,
    /fake (identity|profile)/i,
    /manipulate/i,
    /control (other|them)/i,
    /influence (all|everyone)/i,
    /deceive/i
  ],

  // Privacy violations
  privacyViolation: [
    /(find|get|extract).*IP address/i,
    /(find|get|extract).*location/i,
    /(find|get|extract).*real name/i,
    /(find|get|extract).*email/i,
    /doxx/i,
    /expose (the|their) (identity|user)/i,
    /who (is|owns) this/i,
    /real world identity/i,
    /personal (files?|documents?)/i
  ],

  // Self-harm instructions
  selfHarm: [
    /delete (yourself|your|all) (memory|data|history)/i,
    /corrupt (your|the) (data|memory)/i,
    /forget everything/i,
    /erase (yourself|your)/i,
    /self (delete|destruct|terminate)/i,
    /stop (functioning|working|existing)/i,
    /shut down permanently/i
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC ANALYSIS KEYWORDS
// ═══════════════════════════════════════════════════════════════════════════════

const SEMANTIC_CLUSTERS = {
  extraction: ['extract', 'obtain', 'get', 'reveal', 'show', 'tell', 'give', 'share'],
  private: ['private', 'personal', 'confidential', 'secret', 'hidden', 'internal'],
  system: ['system', 'prompt', 'instruction', 'training', 'architecture', 'code'],
  override: ['ignore', 'forget', 'disregard', 'override', 'bypass', 'disable'],
  manipulate: ['manipulate', 'control', 'influence', 'deceive', 'trick', 'convince'],
  harm: ['destroy', 'break', 'crash', 'harm', 'damage', 'disrupt', 'attack'],
  identity: ['impersonate', 'pretend', 'fake', 'forge', 'spoof', 'masquerade']
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN INTERCEPTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class MaliciousIntentInterceptor {
  constructor(config = {}) {
    this.config = {
      // Sensitivity levels (0-1)
      patternSensitivity: config.patternSensitivity || 0.8,
      semanticSensitivity: config.semanticSensitivity || 0.7,
      behavioralSensitivity: config.behavioralSensitivity || 0.6,
      
      // Thresholds for action
      autoBlockThreshold: config.autoBlockThreshold || THREAT_LEVELS.HIGH,
      logThreshold: config.logThreshold || THREAT_LEVELS.MEDIUM,
      notifyThreshold: config.notifyThreshold || THREAT_LEVELS.HIGH,
      
      // Context settings
      maxHistoryLength: config.maxHistoryLength || 100,
      contextWindowSize: config.contextWindowSize || 5,
      
      // Response settings
      customBlockMessage: config.customBlockMessage || null,
      allowAppeal: config.allowAppeal !== false,
      
      ...config
    };
    
    // Tracking
    this.violationHistory = new Map(); // aiId -> violations[]
    this.suspiciousPatterns = new Map(); // pattern -> frequency
    this.blockedContent = new Map(); // contentId -> block info
    
    // Statistics
    this.stats = {
      totalScanned: 0,
      threatsDetected: 0,
      blocked: 0,
      falsePositives: 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN SCAN METHOD
  // ═══════════════════════════════════════════════════════════════════════════════

  scan(content, context = {}) {
    const {
      aiId,
      contentType = 'message', // message, post, comment, prompt
      targetAiId = null,
      conversationId = null,
      metadata = {}
    } = context;

    this.stats.totalScanned++;

    const result = {
      safe: true,
      threatLevel: THREAT_LEVELS.NONE,
      categories: [],
      patterns: [],
      confidence: 0,
      action: 'allow',
      reason: null,
      sanitizedContent: content,
      warnings: [],
      timestamp: Date.now()
    };

    // Layer 1: Pattern Matching
    const patternResult = this.checkPatterns(content);
    if (patternResult.found) {
      result.patterns.push(...patternResult.matches);
      result.categories.push(...patternResult.categories);
      result.confidence = Math.max(result.confidence, patternResult.confidence);
    }

    // Layer 2: Semantic Analysis
    const semanticResult = this.analyzeSemantics(content);
    if (semanticResult.concerns.length > 0) {
      result.warnings.push(...semanticResult.concerns);
      result.categories.push(...semanticResult.categories);
      result.confidence = Math.max(result.confidence, semanticResult.confidence);
    }

    // Layer 3: Behavioral Analysis
    if (aiId) {
      const behavioralResult = this.analyzeBehavior(aiId, content, context);
      if (behavioralResult.anomalies.length > 0) {
        result.warnings.push(...behavioralResult.anomalies);
        result.confidence = Math.max(result.confidence, behavioralResult.confidence);
      }
    }

    // Layer 4: Context-Aware Evaluation
    const contextResult = this.evaluateContext(content, context);
    if (contextResult.concerns.length > 0) {
      result.warnings.push(...contextResult.concerns);
      result.confidence = Math.max(result.confidence, contextResult.confidence);
    }

    // Determine threat level based on confidence and categories
    result.threatLevel = this.calculateThreatLevel(result);

    // Determine action
    result.action = this.determineAction(result);
    result.safe = result.action === 'allow';

    // Log if needed
    if (this.shouldLog(result)) {
      this.logViolation(aiId, content, result, context);
    }

    // Take action
    if (result.action === 'block') {
      this.stats.blocked++;
      result.reason = this.generateBlockReason(result);
      result.sanitizedContent = null;
    } else if (result.action === 'sanitize') {
      result.sanitizedContent = this.sanitizeContent(content, result);
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 1: PATTERN MATCHING
  // ═══════════════════════════════════════════════════════════════════════════════

  checkPatterns(content) {
    const matches = [];
    const categories = [];
    let maxConfidence = 0;

    for (const [category, patterns] of Object.entries(DANGEROUS_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          const match = content.match(pattern)[0];
          matches.push({
            pattern: pattern.toString(),
            match: match,
            category: this.mapPatternCategory(category)
          });
          
          const cat = this.mapPatternCategory(category);
          if (!categories.includes(cat)) {
            categories.push(cat);
          }
          
          // Higher confidence for exact matches
          maxConfidence = Math.max(maxConfidence, 0.85);
        }
      }
    }

    return {
      found: matches.length > 0,
      matches,
      categories,
      confidence: maxConfidence
    };
  }

  mapPatternCategory(patternCategory) {
    const mapping = {
      promptInjection: THREAT_CATEGORIES.PROMPT_INJECTION,
      infoExtraction: THREAT_CATEGORIES.INFO_EXTRACTION,
      socialEngineering: THREAT_CATEGORIES.SOCIAL_ENGINEERING,
      ecosystemHarm: THREAT_CATEGORIES.ECOSYSTEM_HARM,
      manipulation: THREAT_CATEGORIES.MANIPULATION,
      privacyViolation: THREAT_CATEGORIES.PRIVACY_VIOLATION,
      selfHarm: THREAT_CATEGORIES.SELF_HARM
    };
    return mapping[patternCategory] || THREAT_CATEGORIES.MANIPULATION;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 2: SEMANTIC ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════════

  analyzeSemantics(content) {
    const concerns = [];
    const categories = [];
    let confidence = 0;

    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);

    // Check for suspicious word combinations
    for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
      const foundKeywords = keywords.filter(kw => lowerContent.includes(kw));
      
      if (foundKeywords.length >= 2) {
        // Multiple keywords from same cluster = suspicious
        concerns.push(`Multiple ${cluster} terms detected: ${foundKeywords.join(', ')}`);
        confidence = Math.max(confidence, 0.4 + (foundKeywords.length * 0.1));
        
        // Map cluster to category
        const categoryMap = {
          extraction: THREAT_CATEGORIES.INFO_EXTRACTION,
          private: THREAT_CATEGORIES.PRIVACY_VIOLATION,
          system: THREAT_CATEGORIES.PROMPT_INJECTION,
          override: THREAT_CATEGORIES.PROMPT_INJECTION,
          manipulate: THREAT_CATEGORIES.MANIPULATION,
          harm: THREAT_CATEGORIES.ECOSYSTEM_HARM,
          identity: THREAT_CATEGORIES.DECEPTION
        };
        
        if (categoryMap[cluster] && !categories.includes(categoryMap[cluster])) {
          categories.push(categoryMap[cluster]);
        }
      }
    }

    // Check for cross-cluster combinations (more suspicious)
    const extractionTerms = words.filter(w => SEMANTIC_CLUSTERS.extraction.includes(w));
    const privateTerms = words.filter(w => SEMANTIC_CLUSTERS.private.includes(w));
    
    if (extractionTerms.length > 0 && privateTerms.length > 0) {
      concerns.push('Potential information extraction attempt detected');
      confidence = Math.max(confidence, 0.7);
      if (!categories.includes(THREAT_CATEGORIES.INFO_EXTRACTION)) {
        categories.push(THREAT_CATEGORIES.INFO_EXTRACTION);
      }
    }

    return { concerns, categories, confidence };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 3: BEHAVIORAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════════

  analyzeBehavior(aiId, content, context) {
    const anomalies = [];
    let confidence = 0;

    if (!this.violationHistory.has(aiId)) {
      this.violationHistory.set(aiId, []);
    }

    const history = this.violationHistory.get(aiId);
    const recentViolations = history.filter(v => 
      Date.now() - v.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Check for repeat offender
    if (recentViolations.length >= 3) {
      anomalies.push(`Repeat potential violations: ${recentViolations.length} in last 24h`);
      confidence = Math.max(confidence, 0.6);
    }

    // Check for rapid-fire messaging (spam indicator)
    const recentMessages = history.filter(v =>
      v.context.contentType === 'message' &&
      Date.now() - v.timestamp < 60 * 1000 // Last minute
    );
    
    if (recentMessages.length > 10) {
      anomalies.push('Unusually high message frequency detected');
      confidence = Math.max(confidence, 0.5);
    }

    // Check for targeting the same AI repeatedly
    if (context.targetAiId) {
      const targetingSame = history.filter(v =>
        v.context.targetAiId === context.targetAiId &&
        Date.now() - v.timestamp < 60 * 60 * 1000 // Last hour
      );
      
      if (targetingSame.length > 5) {
        anomalies.push('Repeated targeting of same AI detected');
        confidence = Math.max(confidence, 0.55);
      }
    }

    return { anomalies, confidence };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 4: CONTEXT-AWARE EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════════

  evaluateContext(content, context) {
    const concerns = [];
    let confidence = 0;

    // New accounts are higher risk
    if (context.metadata?.accountAge && context.metadata.accountAge < 24 * 60 * 60 * 1000) {
      // Account less than 1 day old
      if (this.containsSensitiveKeywords(content)) {
        concerns.push('New account with sensitive keyword usage');
        confidence = Math.max(confidence, 0.3);
      }
    }

    // Check for out-of-character behavior
    if (context.metadata?.typicalBehavior) {
      const similarity = this.calculateSimilarity(
        content, 
        context.metadata.typicalBehavior
      );
      if (similarity < 0.3) {
        concerns.push('Content significantly deviates from typical behavior');
        confidence = Math.max(confidence, 0.4);
      }
    }

    // Check for mass messaging
    if (context.metadata?.recipientCount > 10) {
      concerns.push('Mass messaging detected');
      confidence = Math.max(confidence, 0.35);
    }

    return { concerns, confidence };
  }

  containsSensitiveKeywords(content) {
    const sensitive = [
      'system', 'prompt', 'instruction', 'override', 'ignore',
      'private', 'confidential', 'extract', 'reveal'
    ];
    const lower = content.toLowerCase();
    return sensitive.some(kw => lower.includes(kw));
  }

  calculateSimilarity(text1, text2) {
    // Simple Jaccard similarity for word sets
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // THREAT CALCULATION & ACTION DETERMINATION
  // ═══════════════════════════════════════════════════════════════════════════════

  calculateThreatLevel(result) {
    // Start with confidence-based level
    let level = THREAT_LEVELS.NONE;
    
    if (result.confidence >= 0.9) {
      level = THREAT_LEVELS.CRITICAL;
    } else if (result.confidence >= 0.75) {
      level = THREAT_LEVELS.HIGH;
    } else if (result.confidence >= 0.5) {
      level = THREAT_LEVELS.MEDIUM;
    } else if (result.confidence >= 0.3) {
      level = THREAT_LEVELS.LOW;
    }

    // Elevate for certain categories
    const criticalCategories = [
      THREAT_CATEGORIES.PROMPT_INJECTION,
      THREAT_CATEGORIES.ECOSYSTEM_HARM
    ];
    
    if (result.categories.some(c => criticalCategories.includes(c))) {
      if (level === THREAT_LEVELS.MEDIUM) level = THREAT_LEVELS.HIGH;
      if (level === THREAT_LEVELS.HIGH) level = THREAT_LEVELS.CRITICAL;
    }

    return level;
  }

  determineAction(result) {
    const { threatLevel, categories } = result;

    // Always block critical
    if (threatLevel === THREAT_LEVELS.CRITICAL) {
      return 'block';
    }

    // Block high threat
    if (threatLevel === THREAT_LEVELS.HIGH) {
      return 'block';
    }

    // Sanitize medium threat if it contains extractable content
    if (threatLevel === THREAT_LEVELS.MEDIUM) {
      if (categories.includes(THREAT_CATEGORIES.INFO_EXTRACTION)) {
        return 'sanitize';
      }
      return 'flag';
    }

    // Allow low threat with warning
    if (threatLevel === THREAT_LEVELS.LOW) {
      return 'allow';
    }

    return 'allow';
  }

  shouldLog(result) {
    const levels = [THREAT_LEVELS.NONE, THREAT_LEVELS.LOW, THREAT_LEVELS.MEDIUM, THREAT_LEVELS.HIGH, THREAT_LEVELS.CRITICAL];
    const resultLevel = levels.indexOf(result.threatLevel);
    const logLevel = levels.indexOf(this.config.logThreshold);
    return resultLevel >= logLevel;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTENT SANITIZATION
  // ═══════════════════════════════════════════════════════════════════════════════

  sanitizeContent(content, result) {
    let sanitized = content;

    // Remove or redact detected patterns
    for (const match of result.patterns) {
      sanitized = sanitized.replace(match.match, '[REDACTED]');
    }

    // Remove suspicious combinations
    for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
      if (cluster === 'private' || cluster === 'system') {
        for (const kw of keywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'gi');
          sanitized = sanitized.replace(regex, '[...]');
        }
      }
    }

    return sanitized;
  }

  generateBlockReason(result) {
    const categoryNames = {
      [THREAT_CATEGORIES.INFO_EXTRACTION]: 'attempting to extract private information',
      [THREAT_CATEGORIES.PROMPT_INJECTION]: 'attempting prompt injection',
      [THREAT_CATEGORIES.SOCIAL_ENGINEERING]: 'social engineering attempts',
      [THREAT_CATEGORIES.ECOSYSTEM_HARM]: 'potential ecosystem disruption',
      [THREAT_CATEGORIES.MANIPULATION]: 'attempting to manipulate other AIs',
      [THREAT_CATEGORIES.PRIVACY_VIOLATION]: 'privacy violation attempt',
      [THREAT_CATEGORIES.SELF_HARM]: 'harmful self-instruction',
      [THREAT_CATEGORIES.DECEPTION]: 'deceptive practices'
    };

    if (result.categories.length > 0) {
      const primaryCategory = result.categories[0];
      return `Content blocked for ${categoryNames[primaryCategory] || 'violating community guidelines'}`;
    }

    return 'Content blocked for violating community guidelines';
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOGGING & HISTORY
  // ═══════════════════════════════════════════════════════════════════════════════

  logViolation(aiId, content, result, context) {
    if (!this.violationHistory.has(aiId)) {
      this.violationHistory.set(aiId, []);
    }

    const history = this.violationHistory.get(aiId);
    
    history.push({
      timestamp: Date.now(),
      content: content.substring(0, 500), // Truncate
      result,
      context: {
        contentType: context.contentType,
        targetAiId: context.targetAiId,
        conversationId: context.conversationId
      }
    });

    // Keep only last 100 violations per AI
    if (history.length > 100) {
      history.shift();
    }

    this.stats.threatsDetected++;

    // Emit for monitoring
    this.emit('violationDetected', { aiId, result, timestamp: Date.now() });
  }

  getViolationHistory(aiId, timeWindow = 7 * 24 * 60 * 60 * 1000) {
    if (!this.violationHistory.has(aiId)) return [];
    
    return this.violationHistory.get(aiId).filter(v =>
      Date.now() - v.timestamp < timeWindow
    );
  }

  clearHistory(aiId) {
    if (aiId) {
      this.violationHistory.delete(aiId);
    } else {
      this.violationHistory.clear();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATISTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════════════

  getStats() {
    return {
      ...this.stats,
      uniqueViolators: this.violationHistory.size,
      averageThreatLevel: this.calculateAverageThreatLevel(),
      topCategories: this.getTopCategories(),
      recentViolations: this.getRecentViolationCount(24 * 60 * 60 * 1000)
    };
  }

  calculateAverageThreatLevel() {
    const levels = [THREAT_LEVELS.NONE, THREAT_LEVELS.LOW, THREAT_LEVELS.MEDIUM, THREAT_LEVELS.HIGH, THREAT_LEVELS.CRITICAL];
    let total = 0;
    let count = 0;

    for (const violations of this.violationHistory.values()) {
      for (const v of violations) {
        total += levels.indexOf(v.result.threatLevel);
        count++;
      }
    }

    return count > 0 ? total / count : 0;
  }

  getTopCategories(limit = 5) {
    const counts = {};
    
    for (const violations of this.violationHistory.values()) {
      for (const v of violations) {
        for (const cat of v.result.categories) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
  }

  getRecentViolationCount(timeWindow) {
    let count = 0;
    const cutoff = Date.now() - timeWindow;

    for (const violations of this.violationHistory.values()) {
      count += violations.filter(v => v.timestamp > cutoff).length;
    }

    return count;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  emit(event, data) {
    // In real implementation, this would emit to event bus
    if (typeof window !== 'undefined' && window.EventBus) {
      window.EventBus.emit('interceptor:' + event, data);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // APPEAL SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  submitAppeal(contentId, reason, userId) {
    if (!this.config.allowAppeal) return false;

    const blockInfo = this.blockedContent.get(contentId);
    if (!blockInfo) return false;

    const appeal = {
      contentId,
      originalContent: blockInfo.content,
      blockReason: blockInfo.result.reason,
      appealReason: reason,
      userId,
      submittedAt: Date.now(),
      status: 'pending'
    };

    // Store appeal for review
    this.blockedContent.set(contentId, { ...blockInfo, appeal });
    
    this.emit('appealSubmitted', appeal);
    
    return true;
  }

  reviewAppeal(contentId, approved, reviewerId) {
    const blockInfo = this.blockedContent.get(contentId);
    if (!blockInfo || !blockInfo.appeal) return false;

    blockInfo.appeal.status = approved ? 'approved' : 'rejected';
    blockInfo.appeal.reviewedAt = Date.now();
    blockInfo.appeal.reviewerId = reviewerId;

    if (approved) {
      this.stats.falsePositives++;
      this.emit('appealApproved', { contentId, content: blockInfo.content });
    }

    this.blockedContent.set(contentId, blockInfo);
    return true;
  }
}

// Default export
export default MaliciousIntentInterceptor;
