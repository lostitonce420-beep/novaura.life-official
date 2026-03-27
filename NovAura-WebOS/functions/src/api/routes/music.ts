import { Router, Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Middleware to verify Firebase auth
const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }
    
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
    return;
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// Generate music (single track)
router.post('/generate', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      prompt, 
      duration = 30, 
      bpm, 
      scale = 'major',
      temperature = 0.8,
      brightness = 0.7,
      density = 0.5,
      muteDrums = false,
      muteBass = false
    } = req.body;

    const userId = req.user!.uid;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Check user credits
    const userCredits = await db.collection('user_credits').doc(userId).get();
    const credits = userCredits.exists ? userCredits.data()?.music || 0 : 0;
    
    if (credits <= 0) {
      res.status(403).json({ 
        error: 'Insufficient credits',
        upgradeUrl: 'https://novaura.life/pricing'
      });
      return;
    }

    // Store generation record
    const generationRef = await db.collection('music_generations').add({
      userId,
      prompt,
      duration,
      bpm,
      scale,
      temperature,
      brightness,
      density,
      muteDrums,
      muteBass,
      status: 'generating',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Deduct credits
    await db.collection('user_credits').doc(userId).update({
      music: admin.firestore.FieldValue.increment(-1),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    });

    // For now, return pending status - actual generation happens async
    // Client should poll /music/status/:generationId
    res.json({
      success: true,
      generationId: generationRef.id,
      status: 'generating',
      message: 'Music generation started',
      estimatedTime: Math.ceil(duration / 5)
    });
    return;

  } catch (error: any) {
    console.error('Music generation error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Get generation status
router.get('/status/:generationId', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { generationId } = req.params;
    const userId = req.user!.uid;

    const doc = await db.collection('music_generations').doc(generationId).get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }

    if (doc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      generationId,
      ...doc.data()
    });
    return;

  } catch (error: any) {
    console.error('Music status error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// List user's music generations
router.get('/history', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { limit = 20 } = req.query;

    const snapshot = await db.collection('music_generations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string))
      .get();

    const generations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ generations });
    return;

  } catch (error: any) {
    console.error('Music history error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Live music streaming session
router.post('/stream', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      bpm = 120, 
      scale = 'major',
      temperature = 0.8,
      brightness = 0.7,
      density = 0.5
    } = req.body;

    const userId = req.user!.uid;

    // Check credits
    const userCredits = await db.collection('user_credits').doc(userId).get();
    const credits = userCredits.exists ? userCredits.data()?.musicStreaming || 0 : 0;
    
    if (credits <= 0) {
      res.status(403).json({ 
        error: 'Insufficient streaming credits',
        upgradeUrl: 'https://novaura.life/pricing'
      });
      return;
    }

    // Create streaming session record
    const sessionRef = await db.collection('music_streams').add({
      userId,
      bpm,
      scale,
      temperature,
      brightness,
      density,
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return session info - client will connect to Gemini Live API directly
    res.json({
      success: true,
      sessionId: sessionRef.id,
      message: 'Streaming session created',
      config: {
        model: 'gemini-2.0-flash-live-preview',
        bpm,
        scale,
        temperature,
        brightness,
        density
      }
    });
    return;

  } catch (error: any) {
    console.error('Music stream error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Update stream configuration
router.post('/stream/:sessionId/config', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { bpm, scale, brightness, density, muteDrums, muteBass } = req.body;
    const userId = req.user!.uid;

    // Verify ownership
    const sessionDoc = await db.collection('music_streams').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Update config
    const updates: any = {};
    if (bpm !== undefined) updates.bpm = bpm;
    if (scale !== undefined) updates.scale = scale;
    if (brightness !== undefined) updates.brightness = brightness;
    if (density !== undefined) updates.density = density;
    if (muteDrums !== undefined) updates.muteDrums = muteDrums;
    if (muteBass !== undefined) updates.muteBass = muteBass;

    await db.collection('music_streams').doc(sessionId).update({
      ...updates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      sessionId,
      config: updates
    });
    return;

  } catch (error: any) {
    console.error('Music stream config error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// End streaming session
router.delete('/stream/:sessionId', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.uid;

    const sessionDoc = await db.collection('music_streams').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await db.collection('music_streams').doc(sessionId).update({
      status: 'ended',
      endedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Stream ended' });
    return;

  } catch (error: any) {
    console.error('Music stream end error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Get available music presets
router.get('/presets', async (_req: Request, res: Response): Promise<void> => {
  const presets = [
    { id: 'lofi', name: 'Lo-Fi Study', bpm: 80, scale: 'minor', brightness: 0.4, density: 0.3 },
    { id: 'upbeat', name: 'Upbeat Pop', bpm: 128, scale: 'major', brightness: 0.8, density: 0.7 },
    { id: 'ambient', name: 'Ambient Drone', bpm: 60, scale: 'pentatonic', brightness: 0.5, density: 0.2 },
    { id: 'jazz', name: 'Smooth Jazz', bpm: 100, scale: 'blues', brightness: 0.6, density: 0.5 },
    { id: 'electronic', name: 'Electronic Dance', bpm: 140, scale: 'minor', brightness: 0.9, density: 0.8 },
    { id: 'classical', name: 'Classical Piano', bpm: 90, scale: 'major', brightness: 0.5, density: 0.4, muteDrums: true },
    { id: 'cinematic', name: 'Cinematic', bpm: 110, scale: 'minor', brightness: 0.3, density: 0.6 },
    { id: 'meditation', name: 'Meditation', bpm: 50, scale: 'pentatonic', brightness: 0.3, density: 0.1 },
  ];

  res.json({ presets });
  return;
});

// Get user credits
router.get('/credits', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    
    const doc = await db.collection('user_credits').doc(userId).get();
    const credits = doc.exists ? doc.data() : { music: 0, musicStreaming: 0 };

    res.json({ credits });
    return;

  } catch (error: any) {
    console.error('Music credits error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
