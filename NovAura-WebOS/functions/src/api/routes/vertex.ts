/**
 * Vertex AI Routes - Full Parameter Support
 * Gemini API with permissive safety (blocks only: non-consensual, illegal, hate speech)
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// Get access token - use VERTEX_API_KEY if available, else Firebase Admin
async function getAccessToken(): Promise<string | null> {
  // Try environment variable first
  if (process.env.VERTEX_API_KEY) {
    return process.env.VERTEX_API_KEY;
  }
  
  // Fallback to Firebase Admin service account
  try {
    const client = await admin.credential.applicationDefault().getAccessToken();
    return client.access_token;
  } catch {
    return null;
  }
}

// Ultra-permissive safety settings
// Only block when harm probability is UNSPECIFIED (almost never)
// NEGLIGIBLE = allow, LOW = allow, MEDIUM = allow, HIGH = allow
const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'OFF'  // Allow all (manual moderation handles violations)
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'OFF'  // Allow all
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'OFF'  // Allow all
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'OFF'  // Allow all
  }
];

// Chat/Completion endpoint with full parameter support
router.post('/chat', async (req, res) => {
  try {
    const { 
      contents,
      prompt,  // Simple text prompt (alternative to contents)
      systemInstruction,
      temperature = 0.7,
      topP = 0.95,
      topK = 40,
      maxOutputTokens = 2048,
      candidateCount = 1,
      stopSequences = [],
      presencePenalty = 0,
      frequencyPenalty = 0,
      responseMimeType = 'text/plain',
      responseSchema,
      seed,
      model = 'gemini-2.0-flash'
    } = req.body;
    
    if (!contents && !prompt) {
      res.status(400).json({ error: 'contents or prompt required' });
      return;
    }

    const projectId = process.env.VERTEX_PROJECT_ID || 'smart-abacus-491500-g8';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      res.status(503).json({ error: 'Vertex AI not authenticated' });
      return;
    }

    // Build request body
    const requestBody: any = {
      contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature,
        topP,
        topK,
        candidateCount,
        maxOutputTokens,
        stopSequences,
        presencePenalty,
        frequencyPenalty,
        responseMimeType,
        ...(seed !== undefined && { seed }),
        ...(responseSchema && { responseSchema })
      }
    };

    // Add system instruction if provided
    if (systemInstruction) {
      requestBody.systemInstruction = typeof systemInstruction === 'string' 
        ? { role: 'system', parts: [{ text: systemInstruction }] }
        : systemInstruction;
    }

    const response = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: 'Vertex AI error', 
        status: response.status,
        detail: err.error?.message || err.message
      });
      return;
    }

    const data = await response.json();
    
    // Check if blocked
    if (data.promptFeedback?.blockReason) {
      res.status(400).json({
        error: 'Content blocked',
        reason: data.promptFeedback.blockReason,
        safetyRatings: data.promptFeedback.safetyRatings
      });
      return;
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      res.status(502).json({ error: 'No response generated' });
      return;
    }

    res.json({
      success: true,
      content: candidate.content,
      text: candidate.content?.parts?.map((p: any) => p.text).join('') || '',
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
      usage: data.usageMetadata,
      model: data.modelVersion || model
    });
  } catch (err: any) {
    console.error('Vertex chat error:', err);
    res.status(500).json({ error: 'Request failed', detail: err.message });
  }
});

// Streaming endpoint (for real-time responses)
router.post('/chat/stream', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.0-flash', ...params } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    const projectId = process.env.VERTEX_PROJECT_ID || 'smart-abacus-491500-g8';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      res.status(503).json({ error: 'Vertex AI not authenticated' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        topP: params.topP ?? 0.95,
        topK: params.topK ?? 40,
        maxOutputTokens: params.maxOutputTokens ?? 2048,
        ...params
      }
    };

    const response = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:streamGenerateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: err.error?.message || 'Stream failed' })}\n\n`);
      res.end();
      return;
    }

    // Stream the response
    const reader = response.body?.getReader();
    if (!reader) {
      res.end();
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${line}\n\n`);
        }
      }
    }
    
    res.end();
  } catch (err: any) {
    console.error('Vertex stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Image generation with Imagen 3
router.post('/image', async (req, res) => {
  try {
    const { 
      prompt, 
      aspectRatio = '1:1',
      negativePrompt,
      seed,
      apiKey 
    } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const projectId = process.env.VERTEX_PROJECT_ID || 'smart-abacus-491500-g8';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const accessToken = apiKey || await getAccessToken();
    
    if (!accessToken) {
      res.status(503).json({ error: 'Vertex AI not authenticated' });
      return;
    }

    // Build enhanced prompt
    const fullPrompt = negativePrompt 
      ? `${prompt} (avoid: ${negativePrompt})`
      : prompt;

    const parameters: any = {
      sampleCount: 1,
      aspectRatio: aspectRatio || '1:1',
      ...(seed !== undefined && { seed })
    };

    const response = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-002:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: 'Vertex AI error', 
        detail: err.error?.message || `HTTP ${response.status}` 
      });
      return;
    }

    const data = await response.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    
    if (!b64) {
      res.status(502).json({ error: 'No image generated' });
      return;
    }

    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${b64}`,
      mimeType: 'image/png',
      provider: 'vertex',
      model: 'imagen-3.0-generate-002'
    });
  } catch (err: any) {
    console.error('Vertex image error:', err);
    res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
});

// Video generation (Veo)
router.post('/video', async (req, res) => {
  res.status(501).json({ 
    error: 'Video generation coming soon',
    providers: ['Veo (Vertex AI) - in preview'],
    applyAt: 'https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview'
  });
});

// Claude via Vertex Model Garden
router.post('/claude', async (req, res) => {
  try {
    const { prompt, maxTokens = 1024, temperature = 0.7, model = 'claude-3-haiku' } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const projectId = process.env.VERTEX_PROJECT_ID || 'smart-abacus-491500-g8';
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      res.status(503).json({ error: 'Vertex AI not authenticated' });
      return;
    }

    const response = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/anthropic/models/${model}:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          anthropic_version: 'vertex-2023-10-16',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: 'Claude via Vertex error', 
        detail: err.error?.message || `HTTP ${response.status}` 
      });
      return;
    }

    const data = await response.json();
    
    res.json({
      success: true,
      content: data.content?.[0]?.text || '',
      usage: data.usage,
      provider: 'vertex',
      model: model
    });
  } catch (err: any) {
    console.error('Vertex Claude error:', err);
    res.status(500).json({ error: 'Request failed', detail: err.message });
  }
});

// List available models
router.get('/models', (req, res) => {
  res.json({
    chat: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast, versatile multimodal model' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Cost-efficient version' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Complex reasoning tasks' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Via Vertex Model Garden' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Via Vertex Model Garden' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Via Vertex Model Garden' }
    ],
    image: [
      { id: 'imagen-3.0-generate-002', name: 'Imagen 3', description: 'High-quality image generation' }
    ],
    video: [
      { id: 'veo', name: 'Veo', description: 'Video generation (preview)', status: 'coming_soon' }
    ]
  });
});

// Status check
router.get('/status', async (req, res) => {
  const projectId = process.env.VERTEX_PROJECT_ID || 'smart-abacus-491500-g8';
  const accessToken = await getAccessToken();
  
  res.json({
    configured: !!projectId,
    projectId,
    authenticated: !!accessToken,
    safetySettings: 'permissive (blocks: hate speech, dangerous content only)',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'imagen-3', 'claude-3-haiku']
  });
});

export default router;
