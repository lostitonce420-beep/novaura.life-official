/**
 * Multi-Host Sync API
 * Synchronizes state between Firebase (novaura.life) and Replit (www.novaura.life)
 */

import { Router } from 'express';
import { admin } from '../../init';

const router = Router();
const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════════
// WINDOW STATE SYNC
// ═══════════════════════════════════════════════════════════════════════════════

// Save window state
router.post('/windows', async (req, res) => {
  try {
    const { userId, host, windows, timestamp } = req.body;
    
    if (!userId || !host || !Array.isArray(windows)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    await db.collection('sync_windows').doc(userId).set({
      userId,
      host,
      windows,
      timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Broadcast to other hosts via Firestore triggers
    await db.collection('sync_events').add({
      type: 'windows_updated',
      userId,
      sourceHost: host,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Sync] Error saving windows:', err);
    res.status(500).json({ error: err.message });
  }
});

// Load window state
router.get('/windows', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    
    const doc = await db.collection('sync_windows').doc(userId as string).get();
    
    if (!doc.exists) {
      res.json({ windows: [], lastSync: null });
      return;
    }
    
    const data = doc.data();
    res.json({
      windows: data?.windows || [],
      host: data?.host,
      lastSync: data?.timestamp?.toMillis()
    });
  } catch (err: any) {
    console.error('[Sync] Error loading windows:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE (Which host user is active on)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/presence', async (req, res) => {
  try {
    const { userId, host, online } = req.body;
    
    await db.collection('sync_presence').doc(userId).set({
      userId,
      host,
      online: online !== false,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/presence/:userId', async (req, res) => {
  try {
    const doc = await db.collection('sync_presence').doc(req.params.userId).get();
    
    if (!doc.exists) {
      res.json({ online: false });
      return;
    }
    
    const data = doc.data();
    // Consider offline if last seen > 2 minutes ago
    const lastSeen = data?.lastSeen?.toMillis() || 0;
    const isOnline = Date.now() - lastSeen < 120000 && data?.online;
    
    res.json({
      online: isOnline,
      host: data?.host,
      lastSeen
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME EVENTS (SSE)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/events', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  
  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Subscribe to sync events for this user
  const unsubscribe = db.collection('sync_events')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      });
    });
  
  // Clean up on disconnect
  req.on('close', () => {
    unsubscribe();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sync',
    timestamp: new Date().toISOString()
  });
});

export default router;
