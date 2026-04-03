import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as crypto from 'crypto';

const router = Router();

// ─── Helper: generate a signed download URL from Firebase Storage ─────────────
async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  });
  return url;
}

// ─── POST /assets/upload ──────────────────────────────────────────────────────
// Multipart form upload from CreatorUpload wizard.
// Fields: title, description, category, licenseTier, price, tags (JSON array)
// File fields: mainFile, thumbnailFile, previewFiles[] (optional)
//
// NOTE: Firebase Functions doesn't support multipart directly — the client sends
// a base64-encoded payload JSON (common pattern for Functions). If you later move
// to a dedicated Node server you can swap in multer.
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const {
      creatorId,
      title,
      description,
      shortDescription,
      category,
      licenseTier,
      price,
      tags,
      foundationAssets,
      revenueSplits,
      // Base64 encoded files
      mainFileData,      // { name, type, base64 }
      thumbnailData,     // { name, type, base64 }
      previewFilesData,  // [{ name, type, base64 }]
    } = req.body;

    if (!creatorId || !title || !mainFileData) {
      return res.status(400).json({ error: 'Missing required fields: creatorId, title, mainFileData' });
    }

    // Verify creator exists
    const creatorDoc = await db.collection('users').doc(creatorId).get();
    if (!creatorDoc.exists) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const assetId = db.collection('assets').doc().id;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Upload main file
    const mainExt = path.extname(mainFileData.name) || '';
    const mainPath = `assets/${assetId}/main${mainExt}`;
    const mainBuffer = Buffer.from(mainFileData.base64, 'base64');
    await bucket.file(mainPath).save(mainBuffer, {
      metadata: { contentType: mainFileData.type, metadata: { assetId, creatorId } }
    });

    // Upload thumbnail if provided
    let thumbnailUrl = '';
    let thumbnailPath = '';
    if (thumbnailData) {
      const thumbExt = path.extname(thumbnailData.name) || '.jpg';
      thumbnailPath = `assets/${assetId}/thumbnail${thumbExt}`;
      const thumbBuffer = Buffer.from(thumbnailData.base64, 'base64');
      await bucket.file(thumbnailPath).save(thumbBuffer, {
        metadata: { contentType: thumbnailData.type }
      });
      // Make thumbnail public (it's just a preview image)
      await bucket.file(thumbnailPath).makePublic();
      thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;
    }

    // Upload preview files if provided
    const previewUrls: string[] = [];
    if (previewFilesData && Array.isArray(previewFilesData)) {
      for (let i = 0; i < previewFilesData.length; i++) {
        const preview = previewFilesData[i];
        const prevExt = path.extname(preview.name) || '';
        const prevPath = `assets/${assetId}/preview_${i}${prevExt}`;
        const prevBuffer = Buffer.from(preview.base64, 'base64');
        await bucket.file(prevPath).save(prevBuffer, {
          metadata: { contentType: preview.type }
        });
        await bucket.file(prevPath).makePublic();
        previewUrls.push(`https://storage.googleapis.com/${bucket.name}/${prevPath}`);
      }
    }

    // Generate license key for this asset
    const licenseKey = `NVA-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Save asset metadata to Firestore
    const assetData = {
      id: assetId,
      slug,
      title,
      description: description || '',
      shortDescription: shortDescription || '',
      category: category || 'other',
      licenseTier: licenseTier || 'opensource',
      price: Number(price) || 0,
      tags: Array.isArray(tags) ? tags : (tags ? JSON.parse(tags) : []),
      foundationAssets: foundationAssets || [],
      revenueSplits: revenueSplits || [],
      creatorId,
      // Storage paths (private)
      mainFilePath: mainPath,
      mainFileName: mainFileData.name,
      mainFileSize: mainBuffer.length,
      mainFileType: mainFileData.type,
      // Public URLs
      thumbnailUrl,
      previewUrls,
      licenseKey,
      // Status
      status: 'pending_review', // admin must approve before listing
      downloadCount: 0,
      salesCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('assets').doc(assetId).set(assetData);

    // Add to creator's asset list
    await db.collection('users').doc(creatorId).update({
      assetIds: admin.firestore.FieldValue.arrayUnion(assetId)
    });

    return res.json({
      success: true,
      assetId,
      slug,
      thumbnailUrl,
      status: 'pending_review',
      message: 'Asset uploaded. Pending admin review before going live.',
    });
  } catch (error: any) {
    console.error('[Assets Upload] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /assets/:id ──────────────────────────────────────────────────────────
// Public asset detail — returns metadata without download URL
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const doc = await db.collection('assets').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Asset not found' });

    const data = doc.data()!;
    // Strip private storage path from public response
    const { mainFilePath, licenseKey, ...publicData } = data;
    return res.json(publicData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /assets/:id/download ─────────────────────────────────────────────────
// Returns a signed download URL — only if the requesting user has purchased it
// Requires: Authorization: Bearer <firebase-id-token>
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;
    const assetId = req.params.id;

    // Check if user has purchased this asset
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const purchasedAssets: string[] = userData?.purchasedAssetIds || [];

    // Also check free assets (price = 0)
    const assetDoc = await db.collection('assets').doc(assetId).get();
    if (!assetDoc.exists) return res.status(404).json({ error: 'Asset not found' });
    const assetData = assetDoc.data()!;

    const isFree = assetData.price === 0;
    const hasPurchased = purchasedAssets.includes(assetId);
    const isCreator = assetData.creatorId === userId;

    if (!isFree && !hasPurchased && !isCreator) {
      return res.status(403).json({ error: 'Purchase required to download this asset' });
    }

    // Generate signed URL
    const signedUrl = await getSignedDownloadUrl(assetData.mainFilePath);

    // Log the download
    await db.collection('downloads').add({
      userId,
      assetId,
      fileName: assetData.mainFileName,
      downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment download count
    await db.collection('assets').doc(assetId).update({
      downloadCount: admin.firestore.FieldValue.increment(1)
    });

    return res.json({
      url: signedUrl,
      fileName: assetData.mainFileName,
      expiresIn: 7200, // seconds
    });
  } catch (error: any) {
    console.error('[Assets Download] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /assets (browse/list) ────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const { category, limit = '20', sort = 'createdAt' } = req.query;

    let query: admin.firestore.Query = db.collection('assets').where('status', '==', 'approved');

    if (category) query = query.where('category', '==', category);

    query = query.orderBy(sort as string, 'desc').limit(Number(limit));

    const snapshot = await query.get();
    const assets = snapshot.docs.map(doc => {
      const { mainFilePath, licenseKey, ...data } = doc.data();
      return data;
    });

    return res.json({ assets, total: assets.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
