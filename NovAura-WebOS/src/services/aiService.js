/**
 * NovAura AI Service — Centralized API layer
 *
 * All AI calls route through here. Handles:
 * - Cloud providers via backend proxy (Gemini, Claude, OpenAI, Kimi, Vertex)
 * - Local LLM direct-from-browser (Ollama, LM Studio)
 * - Smart routing based on task category and llmConfig
 * - Auth headers, error handling, provider fallback
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://us-central1-novaura-o-s-63232239-3ee79.cloudfunctions.net/api';

// ─── Auth ──────────────────────────────────────────────────────────────

export function getAuthHeaders() {
  const token = localStorage.getItem('novaura-auth-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Provider Status ───────────────────────────────────────────────────

/** Check which cloud AI providers the backend has configured */
export async function getProviderStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/ai/providers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.providers || {};
  } catch {
    return {};
  }
}

/** Health check — also returns provider info */
export async function checkHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    return await res.json();
  } catch {
    return { status: 'unreachable' };
  }
}

// ─── Cloud AI (via backend proxy) ──────────────────────────────────────

/**
 * Chat with a cloud AI provider through the backend
 * @param {string} prompt - User message
 * @param {object} options - { provider, model, maxTokens, temperature, conversation }
 */
export async function chatCloud(prompt, options = {}) {
  const res = await fetch(`${BACKEND_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      message: prompt,
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      conversation: options.conversation || [],
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.detail || `AI request failed (${res.status})`);
  }

  return {
    response: data.response,
    source: data.source || 'cloud',
    model: data.model,
    rateLimit: data.rate_limit,
  };
}

/**
 * Generate code or website through the builder endpoint
 * @param {string} prompt - Generation prompt
 * @param {object} options - { provider, model, mode, template, files, maxTokens }
 */
export async function generateCode(prompt, options = {}) {
  const res = await fetch(`${BACKEND_URL}/ai/builder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      prompt,
      provider: options.provider,
      model: options.model,
      mode: options.mode || 'code',
      template: options.template,
      files: options.files || [],
      maxTokens: options.maxTokens || 4096,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Builder generation failed (${res.status})`);
  }

  return {
    code: data.generated_code,
    html: data.html,
    css: data.css,
    js: data.js,
    source: data.source,
    model: data.model,
    rateLimit: data.rate_limit,
  };
}

/**
 * Generate a website
 * @param {string} prompt - Description of the website
 * @param {string} template - Template ID (landing, portfolio, etc.)
 * @param {object} requirements - { responsive, modern, framework }
 */
export async function generateWebsite(prompt, template, requirements = {}) {
  const res = await fetch(`${BACKEND_URL}/ai/website/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt, template, requirements }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Website generation failed (${res.status})`);
  }

  return {
    html: data.html || '',
    css: data.css || '',
    js: data.js || '',
    raw: data.raw,
    source: data.source,
    model: data.model,
    rateLimit: data.rate_limit,
  };
}

/**
 * Generate an image via Vertex Imagen
 * @param {string} prompt - Image description
 * @param {string} aspectRatio - e.g. "1:1", "16:9"
 */
export async function generateImage(prompt, aspectRatio = '1:1') {
  const res = await fetch(`${BACKEND_URL}/ai/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Image generation failed (${res.status})`);
  }

  return { imageUrl: data.imageUrl };
}

/**
 * Generate a video via Vertex AI (Veo or Imagen Video)
 * @param {string} prompt - Video description
 * @param {object} options - { duration, aspectRatio }
 */
export async function generateVideo(prompt, options = {}) {
  const res = await fetch(`${BACKEND_URL}/ai/video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ 
      prompt, 
      duration: options.duration || 8,
      aspectRatio: options.aspectRatio || '16:9',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Video generation failed (${res.status})`);
  }

  return { videoUrl: data.videoUrl };
}

/** Get Gemini API key for live WebSocket connections */
export async function getGeminiLiveKey() {
  const res = await fetch(`${BACKEND_URL}/ai/live-key`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.configured) {
    throw new Error(data.error || 'Gemini Live not configured');
  }
  return data.key;
}

// ─── Local LLM (direct browser connection) ─────────────────────────────

/**
 * Chat with a local LLM (Ollama or LM Studio) directly from the browser
 * @param {string} message - User message
 * @param {object} config - { url, type, model }
 */
/**
 * Chat with a local LLM (Ollama or LM Studio) directly from the browser
 * @param {string} message - User message
 * @param {object} config - { url, type, model, systemPrompt, conversation }
 */
export async function chatLocal(message, config) {
  const url = config.url.replace(/\/$/, '');

  if (config.type === 'ollama') {
    // Use /api/chat for conversation support (not /api/generate)
    const messages = [];
    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    }
    // Append conversation history if provided
    if (config.conversation?.length) {
      messages.push(...config.conversation);
    }
    messages.push({ role: 'user', content: message });

    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3.1:8b',
        messages,
        stream: false,
        options: {
          temperature: config.temperature ?? 0.7,
          num_predict: config.maxTokens || 1024,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return {
      response: data.message?.content || data.response || 'No response from Ollama',
      source: `ollama (${config.model})`,
      model: config.model,
    };
  }

  // LM Studio / OpenAI-compatible
  const messages = [];
  if (config.systemPrompt) {
    messages.push({ role: 'system', content: config.systemPrompt });
  }
  if (config.conversation?.length) {
    messages.push(...config.conversation);
  }
  messages.push({ role: 'user', content: message });

  const res = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'local-model',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens || 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`LM Studio error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || 'No response';
  return {
    response: content,
    source: `lmstudio (${config.model})`,
    model: config.model,
  };
}

/**
 * Probe a local Ollama server and return available models
 * @param {string} url - Ollama base URL (default localhost:11434)
 * @returns {{ connected: boolean, models: string[], error?: string }}
 */
export async function probeOllama(url = 'http://localhost:11434') {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { connected: false, models: [], error: `Status ${res.status}` };
    const data = await res.json();
    const models = (data.models || []).map(m => m.name || 'unknown');
    return { connected: true, models };
  } catch (e) {
    return { connected: false, models: [], error: e.message };
  }
}

/**
 * Build a default task routing config based on available local models
 * Maps task categories to the best available model for that job
 */
export function buildTaskRouting(models = []) {
  const has = (q) => models.some(m => m.toLowerCase().includes(q));

  // Pick best model per category from what's available
  const codingModel = has('qwen3-coder') ? models.find(m => m.includes('qwen3-coder'))
    : has('qwen3:4b') ? 'qwen3:4b'
    : has('qwen3') ? models.find(m => m.includes('qwen3'))
    : has('llama3') ? models.find(m => m.includes('llama3'))
    : models[0];

  const chatModel = has('llama3.1:8b') ? 'llama3.1:8b'
    : has('llama3') ? models.find(m => m.includes('llama3'))
    : has('gemma3:4b') ? 'gemma3:4b'
    : has('gemma3') ? models.find(m => m.includes('gemma3'))
    : models[0];

  const fastModel = has('gemma3:1b') ? 'gemma3:1b'
    : has('functiongemma') ? models.find(m => m.includes('functiongemma'))
    : models[0];

  return {
    general: { provider: 'ollama', model: chatModel },
    conversations: { provider: 'ollama', model: chatModel },
    coding: { provider: 'ollama', model: codingModel },
    creative: { provider: 'ollama', model: chatModel },
    analysis: { provider: 'ollama', model: chatModel },
    quick: { provider: 'ollama', model: fastModel },
  };
}

// ─── Smart Router ──────────────────────────────────────────────────────

/**
 * Resolve which provider to use based on llmConfig and task category.
 * Returns a config object for either local or cloud routing.
 *
 * @param {string} taskCategory - 'general', 'coding', 'conversations', etc.
 * @param {object} llmConfig - From localStorage llm_config
 */
export function resolveProvider(taskCategory = 'general', llmConfig = {}) {
  const routing = llmConfig?.taskRouting?.[taskCategory]
    || llmConfig?.taskRouting?.general
    || { provider: 'auto', model: '' };

  if (routing.provider === 'ollama') {
    return {
      type: 'local',
      localType: 'ollama',
      url: llmConfig.ollamaUrl || 'http://localhost:11434',
      model: routing.model || llmConfig.ollamaModels?.[0] || 'llama3.1:8b',
    };
  }
  if (routing.provider === 'lmstudio') {
    return {
      type: 'local',
      localType: 'lmstudio',
      url: llmConfig.lmstudioUrl || 'http://localhost:1234',
      model: routing.model || llmConfig.lmstudioModels?.[0] || 'local-model',
    };
  }
  if (['gemini', 'claude', 'openai', 'kimi'].includes(routing.provider)) {
    return { type: 'cloud', provider: routing.provider, model: routing.model };
  }

  // Auto: try local first, fallback to cloud
  if (llmConfig?.useLocalLLM && llmConfig?.localLLMUrl) {
    const url = llmConfig.localLLMUrl.replace(/\/$/, '');
    const isOllama = url.includes(':11434') || url.toLowerCase().includes('ollama');
    return {
      type: 'local',
      localType: isOllama ? 'ollama' : 'lmstudio',
      url,
      model: llmConfig.availableModels?.[0] || (isOllama ? 'llama2' : 'local-model'),
    };
  }

  return { type: 'cloud', provider: undefined }; // let backend pick best available
}

/**
 * Smart chat — routes to local or cloud based on llmConfig
 * @param {string} message - User message
 * @param {string} taskCategory - Task routing category
 * @param {object} llmConfig - From localStorage llm_config
 * @returns {{ response: string, source: string, model?: string }}
 */
export async function smartChat(message, taskCategory = 'general', llmConfig = {}) {
  const resolved = resolveProvider(taskCategory, llmConfig);

  if (resolved.type === 'local') {
    try {
      return await chatLocal(message, {
        url: resolved.url,
        type: resolved.localType,
        model: resolved.model,
      });
    } catch (localError) {
      console.warn('Local LLM failed, falling back to cloud:', localError);
      // Fall through to cloud
    }
  }

  return await chatCloud(message, {
    provider: resolved.provider,
    model: resolved.model,
  });
}
