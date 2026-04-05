/**
 * NovAura Firebase AI Service
 *
 * Unified AI service using Firebase AI SDK:
 * - Gemini (text/chat)
 * - Imagen (image generation)
 * - Live API (real-time audio/video)
 */

import { ai, isFirebaseConfigured } from '../config/firebase';

// Available models
export const GENERATIVE_MODELS = {
  FLASH: 'gemini-2.5-flash',           // Default: fast, free for conversation
  FLASH_LITE: 'gemini-2.5-flash-lite', // Ultra-fast, lowest latency
  FLASH_EXP: 'gemini-2.0-flash-exp',
  FLASH_25: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',               // Most capable
  PRO_EXP: 'gemini-2.0-pro-exp',
};

export const IMAGEN_MODELS = {
  GENERATE: 'imagen-4.0-generate-001',
  FAST: 'imagen-4.0-fast-generate-001',
  ULTRA: 'imagen-4.0-ultra-generate-001',
};

// Default generation config
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.9,
  maxOutputTokens: 2048,
};

// Safety settings
export const DEFAULT_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

/**
 * Get Firebase AI instance (lazy loaded)
 */
export function getAIInstance() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase not configured');
  }
  if (!ai) {
    // Fallback: try to load dynamically
    return Promise.all([
      import('firebase/ai'),
      import('../config/firebase'),
    ]).then(([{ getAI, GoogleAIBackend }, { app }]) => {
      return getAI(app, { backend: new GoogleAIBackend() });
    });
  }
  return Promise.resolve(ai);
}

// ═══════════════════════════════════════════════════════════════
// GEMINI CHAT
// ═══════════════════════════════════════════════════════════════

let currentChatSession = null;
let currentModelParams = null;

/**
 * Initialize or get a chat session
 * @param {Object} params - Model parameters
 * @param {Array} history - Chat history
 */
export async function getChatSession(params = {}, history = []) {
  const { getGenerativeModel } = await import('firebase/ai');
  const aiInstance = await getAIInstance();
  
  const modelParams = {
    model: params.model || GENERATIVE_MODELS.FLASH,
    generationConfig: { ...DEFAULT_GENERATION_CONFIG, ...params.generationConfig },
    safetySettings: params.safetySettings || DEFAULT_SAFETY_SETTINGS,
    systemInstruction: params.systemInstruction,
    tools: params.tools,
    toolConfig: params.toolConfig,
  };

  // Check if we can reuse existing session
  const paramsChanged = JSON.stringify(modelParams) !== JSON.stringify(currentModelParams);
  
  if (!currentChatSession || paramsChanged) {
    const model = getGenerativeModel(aiInstance, modelParams);
    currentChatSession = model.startChat({
      history,
      safetySettings: modelParams.safetySettings,
      generationConfig: modelParams.generationConfig,
      tools: modelParams.tools,
      toolConfig: modelParams.toolConfig,
      systemInstruction: modelParams.systemInstruction,
    });
    currentModelParams = modelParams;
  }

  return currentChatSession;
}

/**
 * Send a message to the chat
 * @param {string} message - User message
 * @param {Array} files - Optional files (images, etc.)
 * @param {Object} params - Optional params override
 */
export async function sendChatMessage(message, files = [], params = {}) {
  try {
    const session = await getChatSession(params);
    
    const parts = [{ text: message }];
    
    // Add files if provided
    if (files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          parts.push({
            inlineData: {
              mimeType: file.type,
              data: base64,
            },
          });
        }
      }
    }

    // Stream the response
    const result = await session.sendMessageStream(parts);
    
    return {
      stream: result.stream,
      response: result.response,
    };
  } catch (error) {
    console.error('[Firebase AI] Chat error:', error);
    throw error;
  }
}

/**
 * Send a one-off message (non-streaming)
 * @param {string} prompt - User prompt
 * @param {Object} params - Model params
 */
export async function generateContent(prompt, params = {}) {
  try {
    const { getGenerativeModel } = await import('firebase/ai');
    const aiInstance = await getAIInstance();
    
    const modelParams = {
      model: params.model || GENERATIVE_MODELS.FLASH,
      generationConfig: { ...DEFAULT_GENERATION_CONFIG, ...params.generationConfig },
      safetySettings: params.safetySettings || DEFAULT_SAFETY_SETTINGS,
      systemInstruction: params.systemInstruction,
    };

    const model = getGenerativeModel(aiInstance, modelParams);
    const result = await model.generateContent(prompt);
    
    return {
      text: result.response.text(),
      usage: result.response.usageMetadata,
    };
  } catch (error) {
    console.error('[Firebase AI] Generation error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// IMAGEN IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate images using Imagen
 * @param {string} prompt - Image description
 * @param {Object} options - Generation options
 */
export async function generateImage(prompt, options = {}) {
  try {
    const { getImagenModel } = await import('firebase/ai');
    const aiInstance = await getAIInstance();
    
    const modelParams = {
      model: options.model || IMAGEN_MODELS.GENERATE,
      generationConfig: {
        numberOfImages: options.numberOfImages || 1,
        aspectRatio: options.aspectRatio || '1:1',
        ...options.generationConfig,
      },
    };

    const model = getImagenModel(aiInstance, modelParams);
    const result = await model.generateImages(prompt);
    
    return {
      images: result.images,
      filtered: result.filtered,
    };
  } catch (error) {
    console.error('[Firebase AI] Imagen error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// LIVE API (Real-time)
// ═══════════════════════════════════════════════════════════════

let liveSession = null;

/**
 * Initialize a live (real-time) session
 * @param {Object} params - Live session params
 */
export async function initLiveSession(params = {}) {
  try {
    const { getLiveSession, GoogleAIBackend } = await import('firebase/ai');
    const aiInstance = await getAIInstance();
    
    const liveConfig = {
      model: params.model || 'gemini-2.5-flash-native-audio-preview',
      generationConfig: {
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: params.voice || 'Puck',
            },
          },
        },
        ...params.generationConfig,
      },
    };

    liveSession = await getLiveSession(aiInstance, liveConfig);
    
    // Set up audio input/output handling
    if (params.onAudioOutput) {
      liveSession.on('audio-output', params.onAudioOutput);
    }
    
    if (params.onMessage) {
      liveSession.on('message', params.onMessage);
    }
    
    if (params.onError) {
      liveSession.on('error', params.onError);
    }

    return liveSession;
  } catch (error) {
    console.error('[Firebase AI] Live session error:', error);
    throw error;
  }
}

/**
 * Send audio to live session
 * @param {Blob} audioBlob - Audio data
 */
export async function sendLiveAudio(audioBlob) {
  if (!liveSession) {
    throw new Error('Live session not initialized');
  }
  
  const arrayBuffer = await audioBlob.arrayBuffer();
  liveSession.sendAudioInput(new Uint8Array(arrayBuffer));
}

/**
 * Close live session
 */
export function closeLiveSession() {
  if (liveSession) {
    liveSession.close();
    liveSession = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Count tokens in a prompt
 * @param {string} text - Text to count
 * @param {Object} params - Model params
 */
export async function countTokens(text, params = {}) {
  try {
    const { getGenerativeModel } = await import('firebase/ai');
    const aiInstance = await getAIInstance();
    
    const model = getGenerativeModel(aiInstance, {
      model: params.model || GENERATIVE_MODELS.FLASH,
    });
    
    const result = await model.countTokens(text);
    return result.totalTokens;
  } catch (error) {
    console.error('[Firebase AI] Token count error:', error);
    return 0;
  }
}

/**
 * Convert file to base64
 * @param {File} file - File to convert
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Reset chat session (start fresh)
 */
export function resetChatSession() {
  currentChatSession = null;
  currentModelParams = null;
}

/**
 * Check if Firebase AI is available
 */
export function isAIAvailable() {
  return isFirebaseConfigured && !!ai;
}
