import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// ─── Auth middleware helper ───────────────────────────────────────────────────
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

// ─── GET /orders/my ───────────────────────────────────────────────────────────
// Returns all orders for the authenticated user, with download URLs for completed orders
router.get('/my', async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const db = admin.firestore();
    const snapshot = await db.collection('orders')
      .where('buyerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const orders = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();

      // Generate signed download URL if order is completed and file exists
      let downloadUrl = '';
      if (data.paymentStatus === 'completed' && data.mainFilePath) {
        try {
          const bucket = admin.storage().bucket();
          const [url] = await bucket.file(data.mainFilePath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 2 * 60 * 60 * 1000, // 2hr
          });
          downloadUrl = url;
        } catch {
          // File may not exist yet — non-fatal
        }
      }

      return {
        id: doc.id,
        status: data.paymentStatus || 'pending',
        pricePaid: data.pricePaid || 0,
        licenseKey: data.licenseKey || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        assetTitle: data.assetTitle || '',
        assetThumbnail: data.assetThumbnailUrl || '',
        downloadUrl,
        creatorUsername: data.creatorUsername || '',
      };
    }));

    return res.json({ orders });
  } catch (error: any) {
    console.error('[Orders /my] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /orders/:orderId ─────────────────────────────────────────────────────
router.get('/:orderId', async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const db = admin.firestore();
    const doc = await db.collection('orders').doc(req.params.orderId).get();

    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    const data = doc.data()!;

    if (data.buyerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    return res.json({ order: { id: doc.id, ...data } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /orders/:orderId/download ────────────────────────────────────────────
// Returns a fresh signed download URL for a paid order
router.get('/:orderId/download', async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const db = admin.firestore();
    const doc = await db.collection('orders').doc(req.params.orderId).get();

    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    const data = doc.data()!;

    if (data.buyerId !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (data.paymentStatus !== 'completed') return res.status(402).json({ error: 'Payment not confirmed' });
    if (!data.mainFilePath) return res.status(404).json({ error: 'File not available' });

    const bucket = admin.storage().bucket();
    const [url] = await bucket.file(data.mainFilePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000, // 2hr
    });

    // Log download
    await db.collection('downloads').add({
      userId,
      orderId: doc.id,
      assetId: data.assetId,
      downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ url, fileName: data.mainFileName, expiresIn: 7200 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── POST /orders/create ──────────────────────────────────────────────────────
// Called internally by the Stripe webhook after payment confirmation.
// Not meant to be called directly by the client.
export async function createOrderFromSession(
  sessionId: string,
  userId: string,
  assetId: string,
  amountPaid: number,
  db: admin.firestore.Firestore
): Promise<string> {
  // Get asset details
  const assetDoc = await db.collection('assets').doc(assetId).get();
  if (!assetDoc.exists) throw new Error(`Asset ${assetId} not found`);
  const asset = assetDoc.data()!;

  // Get creator username
  const creatorDoc = await db.collection('users').doc(asset.creatorId).get();
  const creatorData = creatorDoc.data();

  const licenseKey = `NVA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const orderRef = db.collection('orders').doc();
  await orderRef.set({
    stripeSessionId: sessionId,
    buyerId: userId,
    assetId,
    assetTitle: asset.title,
    assetThumbnailUrl: asset.thumbnailUrl || '',
    mainFilePath: asset.mainFilePath,
    mainFileName: asset.mainFileName,
    creatorId: asset.creatorId,
    creatorUsername: creatorData?.username || creatorData?.displayName || '',
    pricePaid: amountPaid,
    currency: 'usd',
    licenseKey,
    paymentStatus: 'completed',
    downloadStatus: 'available',
    licenseTier: asset.licenseTier,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Increment asset sales count
  await db.collection('assets').doc(assetId).update({
    salesCount: admin.firestore.FieldValue.increment(1)
  });

  return orderRef.id;
}

export default router;
