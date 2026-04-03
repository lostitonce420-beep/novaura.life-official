/**
 * Image & Video Generation Routes
 * Multi-provider: PixAI, Vertex AI (Imagen), etc.
 * 
 * SECURITY: All routes require authentication
 * Rate limiting applied per user
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING (In-memory - use Redis in production)
// ═══════════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Rate limits per tier (generous limits - 10K/hour available)
const RATE_LIMITS = {
  free: { requests: 100, window: 3600000 },      // 100/hour
  basic: { requests: 500, window: 3600000 },     // 500/hour
  pro: { requests: 2000, window: 3600000 },      // 2000/hour
  unlimited: { requests: 10000, window: 3600000 } // 10K/hour (full capacity)
};

function checkRateLimit(userId: string, tier: keyof typeof RATE_LIMITS = 'free'): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const limit = RATE_LIMITS[tier] || RATE_LIMITS.free;
  const key = `${userId}:${tier}`;
  
  const entry = rateLimits.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Reset window
    rateLimits.set(key, {
      count: 1,
      resetTime: now + limit.window
    });
    return { allowed: true, remaining: limit.requests - 1, resetIn: limit.window };
  }
  
  if (entry.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: limit.requests - entry.count, resetIn: entry.resetTime - now };
}

// Authentication middleware
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

// Apply auth to all routes
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════════════
// PIXAI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PIXAI_API_V2 = 'https://api.pixai.art/v2';
const PIXAI_API_V1 = 'https://api.pixai.art/v1';

// PixAI Models - Anime/Character focused
export const PIXAI_MODELS = {
  // Tsubaki.2 - Strong prompt understanding, seamless anatomy
  TSUBAKI_2: {
    id: '1983308862240288769',
    name: 'Tsubaki.2',
    type: 'DIT',
    description: 'Strong prompt understanding & execution, seamless anatomy',
    defaultSize: '768x1280'
  },
  // Haruka v2 - Stable quality, refined details, accurate hands
  HARUKA_V2: {
    id: '1861558740588989558',
    name: 'Haruka v2', 
    type: 'SDXL',
    description: 'Stable quality, refined details, accurate hands',
    defaultSize: '768x1280'
  },
  // Hoshino v2 - Popular Japanese style
  HOSHINO_V2: {
    id: '1954632828118619567',
    name: 'Hoshino v2',
    type: 'SDXL',
    description: 'Highly popular style in Japan',
    defaultSize: '768x1280'
  },
  // Mio - Beta anime model
  MIO: {
    id: '1983308862240288769', // Using Tsubaki as base for now
    name: 'Mio',
    type: 'DIT',
    description: 'Beta anime character model',
    defaultSize: '768x1280'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION - PixAI
// ═══════════════════════════════════════════════════════════════════════════════

// Submit image generation task
router.post('/image', async (req, res) => {
  try {
    const { 
      prompt, 
      modelId = PIXAI_MODELS.TSUBAKI_2.id,
      aspectRatio = '9:16',
      negativePrompt = '',
      mode = 'standard'
    } = req.body;

    // Get user info from auth
    const userId = req.user?.uid;
    const userTier = req.user?.tier || 'free';

    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId, userTier);
    if (!rateLimit.allowed) {
      res.status(429).json({ 
        error: 'Rate limit exceeded',
        resetIn: Math.ceil(rateLimit.resetIn / 1000),
        tier: userTier,
        limit: RATE_LIMITS[userTier as keyof typeof RATE_LIMITS]?.requests
      });
      return;
    }

    const apiKey = process.env.PIXAI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'PixAI not configured' });
      return;
    }

    // Build enhanced prompt with negative
    const fullPrompt = negativePrompt 
      ? `${prompt} ### ${negativePrompt}`
      : prompt;

    const response = await fetch(`${PIXAI_API_V2}/image/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        modelId,
        prompt: fullPrompt,
        aspectRatio,
        mode
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(502).json({ 
        error: 'PixAI error', 
        status: response.status,
        detail: err.message 
      });
      return;
    }

    const data = await response.json();
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMITS[userTier as keyof typeof RATE_LIMITS]?.requests || 10);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000));
    
    res.json({
      success: true,
      taskId: data.id,
      status: data.status,
      createdAt: data.createdAt,
      message: 'Image generation started. Poll /generation/status/:taskId for results.',
      rateLimit: {
        remaining: rateLimit.remaining,
        resetIn: Math.ceil(rateLimit.resetIn / 1000),
        tier: userTier
      }
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
});

// Check generation status
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const apiKey = process.env.PIXAI_API_KEY;
    
    if (!apiKey) {
      res.status(503).json({ error: 'PixAI not configured' });
      return;
    }

    const response = await fetch(`${PIXAI_API_V1}/task/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to check status' });
      return;
    }

    const data = await response.json();
    
    res.json({
      taskId: data.id,
      status: data.status, // waiting, running, completed, failed, cancelled
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      startedAt: data.startedAt,
      completedAt: data.endAt,
      imageUrl: data.outputs?.mediaUrls?.[0] || null,
      mediaUrls: data.outputs?.mediaUrls || [],
      mediaIds: data.outputs?.mediaIds || []
    });
  } catch (err: any) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Check failed', detail: err.message });
  }
});

// Poll until complete (convenience endpoint)
router.post('/poll', async (req, res) => {
  try {
    const { taskId, maxAttempts = 60 } = req.body;
    const apiKey = process.env.PIXAI_API_KEY;
    
    if (!apiKey) {
      res.status(503).json({ error: 'PixAI not configured' });
      return;
    }

    let attempts = 0;
    const pollInterval = 2000; // 2 seconds
    
    while (attempts < maxAttempts) {
      const response = await fetch(`${PIXAI_API_V1}/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        res.status(502).json({ error: 'Poll failed' });
        return;
      }
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        res.json({
          success: true,
          taskId: data.id,
          status: 'completed',
          imageUrl: data.outputs?.mediaUrls?.[0],
          mediaUrls: data.outputs?.mediaUrls || [],
          attempts: attempts + 1
        });
        return;
      }
      
      if (data.status === 'failed' || data.status === 'cancelled') {
        res.status(400).json({
          success: false,
          taskId: data.id,
          status: data.status,
          error: 'Generation failed or was cancelled'
        });
        return;
      }
      
      attempts++;
      await new Promise(r => setTimeout(r, pollInterval));
    }
    
    res.status(408).json({ 
      error: 'Timeout waiting for generation',
      taskId,
      attempts 
    });
  } catch (err: any) {
    console.error('Poll error:', err);
    res.status(500).json({ error: 'Poll failed', detail: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERTEX AI / IMAGEN (Google)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/image/vertex', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', apiKey } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const vertexKey = apiKey || process.env.VERTEX_AI_KEY;
    const projectId = process.env.VERTEX_PROJECT_ID;
    
    if (!vertexKey || !projectId) {
      res.status(503).json({ error: 'Vertex AI not configured' });
      return;
    }

    // Vertex Imagen 3
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vertexKey}`
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio || '1:1'
          }
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
      provider: 'vertex'
    });
  } catch (err: any) {
    console.error('Vertex image error:', err);
    res.status(500).json({ error: 'Generation failed', detail: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

// Placeholder for video generation (Veo, etc.)
router.post('/video', async (req, res) => {
  res.status(501).json({ 
    error: 'Video generation coming soon',
    providers: ['Veo (Google)', 'Runway', 'Pika'],
    status: 'planned'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL LISTINGS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/models', (req, res) => {
  res.json({
    image: {
      pixai: PIXAI_MODELS,
      vertex: {
        IMAGEN_3: {
          id: 'imagen-3.0-generate-002',
          name: 'Imagen 3',
          description: 'Google\'s highest quality text-to-image model',
          provider: 'Google Vertex AI'
        }
      }
    },
    video: {
      upcoming: ['Veo (Google)', 'Runway Gen-3', 'Pika 1.5']
    }
  });
});

// Provider status
router.get('/status', (req, res) => {
  res.json({
    providers: {
      pixai: !!process.env.PIXAI_API_KEY,
      vertex: !!(process.env.VERTEX_AI_KEY && process.env.VERTEX_PROJECT_ID)
    },
    models: Object.keys(PIXAI_MODELS).length
  });
});

export default router;
