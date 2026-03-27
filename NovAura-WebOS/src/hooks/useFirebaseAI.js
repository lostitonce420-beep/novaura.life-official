import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getChatSession,
  sendChatMessage,
  generateContent,
  generateImage,
  countTokens,
  resetChatSession,
  GENERATIVE_MODELS,
  IMAGEN_MODELS,
  isAIAvailable,
} from '../services/firebaseAIService';

/**
 * Hook for Gemini chat
 * @param {Object} options - Chat options
 */
export function useAIChat(options = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const sessionRef = useRef(null);

  const systemInstruction = options.systemInstruction ||
    `You are Nova, the AI assistant for novaura systems. You help users with:
- Writing, coding, and creative tasks
- Answering questions and providing explanations
- Assisting with the NovAura platform features
- Being friendly, helpful, and concise`;

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        sessionRef.current = await getChatSession({
          model: options.model || GENERATIVE_MODELS.FLASH,
          systemInstruction,
          generationConfig: options.generationConfig,
          tools: options.tools,
        });
      } catch (err) {
        setError(err.message);
      }
    };

    if (isAIAvailable()) {
      initSession();
    }

    return () => {
      resetChatSession();
    };
  }, [options.model, systemInstruction]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content, files = []) => {
    if (!content.trim() && files.length === 0) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage = {
      role: 'user',
      content,
      files: files.map(f => f.name),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { stream, response } = await sendChatMessage(content, files, {
        model: options.model,
        systemInstruction,
      });

      // Add assistant placeholder
      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text?.() || '';
        fullText += text;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullText;
          }
          return newMessages;
        });
      }

      // Get final response metadata
      const finalResponse = await response;
      setUsage(finalResponse.usageMetadata);

    } catch (err) {
      setError(err.message);
      console.error('[useAIChat] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [options.model, systemInstruction]);

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    resetChatSession();
    setUsage(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    clearChat,
    isAvailable: isAIAvailable(),
  };
}

/**
 * Hook for one-off content generation
 */
export function useAIGeneration(options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (prompt, params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateContent(prompt, {
        model: options.model || GENERATIVE_MODELS.FLASH,
        ...params,
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options.model]);

  return {
    generate,
    isLoading,
    error,
    isAvailable: isAIAvailable(),
  };
}

/**
 * Hook for Imagen image generation
 */
export function useAIImageGeneration(options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);

  const generate = useCallback(async (prompt, params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateImage(prompt, {
        model: options.model || IMAGEN_MODELS.GENERATE,
        numberOfImages: options.numberOfImages || 1,
        aspectRatio: options.aspectRatio || '1:1',
        ...params,
      });

      setImages(result.images);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options.model, options.numberOfImages, options.aspectRatio]);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    generate,
    images,
    isLoading,
    error,
    clearImages,
    isAvailable: isAIAvailable(),
  };
}

/**
 * Hook for token counting
 */
export function useAITokenCounter() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const countText = useCallback(async (text) => {
    setIsLoading(true);
    try {
      const tokenCount = await countTokens(text);
      setCount(tokenCount);
      return tokenCount;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    count,
    countText,
    isLoading,
    isAvailable: isAIAvailable(),
  };
}

/**
 * Hook for Nova Assistant (specialized for NovAura)
 */
export function useNovaAssistant() {
  const {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    clearChat,
    isAvailable,
  } = useAIChat({
    systemInstruction: `You are Nova, the AI assistant for novaura systems. You help users navigate the platform, complete tasks, and provide creative assistance.

Key capabilities you can help with:
- Writing, coding, and content creation
- Domain management and website building
- Image generation and editing
- File management and organization
- Social networking within the platform
- Analytics and business operations

Be friendly, helpful, and concise. If you don't know something, say so honestly.`,
  });

  const suggestAction = useCallback(async (context) => {
    const prompt = `Based on this context: "${context}", what would be the most helpful next action for the user? Suggest one specific thing they might want to do.`;

    try {
      const result = await generateContent(prompt);
      return result.text;
    } catch {
      return null;
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    clearChat,
    suggestAction,
    isAvailable,
  };
}
