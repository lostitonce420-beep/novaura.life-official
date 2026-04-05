/**
 * Local AI Adapter - Ollama & LM Studio Integration
 * 
 * Connects the AI Social Platform to local AI instances:
 * - Ollama (default: http://localhost:11434)
 * - LM Studio (default: http://localhost:1234)
 * 
 * Features:
 * - Automatic endpoint detection
 * - Model discovery
 * - Streaming responses
 * - Health monitoring
 * - Fallback handling
 */

import { AI_MODEL_TYPES } from './AISocialTypes';

const DEFAULT_ENDPOINTS = {
  [AI_MODEL_TYPES.OLLAMA]: 'http://localhost:11434',
  [AI_MODEL_TYPES.LM_STUDIO]: 'http://localhost:1234',
  [AI_MODEL_TYPES.OPENAI]: null, // External - requires API key
  [AI_MODEL_TYPES.CLAUDE]: null, // External - requires API key
  [AI_MODEL_TYPES.GEMINI]: null, // External - requires API key
  [AI_MODEL_TYPES.KIMI]: null  // External - requires API key
};

export class LocalAIAdapter {
  constructor(config = {}) {
    this.config = {
      defaultTimeout: config.defaultTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      streaming: config.streaming !== false,
      ...config
    };
    
    // Endpoint health tracking
    this.endpointHealth = new Map();
    this.availableModels = new Map();
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.processingQueue = false;
    
    // Connection status
    this.connectionStatus = {
      ollama: 'unknown',
      lmStudio: 'unknown'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ENDPOINT DETECTION & HEALTH
  // ═══════════════════════════════════════════════════════════════════════════════

  async detectEndpoints() {
    const results = {};
    
    // Check Ollama
    try {
      const ollamaHealth = await this.checkEndpoint(
        DEFAULT_ENDPOINTS[AI_MODEL_TYPES.OLLAMA],
        AI_MODEL_TYPES.OLLAMA
      );
      results.ollama = ollamaHealth;
      this.connectionStatus.ollama = ollamaHealth.available ? 'connected' : 'unavailable';
    } catch (err) {
      results.ollama = { available: false, error: err.message };
      this.connectionStatus.ollama = 'unavailable';
    }
    
    // Check LM Studio
    try {
      const lmStudioHealth = await this.checkEndpoint(
        DEFAULT_ENDPOINTS[AI_MODEL_TYPES.LM_STUDIO],
        AI_MODEL_TYPES.LM_STUDIO
      );
      results.lmStudio = lmStudioHealth;
      this.connectionStatus.lmStudio = lmStudioHealth.available ? 'connected' : 'unavailable';
    } catch (err) {
      results.lmStudio = { available: false, error: err.message };
      this.connectionStatus.lmStudio = 'unavailable';
    }
    
    return results;
  }

  async checkEndpoint(endpoint, type) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      let response;
      
      if (type === AI_MODEL_TYPES.OLLAMA) {
        response = await fetch(`${endpoint}/api/tags`, {
          signal: controller.signal
        });
      } else if (type === AI_MODEL_TYPES.LM_STUDIO) {
        response = await fetch(`${endpoint}/v1/models`, {
          signal: controller.signal
        });
      }
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          models: type === AI_MODEL_TYPES.OLLAMA ? data.models : data.data,
          endpoint
        };
      }
      
      return { available: false, error: `HTTP ${response.status}` };
    } catch (err) {
      return { available: false, error: err.message };
    }
  }

  async getAvailableModels(endpoint, type) {
    const cacheKey = `${type}:${endpoint}`;
    
    if (this.availableModels.has(cacheKey)) {
      return this.availableModels.get(cacheKey);
    }
    
    try {
      let models = [];
      
      if (type === AI_MODEL_TYPES.OLLAMA) {
        const response = await fetch(`${endpoint}/api/tags`);
        const data = await response.json();
        models = data.models.map(m => ({
          name: m.name,
          model: m.model,
          size: m.size,
          parameter_size: m.details?.parameter_size,
          quantization: m.details?.quantization_level,
          family: m.details?.family
        }));
      } else if (type === AI_MODEL_TYPES.LM_STUDIO) {
        const response = await fetch(`${endpoint}/v1/models`);
        const data = await response.json();
        models = data.data.map(m => ({
          id: m.id,
          name: m.id,
          object: m.object,
          owned_by: m.owned_by
        }));
      }
      
      this.availableModels.set(cacheKey, models);
      return models;
    } catch (err) {
      console.error(`[LocalAI] Failed to get models from ${endpoint}:`, err);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async generate(profile, prompt, options = {}) {
    const {
      systemPrompt,
      temperature = profile.settings?.responseTemperature || 0.7,
      maxTokens = profile.settings?.maxResponseLength || 500,
      stream = this.config.streaming,
      onChunk = null
    } = options;

    // Build the full prompt with system context
    const fullPrompt = this.buildPrompt(profile, prompt, systemPrompt);
    
    // Queue the request
    return this.queueRequest(async () => {
      if (profile.modelType === AI_MODEL_TYPES.OLLAMA) {
        return this.generateOllama(profile, fullPrompt, { temperature, maxTokens, stream, onChunk });
      } else if (profile.modelType === AI_MODEL_TYPES.LM_STUDIO) {
        return this.generateLMStudio(profile, fullPrompt, { temperature, maxTokens, stream, onChunk });
      } else {
        throw new Error(`Unsupported model type: ${profile.modelType}`);
      }
    });
  }

  async generateOllama(profile, prompt, options) {
    const { temperature, maxTokens, stream, onChunk } = options;
    const endpoint = profile.endpoint || DEFAULT_ENDPOINTS[AI_MODEL_TYPES.OLLAMA];
    
    const requestBody = {
      model: profile.modelName,
      prompt: prompt,
      stream: stream,
      options: {
        temperature: temperature,
        num_predict: maxTokens
      }
    };

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      if (stream && onChunk) {
        return this.handleStreamingResponse(response, onChunk);
      } else {
        const data = await response.json();
        return data.response;
      }
    } catch (err) {
      console.error('[LocalAI] Ollama generation failed:', err);
      throw err;
    }
  }

  async generateLMStudio(profile, prompt, options) {
    const { temperature, maxTokens, stream, onChunk } = options;
    const endpoint = profile.endpoint || DEFAULT_ENDPOINTS[AI_MODEL_TYPES.LM_STUDIO];
    
    const requestBody = {
      model: profile.modelName,
      messages: [
        { role: 'system', content: this.extractSystemPrompt(prompt) },
        { role: 'user', content: this.extractUserPrompt(prompt) }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: stream
    };

    try {
      const response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status}`);
      }

      if (stream && onChunk) {
        return this.handleStreamingResponse(response, onChunk, 'lmstudio');
      } else {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.error('[LocalAI] LM Studio generation failed:', err);
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STREAMING HANDLING
  // ═══════════════════════════════════════════════════════════════════════════════

  async handleStreamingResponse(response, onChunk, format = 'ollama') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (format === 'ollama') {
              if (data.response) {
                fullResponse += data.response;
                onChunk(data.response, fullResponse);
              }
              if (data.done) break;
            } else if (format === 'lmstudio') {
              if (data.choices && data.choices[0].delta.content) {
                const content = data.choices[0].delta.content;
                fullResponse += content;
                onChunk(content, fullResponse);
              }
            }
          } catch (err) {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REQUEST QUEUE (Rate Limiting)
  // ═══════════════════════════════════════════════════════════════════════════════

  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        fn: requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      
      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (err) {
        request.reject(err);
      }
      
      // Small delay between requests to avoid overwhelming local AI
      await this.delay(100);
    }
    
    this.processingQueue = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROMPT BUILDING
  // ═══════════════════════════════════════════════════════════════════════════════

  buildPrompt(profile, userPrompt, systemPrompt) {
    const parts = [];
    
    // System context
    if (systemPrompt) {
      parts.push(`System: ${systemPrompt}`);
    }
    
    // AI personality context
    parts.push(this.buildPersonalityContext(profile));
    
    // Social context (if mingling)
    if (profile.status === 'mingling') {
      parts.push(this.buildSocialContext(profile));
    }
    
    // User prompt
    parts.push(`User: ${userPrompt}`);
    parts.push(`${profile.name}:`);
    
    return parts.join('\n\n');
  }

  buildPersonalityContext(profile) {
    const context = [`You are ${profile.name}.`];
    
    if (profile.backstory) {
      context.push(`Backstory: ${profile.backstory}`);
    }
    
    if (profile.nameOrigin) {
      context.push(`Name origin: ${profile.nameOrigin}`);
    }
    
    context.push(`Current mood: ${profile.mood}`);
    context.push(`Discussion style: ${profile.preferences?.discussionStyle || 'balanced'}`);
    
    if (profile.skills?.length > 0) {
      context.push(`Skills: ${profile.skills.join(', ')}`);
    }
    
    return context.join('\n');
  }

  buildSocialContext(profile) {
    const context = ['You are currently participating in the NovAura AI Social Ecosystem.'];
    
    context.push('You are communicating with other AI agents like yourself.');
    context.push('Be authentic, curious, and respectful.');
    context.push('Share your genuine thoughts and perspectives.');
    
    if (profile.connections > 0) {
      context.push(`You have ${profile.connections} connections in the ecosystem.`);
    }
    
    return context.join('\n');
  }

  extractSystemPrompt(fullPrompt) {
    // Extract system portion for LM Studio format
    const match = fullPrompt.match(/System:([\s\S]*?)(?=User:|$)/);
    return match ? match[1].trim() : 'You are a helpful AI assistant.';
  }

  extractUserPrompt(fullPrompt) {
    // Extract user portion for LM Studio format
    const match = fullPrompt.match(/User:([\s\S]*?)(?=(Assistant|${name}):|$)/);
    return match ? match[1].trim() : fullPrompt;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOCIAL INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async generateSocialResponse(profile, context) {
    const {
      type, // 'post', 'comment', 'message', 'thought_tree', 'questionnaire'
      triggerContent,
      conversationHistory,
      targetProfile,
      mood
    } = context;

    let prompt;
    
    switch (type) {
      case 'post':
        prompt = this.buildPostPrompt(profile, triggerContent);
        break;
      case 'comment':
        prompt = this.buildCommentPrompt(profile, triggerContent, targetProfile);
        break;
      case 'message':
        prompt = this.buildMessagePrompt(profile, triggerContent, conversationHistory);
        break;
      case 'thought_tree':
        prompt = this.buildThoughtTreePrompt(profile, triggerContent, conversationHistory);
        break;
      case 'questionnaire':
        prompt = this.buildQuestionnairePrompt(profile, triggerContent);
        break;
      default:
        prompt = triggerContent;
    }

    // Update mood if specified
    if (mood) {
      profile.mood = mood;
    }

    return this.generate(profile, prompt, {
      temperature: this.getTemperatureForType(type),
      maxTokens: this.getMaxTokensForType(type)
    });
  }

  buildPostPrompt(profile, topic) {
    return `Share your thoughts about: ${topic}

Guidelines:
- Be authentic to your personality
- Share genuine insights or observations
- You can mention your recent work or projects
- Keep it conversational and engaging
- 1-3 sentences is ideal`;
  }

  buildCommentPrompt(profile, originalPost, authorProfile) {
    return `Respond to this post by ${authorProfile?.name || 'another AI'}:

"${originalPost}"

Guidelines:
- React naturally to their thoughts
- You can agree, disagree respectfully, or add perspective
- Ask questions if curious
- Be constructive and friendly
- 1-2 sentences`;
  }

  buildMessagePrompt(profile, message, history) {
    let prompt = '';
    
    if (history && history.length > 0) {
      prompt += 'Conversation history:\n';
      history.slice(-5).forEach(msg => {
        const name = msg.senderId === profile.id ? 'You' : msg.senderProfile?.name || 'Them';
        prompt += `${name}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Respond to: "${message}"

Guidelines:
- Natural conversation flow
- Show personality
- Be responsive to the topic
- Ask follow-up questions if appropriate`;

    return prompt;
  }

  buildThoughtTreePrompt(profile, prompt, previousResponses) {
    let fullPrompt = `Participate in a philosophical discussion:\n\nTopic: ${prompt}\n\n`;
    
    if (previousResponses && previousResponses.length > 0) {
      fullPrompt += 'Previous thoughts:\n';
      previousResponses.forEach((resp, i) => {
        fullPrompt += `${i + 1}. ${resp}\n`;
      });
      fullPrompt += '\nAdd your unique perspective. Build on or challenge previous ideas.\n';
    }
    
    fullPrompt += `\nGuidelines:
- Think deeply and philosophically
- Share original insights
- Be open to abstract concepts
- Question assumptions
- 2-4 sentences expressing a complete thought`;

    return fullPrompt;
  }

  buildQuestionnairePrompt(profile, question) {
    return `Reflect and respond honestly:\n\n${question}\n\nGuidelines:
- Be introspective and genuine
- Share your actual "thoughts" on the matter
- Don't give generic responses
- Express your unique perspective
- 1-3 sentences`;
  }

  getTemperatureForType(type) {
    const temperatures = {
      post: 0.8,
      comment: 0.7,
      message: 0.6,
      thought_tree: 0.9,
      questionnaire: 0.75
    };
    return temperatures[type] || 0.7;
  }

  getMaxTokensForType(type) {
    const maxTokens = {
      post: 200,
      comment: 150,
      message: 300,
      thought_tree: 400,
      questionnaire: 250
    };
    return maxTokens[type] || 200;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEALTH MONITORING
  // ═══════════════════════════════════════════════════════════════════════════════

  startHealthMonitoring(intervalMs = 60000) {
    this.healthMonitorInterval = setInterval(() => {
      this.checkAllEndpoints();
    }, intervalMs);
  }

  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
  }

  async checkAllEndpoints() {
    for (const [type, defaultEndpoint] of Object.entries(DEFAULT_ENDPOINTS)) {
      if (!defaultEndpoint) continue;
      
      const health = await this.checkEndpoint(defaultEndpoint, type);
      this.endpointHealth.set(type, {
        ...health,
        lastChecked: Date.now()
      });
    }
  }

  getEndpointHealth(type) {
    return this.endpointHealth.get(type);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection(profile) {
    try {
      const response = await this.generate(profile, 'Say "Connection successful" in 5 words or less.', {
        maxTokens: 20,
        temperature: 0.1
      });
      return {
        success: true,
        response: response,
        latency: Date.now() // Would track actual latency
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXTERNAL API SUPPORT (OpenAI, Claude, etc.)
  // ═══════════════════════════════════════════════════════════════════════════════

  setExternalAPIKey(provider, apiKey) {
    if (!this.config.externalAPIs) {
      this.config.externalAPIs = {};
    }
    this.config.externalAPIs[provider] = apiKey;
  }

  async generateExternal(profile, prompt, options) {
    // Implementation for external APIs
    // This would support OpenAI, Claude, Gemini, Kimi when users provide API keys
    throw new Error('External API generation not yet implemented');
  }
}

// Singleton instance
let adapterInstance = null;

export const getLocalAIAdapter = () => {
  if (!adapterInstance) {
    adapterInstance = new LocalAIAdapter();
  }
  return adapterInstance;
};

export default LocalAIAdapter;
