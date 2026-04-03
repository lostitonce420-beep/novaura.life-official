/**
 * Search API Routes
 * Aggregates results from multiple sources
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';

import { secretService } from '../../services/secretService';

const router = Router();

function webFallbackResponse(query: string, reason = 'Search provider unavailable') {
  return {
    query,
    results: [
      {
        title: `NovAura is more than search — explore the platform`,
        url: 'https://novaura.life/platform/feed',
        snippet: 'Search is temporarily degraded. Jump into the platform feed, creation tools, and app ecosystem while services recover.',
        displayUrl: 'novaura.life'
      },
      {
        title: `Search query captured: "${query}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: 'External search fallback. Open this query directly while we revalidate provider keys.',
        displayUrl: 'google.com'
      }
    ],
    fallback: true,
    message: reason,
  };
}

function imageFallbackResponse(query: string, reason = 'Image search provider unavailable') {
  return {
    query,
    images: [],
    fallback: true,
    message: reason,
    externalSearchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
  };
}

/**
 * Helper to get search credentials from Secret Manager or environment
 */
async function getSearchCredentials() {
  const apiKey = await secretService.getSecret('GOOGLE_SEARCH_API_KEY');
  const cx = await secretService.getSecret('GOOGLE_SEARCH_CX');
  return { apiKey, cx };
}

/**
 * Web Search
 * GET /search?q=query
 */
router.get('/', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    const { apiKey, cx } = await getSearchCredentials();

    if (apiKey && cx) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&start=${(Number(page) - 1) * 10 + 1}`
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.warn(`[Search] Google API degraded (${response.status}): ${detail}`);
        res.json(webFallbackResponse(q, `Search degraded (${response.status}) — fallback active`));
        return;
      }

      const data = await response.json();

      res.json({
        query: q,
        results: data.items?.map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          displayUrl: item.displayLink
        })) || [],
        totalResults: data.searchInformation?.totalResults || 0,
        searchTime: data.searchInformation?.searchTime || 0
      });
      return;
    } else {
      res.json(webFallbackResponse(q, 'Search credentials missing — fallback active'));
      return;
    }
  } catch (err: any) {
    console.error('Search error:', err);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(webFallbackResponse(query, `Search temporarily unavailable: ${err.message || 'unknown error'}`));
  }
});

/**
 * Image Search
 * GET /search/images?q=query
 */
router.get('/images', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    const { apiKey, cx } = await getSearchCredentials();

    if (apiKey && cx) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=10`
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.warn(`[Search] Google image API degraded (${response.status}): ${detail}`);
        res.json(imageFallbackResponse(q, `Image search degraded (${response.status}) — fallback active`));
        return;
      }

      const data = await response.json();

      res.json({
        query: q,
        images: data.items?.map((item: any) => ({
          title: item.title,
          thumbnail: item.image?.thumbnailLink,
          source: item.link,
          context: item.image?.contextLink,
          width: item.image?.width,
          height: item.image?.height
        })) || []
      });
      return;
    } else {
      res.json(imageFallbackResponse(q, 'Image search credentials missing — fallback active'));
      return;
    }
  } catch (err: any) {
    console.error('Image search error:', err);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(imageFallbackResponse(query, `Image search temporarily unavailable: ${err.message || 'unknown error'}`));
  }
});

/**
 * AI Deep Research
 * POST /search/deep-research
 */
router.post('/deep-research', async (req, res) => {
  try {
    const { query } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!query) {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    // Verify auth for deep research (premium feature)
    if (token) {
      try {
        await admin.auth().verifyIdToken(token);
      } catch {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
    }

    // Use Gemini for deep research
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide a comprehensive deep research analysis about: ${query}\n\nInclude:\n- Key findings\n- Multiple perspectives\n- Recent developments\n- Sources and references\n\nFormat as a well-structured research report.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({
      query,
      analysis,
      type: 'deep_research',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Deep research error:', err);
    res.status(500).json({ error: 'Research failed', detail: err.message });
  }
});

export default router;
