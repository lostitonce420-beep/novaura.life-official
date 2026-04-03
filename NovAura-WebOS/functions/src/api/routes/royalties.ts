import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

async function requireAuth(req: Request, res: Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}

/**
 * GET /royalties/my
 * Returns royalty ledger entries for the authenticated creator.
 * Aggregates: lifetime, available (transferred), pending (pending_transfer), failed.
 */
router.get('/my', async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const db = admin.firestore();

    const snapshot = await db.collection('royalty_ledger')
      .where('recipientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const entries = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        assetId: d.assetId,
        assetTitle: d.assetTitle,
        amount: d.amount,           // cents
        percentage: d.percentage,
        reason: d.reason,
        status: d.status,           // 'pending_transfer' | 'transferred' | 'transfer_failed'
        stripeTransferId: d.stripeTransferId || null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Aggregate totals (all in cents)
    const lifetimeCents = entries.reduce((acc, e) => acc + (e.amount || 0), 0);
    const availableCents = entries
      .filter(e => e.status === 'transferred')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const pendingCents = entries
      .filter(e => e.status === 'pending_transfer')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    return res.json({
      entries,
      summary: {
        lifetimeCents,
        availableCents,
        pendingCents,
      }
    });
  } catch (error: any) {
    console.error('[Royalties /my] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
