import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

const PROVIDERS: Record<string, any> = {
  gemini: {
    url: (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    headers: { 'Content-Type': 'application/json' },
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: temp, maxOutputTokens: maxTokens }
    }),
    parseResponse: (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  },
  claude: {
    url: () => 'https://api.anthropic.com/v1/messages',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      temperature: temp
    }),
    parseResponse: (data: any) => data.content?.[0]?.text || ''
  },
  openai: {
    url: () => 'https://api.openai.com/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  kimi: {
    url: () => 'https://api.moonshot.cn/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  alibaba: {
    // Native Alibaba format (not OpenAI-compatible)
    url: () => 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'qwen-turbo',
      input: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ]
      },
      parameters: {
        max_tokens: maxTokens,
        temperature: temp,
        result_format: 'message'
      }
    }),
    parseResponse: (data: any) => {
      // Alibaba native format: data.output.choices[0].message.content
      return data.output?.choices?.[0]?.message?.content 
        || data.output?.text 
        || '';
    }
  }
};

router.post('/chat', async (req, res) => {
  try {
    const { provider, prompt, maxTokens = 1024, temperature = 0.7 } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const selectedProvider = provider || detectProvider();
    const config = PROVIDERS[selectedProvider];
    
    if (!config) {
      res.status(400).json({ error: `Unknown provider: ${selectedProvider}` });
      return;
    }

    const apiKey = getApiKey(selectedProvider);
    if (!apiKey) {
      res.status(503).json({ error: `${selectedProvider} not configured` });
      return;
    }

    const response = await fetch(config.url(apiKey), {
      method: 'POST',
      headers: typeof config.headers === 'function' ? config.headers(apiKey) : config.headers,
      body: JSON.stringify(config.formatBody(prompt, maxTokens, temperature))
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: `${selectedProvider} error: ${response.status}`,
        detail: err.error?.message || err.message 
      });
      return;
    }

    const data = await response.json();
    const content = config.parseResponse(data);

    res.json({
      success: true,
      response: content,
      provider: selectedProvider,
      model: selectedProvider
    });
  } catch (err: any) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

router.get('/providers', (req, res) => {
  res.json({
    providers: {
      gemini: !!process.env.GEMINI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      kimi: !!process.env.KIMI_API_KEY,
      alibaba: !!process.env.ALIBABA_API_KEY
    }
  });
});

/**
 * Get live API key for client-side services (Gemini Live, etc.)
 * Requires Firebase Auth
 */
router.get('/live-key', async (req, res) => {
  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    
    if (!decoded.uid) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Return Gemini key securely
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(503).json({ error: 'Gemini not configured' });
      return;
    }
    
    res.json({
      key: geminiKey,
      provider: 'gemini',
      user: decoded.uid
    });
  } catch (err: any) {
    console.error('Live key error:', err);
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ai: 'ready',
    providers: Object.keys(PROVIDERS).filter(p => getApiKey(p))
  });
});

function getApiKey(provider: string): string | undefined {
  const keys: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    kimi: process.env.KIMI_API_KEY,
    alibaba: process.env.ALIBABA_API_KEY
  };
  return keys[provider];
}

// CHEAPEST FIRST for 192k user launch
// Priority: Alibaba (cheap) > Kimi (cheap) > Gemini (free tier) > OpenAI > Claude (expensive)
function detectProvider(): string {
  if (process.env.ALIBABA_API_KEY) return 'alibaba';      // Qwen - cheapest
  if (process.env.KIMI_API_KEY) return 'kimi';            // Moonshot - cheap
  if (process.env.GEMINI_API_KEY) return 'gemini';        // Google - free tier
  if (process.env.OPENAI_API_KEY) return 'openai';        // GPT-4o - $$$ 
  if (process.env.CLAUDE_API_KEY) return 'claude';        // Anthropic - $$$$
  return 'gemini';
}

export default router;
