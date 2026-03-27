/**
 * Search API Routes
 * Aggregates results from multiple sources
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// Google Custom Search API (you'll need to set this up)
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX; // Custom Search Engine ID

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

    // For now, return mock results or use Google API if configured
    if (GOOGLE_API_KEY && GOOGLE_CX) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(q)}&start=${(Number(page) - 1) * 10 + 1}`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
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
    } else {
      // Mock results for development
      res.json({
        query: q,
        results: [
          {
            title: `Results for "${q}" - NovAura Search`,
            url: 'https://novaura.life',
            snippet: 'Configure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX to enable real search results.',
            displayUrl: 'novaura.life'
          }
        ],
        mock: true,
        message: 'Real search requires Google API configuration'
      });
    }
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', detail: err.message });
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

    if (GOOGLE_API_KEY && GOOGLE_CX) {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(q)}&searchType=image&num=10`
      );
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
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
    } else {
      // Mock image results
      res.json({
        query: q,
        images: [],
        mock: true,
        message: 'Real image search requires Google API configuration'
      });
    }
  } catch (err: any) {
    console.error('Image search error:', err);
    res.status(500).json({ error: 'Image search failed', detail: err.message });
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
