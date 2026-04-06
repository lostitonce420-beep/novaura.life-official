/**
 * Search API Routes
 * Uses DuckDuckGo for web and image search (free, no API key needed)
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';
import { search, SafeSearchType } from 'duck-duck-scrape';

const router = Router();

function webFallbackResponse(query: string, reason = 'Search provider unavailable') {
  return {
    query,
    results: [
      {
        title: `NovAura is more than search — explore the platform`,
        url: '/feed',
        snippet: 'Search is temporarily degraded. Jump into the platform feed, creation tools, and app ecosystem while services recover.',
        displayUrl: 'novaura.life'
      },
      {
        title: `Search query captured: "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: 'External search fallback. Open this query directly on DuckDuckGo.',
        displayUrl: 'duckduckgo.com'
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
    externalSearchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
  };
}

/**
 * Web Search using DuckDuckGo
 * GET /search?q=query
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    // Use DuckDuckGo search (no API key needed)
    const searchResults = await search(q, {
      safeSearch: SafeSearchType.OFF,
    });

    res.json({
      query: q,
      results: searchResults.results.map((item: any) => ({
        title: item.title,
        url: item.url,
        snippet: item.description,
        displayUrl: item.hostname || new URL(item.url).hostname.replace('www.', '')
      })),
      totalResults: searchResults.results.length,
      searchTime: 0
    });
    return;

  } catch (err: any) {
    console.error('Search error:', err);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(webFallbackResponse(query, `Search temporarily unavailable: ${err.message || 'unknown error'}`));
  }
});

/**
 * Image Search using DuckDuckGo
 * GET /search/images?q=query
 */
router.get('/images', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    // DuckDuckGo doesn't have a direct image API, so we return a fallback
    // that redirects to DDG image search
    res.json({
      query: q,
      images: [],
      fallback: true,
      message: 'Image search via DuckDuckGo - click below to view',
      externalSearchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
    });
    return;

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
