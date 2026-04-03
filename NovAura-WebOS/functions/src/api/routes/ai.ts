import { Router } from 'express';
import * as admin from 'firebase-admin';
import { secretService } from '../../services/secretService';

const router = Router();

const PROVIDERS: Record<string, any> = {
  // AIML API — unified gateway (primary, works)
  aiml: {
    url: () => 'https://api.aimlapi.com/v1/chat/completions',
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
  // Alias for anthropic
  anthropic: {
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
  // Azure AI Foundry (Primary)
  azure: {
    url: () => process.env.AZURE_OPENAI_ENDPOINT || 'https://novauralife-resource.openai.azure.com/openai/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'api-key': key
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  // Azure OpenAI alias
  azure_openai: {
    url: () => process.env.AZURE_OPENAI_ENDPOINT || 'https://novauralife-resource.openai.azure.com/openai/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'api-key': key
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'gpt-4o',
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
  },
  // Additional model providers
  novita: {
    url: () => 'https://api.novita.ai/v3/openai/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'Qwen/Qwen3-Coder-Next',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  scaleway: {
    url: () => 'https://api.scaleway.ai/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'google/gemma-3-27b-it',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  hyperbolic: {
    url: () => 'https://api.hyperbolic.xyz/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'Qwen/Qwen3-Next-80B-A3B-Thinking',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  lmstudio: {
    // LM Studio local server (OpenAI-compatible)
    url: () => process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'local-model',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  },
  fireworks: {
    url: () => 'https://api.fireworks.ai/inference/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, maxTokens: number, temp: number) => ({
      model: 'zai-org/GLM-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temp
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || ''
  }
};

router.post('/chat', async (req, res) => {
  try {
    const { provider, prompt, maxTokens = 1024, temperature = 0.7 } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const selectedProvider = provider || await detectProvider();
    const config = PROVIDERS[selectedProvider];
    
    if (!config) {
      res.status(400).json({ error: `Unknown provider: ${selectedProvider}` });
      return;
    }

    const apiKey = await getApiKey(selectedProvider);
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

/**
 * Code/Website Builder endpoint
 * Specialized for generating code, websites, and projects
 */
router.post('/builder', async (req, res) => {
  try {
    const { 
      prompt, 
      mode = 'code', // 'code', 'website', 'component'
      template,
      maxTokens = 4096,
      provider,
      model
    } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const selectedProvider = provider || await detectProvider();
    const config = PROVIDERS[selectedProvider];
    
    if (!config) {
      res.status(400).json({ error: `Unknown provider: ${selectedProvider}` });
      return;
    }

    const apiKey = await getApiKey(selectedProvider);
    if (!apiKey) {
      res.status(503).json({ error: `${selectedProvider} not configured` });
      return;
    }

    // Build enhanced prompt for code generation
    let enhancedPrompt = prompt;
    if (mode === 'website') {
      enhancedPrompt = `Create a complete website: ${prompt}\n\nTemplate: ${template || 'modern responsive'}\n\nProvide:\n1. HTML (complete file)\n2. CSS (complete file)\n3. JavaScript (complete file)\n\nFormat your response with clear file sections.`;
    } else if (mode === 'component') {
      enhancedPrompt = `Create a React component: ${prompt}\n\nInclude:\n- Full component code\n- Props interface\n- Usage example\n- Styling (Tailwind CSS)`;
    }

    const response = await fetch(config.url(apiKey), {
      method: 'POST',
      headers: typeof config.headers === 'function' ? config.headers(apiKey) : config.headers,
      body: JSON.stringify(config.formatBody(enhancedPrompt, maxTokens, 0.7))
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

    // Parse generated code into sections
    const generatedCode = {
      raw: content,
      html: extractCodeBlock(content, 'html') || '',
      css: extractCodeBlock(content, 'css') || '',
      js: extractCodeBlock(content, 'javascript') || extractCodeBlock(content, 'js') || '',
      react: extractCodeBlock(content, 'jsx') || extractCodeBlock(content, 'tsx') || ''
    };

    res.json({
      success: true,
      generated_code: generatedCode,
      html: generatedCode.html,
      css: generatedCode.css,
      js: generatedCode.js,
      provider: selectedProvider,
      model: model || selectedProvider,
      mode
    });
  } catch (err: any) {
    console.error('Builder error:', err);
    res.status(500).json({ error: 'Builder request failed', detail: err.message });
  }
});

// Helper to extract code blocks from markdown
function extractCodeBlock(text: string, language: string): string | null {
  const regex = new RegExp(`\\\`\\\`\\\`${language}\\s*\\n([\\s\\S]*?)\\n\\\`\\\`\\\``, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

router.get('/providers', (req, res) => {
  res.json({
    providers: {
      azure: !!process.env.AZURE_OPENAI_KEY,
      azure_openai: !!process.env.AZURE_OPENAI_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      kimi: !!process.env.KIMI_API_KEY,
      alibaba: !!process.env.ALIBABA_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
      novita: !!process.env.NOVITA_API_KEY,
      scaleway: !!process.env.SCALEWAY_API_KEY,
      hyperbolic: !!process.env.HYPERBOLIC_API_KEY,
      fireworks: !!process.env.FIREWORKS_API_KEY
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
    const geminiKey = await secretService.getSecret('GEMINI_API_KEY');
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

async function getApiKey(provider: string): Promise<string | undefined> {
  // Map provider names to env var names
  const envVarMap: Record<string, string> = {
    'claude': 'ANTHROPIC_API_KEY',
    'anthropic': 'ANTHROPIC_API_KEY',
    'alibaba': 'ALIBABA_API_KEY',
    'qwen': 'QWEN_API_KEY',
    'kimi': 'KIMI_API_KEY',
    'gemini': 'GEMINI_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'huggingface': 'HUGGINGFACE_API_KEY',
    'novita': 'NOVITA_API_KEY',
    'scaleway': 'SCALEWAY_API_KEY',
    'hyperbolic': 'HYPERBOLIC_API_KEY',
    'fireworks': 'FIREWORKS_API_KEY',
    'azure': 'AZURE_OPENAI_KEY',
    'azure_openai': 'AZURE_OPENAI_KEY',
    'lmstudio': 'LM_STUDIO_API_KEY'
  };
  
  const envKey = envVarMap[provider] || provider.toUpperCase() + '_API_KEY';
  const secret = await secretService.getSecret(envKey);
  return secret || undefined;
}

// Provider priority: Azure (primary) > Alibaba (cheap) > Kimi (cheap) > Gemini (free) > OpenAI > Claude
async function detectProvider(): Promise<string> {
  const providers = ['azure', 'alibaba', 'kimi', 'gemini', 'openai', 'claude'];
  for (const p of providers) {
    if (await getApiKey(p)) return p;
  }
  return 'azure';
}

export default router;
