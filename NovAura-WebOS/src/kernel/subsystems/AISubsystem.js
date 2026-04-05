/**
 * NovAura OS — AI Subsystem v2
 *
 * Phase 1 — Foundation:
 *   - Priority job queue (high / normal / low) with FIFO within each tier
 *   - SHA-256 prompt hash caching (5 min TTL) — identical prompts skip the network
 *   - Persistent cache in Firestore at users/{uid}/kernel/ai_cache/{hash}
 *
 * Phase 2 — Parallelization:
 *   - Worker pool expanded to 5 concurrent slots
 *   - Top-2 available providers raced with Promise.any() — fastest wins
 *   - Parallel pipeline stages when options.pipeline is set
 *
 * Phase 3 — Intelligence:
 *   - Request classifier routes prompts to the optimal provider by type
 *   - Quality scorer (0–1) auto-retries on low-quality responses
 *   - Adaptive pass count: stops early on high-quality, retries on low
 *   - Warmup cache pre-fetches common query patterns
 */

import { db } from '../../config/firebase.js';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://us-central1-novaura-systems.cloudfunctions.net/api';

const PROVIDER_CHAIN = ['gemini', 'qwen', 'claude', 'openai', 'ollama', 'lmstudio'];

// Phase 2: expanded pool
const MAX_CONCURRENT = 5;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_PROVIDER = 30;

// Phase 1: cache
const CACHE_TTL_MS = 5 * 60_000;  // 5 minutes
const MAX_CACHE_ENTRIES = 200;
const MAX_FIRESTORE_CACHE = 50;   // top-N entries persisted

// Phase 3: quality
const MIN_QUALITY_SCORE = 0.4;    // below this → retry next provider

// ─── Utilities ──────────────────────────────────────────────────────────────

async function sha256(text) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function cacheKey(prompt, options) {
  const sig = JSON.stringify({
    p: prompt,
    provider: options.provider || null,
    model: options.model || null,
    temp: options.temperature ?? 0.7,
    maxTokens: options.maxTokens || 1024,
  });
  return sig; // hashed async in Phase 1 path
}

// ─── Phase 3: Request Classifier ────────────────────────────────────────────

const CLASSIFIER_RULES = [
  // Long-context / document analysis → Claude
  { match: p => p.length > 3000,                         provider: 'claude'  },
  // Code generation / debugging → Claude or OpenAI
  { match: p => /\b(function|class|import|async|await|const|let|var|def |print\(|<\/?\w+>)\b/.test(p), provider: 'claude' },
  // Image / visual / creative → Gemini
  { match: p => /\b(image|photo|picture|visual|design|color|draw|render|art)\b/i.test(p), provider: 'gemini' },
  // Math / data / structured output → OpenAI
  { match: p => /\b(calculate|formula|equation|data|table|csv|json|statistic)\b/i.test(p), provider: 'openai' },
  // Short / quick / chat → Qwen (faster)
  { match: p => p.length < 120,                           provider: 'qwen'   },
  // Local model / offline preference → Ollama
  { match: p => /\b(local|offline|private|no cloud)\b/i.test(p), provider: 'ollama' },
];

function classifyProvider(prompt) {
  for (const rule of CLASSIFIER_RULES) {
    if (rule.match(prompt)) return rule.provider;
  }
  return 'gemini'; // default
}

// ─── Phase 3: Quality Scorer ─────────────────────────────────────────────────

function scoreResponse(response) {
  if (!response || typeof response !== 'string') return 0;
  const text = response.trim();
  if (text.length < 20) return 0.1;

  let score = 0.5;

  // Length bonus (up to 0.2)
  score += Math.min(text.length / 2000, 0.2);

  // Structure indicators (headers, lists, code blocks)
  if (/^#{1,3} /m.test(text)) score += 0.05;
  if (/^[-*] /m.test(text))   score += 0.05;
  if (/```/.test(text))        score += 0.05;

  // Penalty for error-like responses
  if (/error|sorry|cannot|unable|don't know/i.test(text)) score -= 0.15;

  // Penalty for very short
  if (text.length < 80) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

// ─── Main Class ──────────────────────────────────────────────────────────────

class AISubsystem {
  constructor() {
    this._kernel     = null;
    this._config     = null;
    this._providers  = new Map();
    this._pending    = 0;
    this._rateCounts = new Map();

    // Phase 1: Priority queue { priority, prompt, options, resolve, reject }
    this._queue = { high: [], normal: [], low: [] };

    // Phase 1: In-memory LRU cache  { hash -> { response, provider, model, ts, hits } }
    this._cache = new Map();

    // Phase 1: hash build cache (raw sig -> hash, avoids re-hashing same sig)
    this._hashMemo = new Map();

  }

  init(kernel) {
    this._kernel = kernel;

    PROVIDER_CHAIN.forEach((name, i) => {
      this._providers.set(name, {
        name,
        available: true,
        priority: i,
        model: this._defaultModel(name),
        requestCount: 0,
        errorCount: 0,
        successCount: 0,
        avgQuality: 0.7,
        lastError: null,
      });
    });

    kernel.ipc.on('settings:changed', ({ key, value }) => {
      if (key === 'llm_config') this._config = value;
    });

    this._probeProviders();
  }

  _defaultModel(provider) {
    return {
      gemini:   'gemini-2.5-flash',
      qwen:     'qwen-plus',
      claude:   'claude-sonnet-4-6',
      openai:   'gpt-4o-mini',
      ollama:   'llama3',
      lmstudio: 'local',
    }[provider] || provider;
  }

  // ─── Phase 1: Cache ───────────────────────────────────────────────────────

  async _getHash(prompt, options) {
    const sig = cacheKey(prompt, options);
    if (this._hashMemo.has(sig)) return this._hashMemo.get(sig);
    const hash = await sha256(sig);
    if (this._hashMemo.size > 500) {
      // evict oldest
      const firstKey = this._hashMemo.keys().next().value;
      this._hashMemo.delete(firstKey);
    }
    this._hashMemo.set(sig, hash);
    return hash;
  }

  _cacheGet(hash) {
    const entry = this._cache.get(hash);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      this._cache.delete(hash);
      return null;
    }
    entry.hits = (entry.hits || 0) + 1;
    return entry;
  }

  _cachePut(hash, result) {
    // LRU eviction
    if (this._cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = this._cache.keys().next().value;
      this._cache.delete(oldest);
    }
    this._cache.set(hash, { ...result, ts: Date.now(), hits: 0 });
  }

  /** Load top-N cache entries from Firestore on boot */
  async loadCacheFromFirestore() {
    const uid = this._kernel?.auth?.uid;
    if (!uid || !db) return;
    try {
      const cacheCol = collection(db, 'users', uid, 'kernel', 'ai_cache', 'entries');
      const snap = await getDocs(cacheCol);
      snap.forEach(d => {
        const data = d.data();
        if (data?.hash && data?.response) {
          this._cache.set(data.hash, {
            response: data.response,
            provider: data.provider,
            model: data.model,
            ts: data.ts || Date.now(),
            hits: data.hits || 0,
          });
        }
      });
    } catch {
      // Non-critical
    }
  }

  /** Persist top-N most-hit cache entries to Firestore */
  async _persistCache() {
    const uid = this._kernel?.auth?.uid;
    if (!uid || !db) return;
    try {
      const entries = Array.from(this._cache.entries())
        .sort((a, b) => (b[1].hits || 0) - (a[1].hits || 0))
        .slice(0, MAX_FIRESTORE_CACHE);

      await Promise.all(entries.map(([hash, entry]) =>
        setDoc(
          doc(db, 'users', uid, 'kernel', 'ai_cache', 'entries', hash),
          { hash, ...entry }
        )
      ));
    } catch {
      // Non-critical
    }
  }

  // ─── Phase 1: Priority Queue ──────────────────────────────────────────────

  _enqueue(priority, prompt, options) {
    return new Promise((resolve, reject) => {
      const tier = priority === 'high' ? 'high'
                 : priority === 'low'  ? 'low'
                 : 'normal';
      this._queue[tier].push({ prompt, options, resolve, reject });
    });
  }

  _dequeue() {
    if (this._queue.high.length)   return this._queue.high.shift();
    if (this._queue.normal.length) return this._queue.normal.shift();
    if (this._queue.low.length)    return this._queue.low.shift();
    return null;
  }

  _queueSize() {
    return this._queue.high.length + this._queue.normal.length + this._queue.low.length;
  }

  // ─── Phase 2: Provider Racing ─────────────────────────────────────────────

  /** Race top-2 available providers, return first successful response */
  async _raceProviders(chain, prompt, options) {
    const available = chain
      .map(name => this._providers.get(name))
      .filter(p => p && p.available && !this._isRateLimited(p.name));

    if (available.length === 0) throw new Error('[AI] No providers available');

    // Race top-2; if only one available, use it directly
    const racers = available.slice(0, 2);

    if (racers.length === 1) {
      return this._callProvider(racers[0], prompt, options);
    }

    return Promise.any(racers.map(p => this._callProvider(p, prompt, options)));
  }

  async _callProvider(provider, prompt, options) {
    const token = await this._kernel.auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    // Support BYOK: user's own API key takes precedence
    const userKey = options.apiKey || this._config?.apiKey;
    if (userKey) headers['X-User-Api-Key'] = userKey;

    const body = {
      prompt,
      provider: provider.name,
      model: options.model || provider.model,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      conversation: options.conversation || [],
    };

    const res = await fetch(BACKEND_URL + '/ai/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Provider ' + provider.name + ' returned error');
    }

    this._trackRequest(provider.name);
    provider.requestCount++;
    provider.errorCount = Math.max(0, provider.errorCount - 1);

    return {
      response: data.response,
      provider: provider.name,
      model: data.model || provider.model,
      tokens: data.tokens || null,
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * @param {string} prompt
   * @param {object} options
   *   provider, model, conversation, maxTokens, temperature,
   *   priority ('high'|'normal'|'low'),
   *   apiKey (BYOK),
   *   noCache (skip hash cache),
   *   pipeline (array of stage functions for Phase 2 parallel pipeline)
   */
  async request(prompt, options = {}) {
    const requestId = 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    this._kernel.ipc.emit('ai:request:start', { requestId, prompt: prompt.slice(0, 80) });

    // ── Phase 2: parallel pipeline ──
    if (options.pipeline && Array.isArray(options.pipeline)) {
      return this._runPipeline(prompt, options, requestId);
    }

    // ── Phase 1: hash cache lookup ──
    if (!options.noCache) {
      const hash = await this._getHash(prompt, options);
      const cached = this._cacheGet(hash);
      if (cached) {
        this._kernel.ipc.emit('ai:request:complete', {
          requestId, provider: cached.provider, model: cached.model, cached: true,
        });
        return { ...cached, cached: true };
      }

      // Queue if pool full
      if (this._pending >= MAX_CONCURRENT) {
        return this._enqueue(options.priority || 'normal', prompt, options);
      }

      return this._execute(prompt, options, requestId, hash);
    }

    if (this._pending >= MAX_CONCURRENT) {
      return this._enqueue(options.priority || 'normal', prompt, options);
    }
    return this._execute(prompt, options, requestId, null);
  }

  async _execute(prompt, options = {}, requestId, hash) {
    this._pending++;

    // ── Phase 3: intelligent routing ──
    const classified = classifyProvider(prompt);
    const preferredProvider = options.provider || this._config?.provider || classified;

    const chain = preferredProvider
      ? [preferredProvider, ...PROVIDER_CHAIN.filter(p => p !== preferredProvider)]
      : PROVIDER_CHAIN;

    let result = null;
    let lastError = null;

    // ── Phase 2: race top providers ──
    try {
      result = await this._raceProviders(chain, prompt, options);
    } catch (e) {
      lastError = e;
      // Fall through to sequential fallback
    }

    // ── Phase 3: quality scoring + adaptive retry ──
    if (result) {
      const quality = scoreResponse(result.response);
      const provider = this._providers.get(result.provider);
      if (provider) {
        provider.successCount++;
        // Exponential moving average of quality
        provider.avgQuality = provider.avgQuality * 0.8 + quality * 0.2;
      }

      if (quality < MIN_QUALITY_SCORE) {
        // Try remaining providers sequentially
        const fallbacks = chain.filter(p => p !== result.provider);
        for (const name of fallbacks) {
          const p = this._providers.get(name);
          if (!p || !p.available || this._isRateLimited(name)) continue;
          try {
            const retry = await this._callProvider(p, prompt, options);
            const retryQuality = scoreResponse(retry.response);
            if (retryQuality > quality) {
              result = retry;
              break;
            }
          } catch {
            // Continue to next
          }
        }
      }
    } else {
      // Phase 2 race failed entirely — sequential last-resort
      for (const name of chain) {
        const p = this._providers.get(name);
        if (!p || !p.available || this._isRateLimited(name)) continue;
        try {
          result = await this._callProvider(p, prompt, options);
          break;
        } catch (e) {
          lastError = e;
          p.errorCount++;
          p.lastError = e.message;
          if (p.errorCount >= 5) {
            p.available = false;
            setTimeout(() => { p.available = true; p.errorCount = 0; }, 60_000);
          }
        }
      }
    }

    this._pending--;
    this._drainQueue();

    if (!result) {
      this._kernel.ipc.emit('ai:request:error', { requestId, error: lastError?.message });
      throw lastError || new Error('[AI] All providers failed');
    }

    // ── Phase 1: write to cache ──
    if (hash) {
      this._cachePut(hash, result);
      // Persist cache in background periodically
      if (this._cache.size % 10 === 0) this._persistCache();
    }

    this._kernel.ipc.emit('ai:request:complete', {
      requestId,
      provider: result.provider,
      model: result.model,
    });

    return result;
  }

  // ── Phase 2: Parallel Pipeline ──────────────────────────────────────────

  /**
   * Run prompt through multiple stage functions in parallel.
   * Each stage fn receives (prompt, baseResult) and returns a partial result.
   * All stages are awaited concurrently; results merged by key into final output.
   */
  async _runPipeline(prompt, options, requestId) {
    const stages = options.pipeline;
    const baseResult = await this._execute(prompt, { ...options, pipeline: undefined }, requestId, null);

    const stageResults = await Promise.allSettled(
      stages.map(stageFn => stageFn(prompt, baseResult))
    );

    const merged = { ...baseResult };
    stageResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value && typeof r.value === 'object') {
        Object.assign(merged, r.value);
      }
    });

    return merged;
  }

  // ─── Phase 3: Warmup Cache ───────────────────────────────────────────────

  /**
   * Pre-warm cache with common system prompts so the first real user request
   * is served from cache.
   */
  async warmupCache() {
    const uid = this._kernel?.auth?.uid;
    if (!uid) return;

    const warmupPrompts = [
      { prompt: 'Summarize what NovAura OS is in one sentence.', options: {} },
      { prompt: 'What can you help me with today?', options: {} },
    ];

    for (const { prompt, options } of warmupPrompts) {
      const hash = await this._getHash(prompt, options);
      if (!this._cacheGet(hash)) {
        try {
          await this.request(prompt, { ...options, priority: 'low' });
        } catch {
          // Non-critical warmup failure
        }
      }
    }
  }

  // ─── Probe + Rate Limiting ───────────────────────────────────────────────

  async _probeProviders() {
    try {
      const token = await this._kernel.auth.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(BACKEND_URL + '/ai/providers', { headers });
      if (!res.ok) return;
      const data = await res.json();

      if (data.providers) {
        Object.entries(data.providers).forEach(([name, info]) => {
          const p = this._providers.get(name);
          if (p) {
            p.available = info.available ?? info.configured ?? false;
          }
        });
      }

      this._kernel.ipc.emit('ai:providers:updated', {
        providers: Object.fromEntries(this._providers),
      });
    } catch {
      // Offline — stay optimistic
    }
  }

  _isRateLimited(provider) {
    const now = Date.now();
    let times = this._rateCounts.get(provider) || [];
    times = times.filter(t => now - t < RATE_WINDOW_MS);
    this._rateCounts.set(provider, times);
    return times.length >= RATE_LIMIT_PER_PROVIDER;
  }

  _trackRequest(provider) {
    const times = this._rateCounts.get(provider) || [];
    times.push(Date.now());
    this._rateCounts.set(provider, times);
  }

  _drainQueue() {
    if (this._queueSize() === 0 || this._pending >= MAX_CONCURRENT) return;
    const next = this._dequeue();
    if (next) {
      this._execute(next.prompt, next.options, 'ai_drain_' + Date.now(), null)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  setConfig(config) {
    this._config = config;
  }

  getProviderStatus() {
    return Object.fromEntries(this._providers);
  }

  getCacheStats() {
    return {
      size: this._cache.size,
      maxSize: MAX_CACHE_ENTRIES,
      ttlMs: CACHE_TTL_MS,
    };
  }

  // ─── Semantics Engine Integration ──────────────────────────────────────────

  /**
   * Execute a request with function calling support
   * Allows AI to control the OS through the SemanticsEngine
   * @param {string} prompt - User prompt
   * @param {object} options - Request options
   * @param {boolean} options.enableFunctions - Enable function calling
   */
  async requestWithFunctions(prompt, options = {}) {
    const { enableFunctions = true, maxFunctionCalls = 5 } = options;
    
    if (!enableFunctions || !this._kernel?.semantics) {
      return this.request(prompt, options);
    }

    const semantics = this._kernel.semantics;
    const functionDefinitions = semantics.getFunctionDefinitions();
    const systemState = semantics.getSystemState();
    const availableApps = semantics.getAvailableApps();

    // Build enhanced prompt with function context
    const enhancedPrompt = this._buildFunctionCallingPrompt(prompt, {
      systemState,
      availableApps,
      functionCount: functionDefinitions.length
    });

    // Get AI response
    const result = await this.request(enhancedPrompt, {
      ...options,
      systemInstruction: this._getFunctionCallingSystemPrompt()
    });

    // Parse and execute function calls from response
    const functionCalls = this._parseFunctionCalls(result.response);
    
    if (functionCalls.length === 0) {
      return { ...result, functionCalls: [], functionResults: [] };
    }

    // Execute function calls
    const functionResults = [];
    for (const call of functionCalls.slice(0, maxFunctionCalls)) {
      try {
        const execResult = await semantics.executeFunction(
          call.domain,
          call.action,
          call.parameters
        );
        functionResults.push({
          call,
          result: execResult,
          success: execResult.success
        });
      } catch (error) {
        functionResults.push({
          call,
          error: error.message,
          success: false
        });
      }
    }

    return {
      ...result,
      functionCalls,
      functionResults,
      executed: functionResults.filter(r => r.success).length
    };
  }

  /**
   * Process an intent through the SemanticsEngine
   * Direct interface for AI to control the OS
   * @param {string} intent - Natural language intent
   * @param {object} context - Execution context
   */
  async processIntent(intent, context = {}) {
    if (!this._kernel?.semantics) {
      throw new Error('Semantics engine not initialized');
    }
    return this._kernel.semantics.processIntent(intent, context);
  }

  /**
   * Get available OS functions for AI context
   */
  getAvailableFunctions() {
    if (!this._kernel?.semantics) return [];
    return this._kernel.semantics.getFunctionDefinitions();
  }

  /**
   * Get current system state for AI context
   */
  getSystemState() {
    if (!this._kernel?.semantics) return null;
    return this._kernel.semantics.getSystemState();
  }

  _buildFunctionCallingPrompt(prompt, context) {
    const { systemState, availableApps, functionCount } = context;
    
    return `User request: "${prompt}"

Current system state:
- Open windows: ${systemState.openWindows.length > 0 
  ? systemState.openWindows.map(w => `${w.title} (${w.type})`).join(', ')
  : 'None'}

Available apps: ${availableApps.slice(0, 10).map(a => a.name).join(', ')}${availableApps.length > 10 ? '...' : ''}

You can control the OS using function calls. If the user wants to open an app, generate an image, or perform any OS action, include a function call in your response.

Format: [[FUNCTION:domain.action({"param": "value"})]]

Examples:
- Open IDE: [[FUNCTION:window_open({"type": "ide"})]]
- Generate image: [[FUNCTION:vertex_generateImage({"prompt": "a cat"})]]
- Focus window: [[FUNCTION:window_focus({"windowId": "win_123"})]]`;
  }

  _getFunctionCallingSystemPrompt() {
    return `You are Aura/Nova, the AI assistant for NovAura OS. You can control the operating system through function calls.

When the user wants to:
- Open/close/focus windows → Use window_* functions
- Generate images/video → Use vertex_* functions  
- Navigate to apps → Use navigate_* functions
- Change settings → Use system_* functions
- Get help/guidance → Use guide_* functions

Always respond naturally, but include function calls when actions are needed.
Function calls should be in the format: [[FUNCTION:domain_action({"param": "value"})]]`;
  }

  _parseFunctionCalls(response) {
    const calls = [];
    const regex = /\[\[FUNCTION:([a-zA-Z_]+)\.([a-zA-Z_]+)\((.*?)\)\]\]/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      try {
        const [, domain, action, paramsStr] = match;
        const parameters = paramsStr ? JSON.parse(paramsStr) : {};
        calls.push({ domain, action, parameters, raw: match[0] });
      } catch (e) {
        console.warn('[AISubsystem] Failed to parse function call:', match[0]);
      }
    }

    return calls;
  }
}

export default AISubsystem;
