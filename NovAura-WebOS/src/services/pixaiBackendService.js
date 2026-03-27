/**
 * PixAI Backend Service
 * Uses YOUR API key securely through Firebase Functions
 * Users don't need their own key!
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// MIO Presets
export const MIO_PRESETS = {
  character: {
    name: 'Character',
    promptPrefix: 'masterpiece, best quality, detailed character,',
    promptSuffix: 'beautiful lighting, detailed background',
    negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
  },
  landscape: {
    name: 'Landscape',
    promptPrefix: 'masterpiece, best quality, scenic landscape,',
    promptSuffix: 'stunning vista, atmospheric lighting, detailed environment',
    negativePrompt: 'lowres, blurry, low quality, people, humans, text, signature, watermark'
  },
  portrait: {
    name: 'Portrait',
    promptPrefix: 'masterpiece, best quality, portrait,',
    promptSuffix: 'professional lighting, sharp focus, detailed face',
    negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
  },
  anime: {
    name: 'Anime Style',
    promptPrefix: 'masterpiece, best quality, anime style,',
    promptSuffix: 'vibrant colors, cel shaded, detailed anime art',
    negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, 3d, realistic, photo'
  },
  realistic: {
    name: 'Realistic',
    promptPrefix: 'masterpiece, best quality, photorealistic,',
    promptSuffix: 'professional photography, detailed, 8k uhd, sharp focus',
    negativePrompt: 'lowres, blurry, low quality, anime, cartoon, painting, drawing, sketch, 3d render, cgi'
  }
};

/**
 * Apply preset to base prompt
 */
export function applyPreset(presetKey, basePrompt) {
  const preset = MIO_PRESETS[presetKey];
  if (!preset) return { prompt: basePrompt, negativePrompt: '' };
  
  const prompt = `${preset.promptPrefix} ${basePrompt}, ${preset.promptSuffix}`;
  return {
    prompt: prompt.trim(),
    negativePrompt: preset.negativePrompt
  };
}

/**
 * Generate image using YOUR backend (your API key)
 */
export async function generateImage({
  prompt,
  modelId = '1983308862240288769', // Tsubaki.2
  aspectRatio = '9:16',
  negativePrompt = '',
  mode = 'standard'
}) {
  const idToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/generation/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      prompt,
      modelId,
      aspectRatio,
      negativePrompt,
      mode
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Generation failed');
  }

  return await response.json();
}

/**
 * Check generation status
 */
export async function checkStatus(taskId) {
  const idToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/generation/status/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to check status');
  }

  return await response.json();
}

/**
 * Convenience: Generate with Mio model
 */
export async function generateWithMio(params) {
  return generateImage({
    ...params,
    modelId: '1983308862240288769' // Mio/Tsubaki.2
  });
}

/**
 * Wait for completion with polling
 */
export async function waitForCompletion(taskId, onProgress) {
  const maxAttempts = 60; // 2 minutes max
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(taskId);
    
    if (onProgress) {
      onProgress({
        attempt: i + 1,
        status: status.status,
        imageUrl: status.imageUrl
      });
    }
    
    if (status.status === 'completed') {
      return status;
    }
    
    if (status.status === 'failed') {
      throw new Error('Generation failed');
    }
    
    // Wait 2 seconds before next poll
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('Timeout waiting for generation');
}

/**
 * Get Firebase Auth token
 */
async function getAuthToken() {
  // Get from Firebase Auth
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  
  if (!auth.currentUser) {
    throw new Error('Please sign in to generate images');
  }
  
  return await auth.currentUser.getIdToken();
}

/**
 * Download generated image
 */
export async function downloadImage(imageUrl, filename = 'generated.png') {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export default {
  generateImage,
  generateWithMio,
  checkStatus,
  waitForCompletion,
  downloadImage,
  applyPreset,
  MIO_PRESETS
};
