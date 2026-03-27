import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import { Readable } from 'stream';

const router = Router();
const db = admin.firestore();

// Initialize Drive API with service account
const serviceAccount = require('../../service-account.json');
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

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

// Upload file to user's Drive folder
router.post('/upload', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, mimeType, content, folderId } = req.body;
    const userId = req.user!.uid;

    if (!fileName || !content) {
      res.status(400).json({ error: 'fileName and content required' });
      return;
    }

    // Get or create user's Drive folder
    const userFolderDoc = await db.collection('drive_folders').doc(userId).get();
    let userFolderId = userFolderDoc.exists ? userFolderDoc.data()?.folderId : null;

    if (!userFolderId) {
      // Create user folder
      const folder = await drive.files.create({
        requestBody: {
          name: `NovAura-${userId.slice(0, 8)}`,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id'
      });
      userFolderId = folder.data.id;
      await db.collection('drive_folders').doc(userId).set({ 
        folderId: userFolderId, 
        createdAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    }

    // Convert base64 to buffer if needed
    const fileContent = Buffer.isBuffer(content) 
      ? content 
      : Buffer.from(content, 'base64');

    // Upload file
    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType || 'application/octet-stream',
        parents: folderId ? [folderId] : [userFolderId!]
      },
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: Readable.from([fileContent])
      },
      fields: 'id, name, mimeType, webViewLink, createdTime, size'
    });

    // Store metadata in Firestore
    await db.collection('drive_files').doc(file.data.id!).set({
      userId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      driveFileId: file.data.id,
      folderId: folderId || userFolderId,
      webViewLink: file.data.webViewLink,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      size: file.data.size
    });

    res.json({
      success: true,
      file: {
        id: file.data.id,
        name: file.data.name,
        mimeType: file.data.mimeType,
        webViewLink: file.data.webViewLink,
        createdTime: file.data.createdTime,
        size: file.data.size
      }
    });
    return;

  } catch (error: any) {
    console.error('Drive upload error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// List user's files
router.get('/list', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { limit = 50, pageToken } = req.query;

    // Get user's folder
    const userFolderDoc = await db.collection('drive_folders').doc(userId).get();
    const userFolderId = userFolderDoc.exists ? userFolderDoc.data()?.folderId : null;

    if (!userFolderId) {
      res.json({ files: [], nextPageToken: null });
      return;
    }

    // List files in folder
    const response = await drive.files.list({
      q: `'${userFolderId}' in parents and trashed = false`,
      pageSize: parseInt(limit as string),
      pageToken: (pageToken as string) || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, createdTime, modifiedTime, size, thumbnailLink)',
      orderBy: 'createdTime desc'
    });

    res.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken || null
    });
    return;

  } catch (error: any) {
    console.error('Drive list error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Download file
router.get('/download/:fileId', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.uid;

    // Verify ownership
    const fileDoc = await db.collection('drive_files').doc(fileId).get();
    if (!fileDoc.exists || fileDoc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get file metadata
    const fileMeta = await drive.files.get({
      fileId,
      fields: 'name, mimeType'
    });

    // Download file
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'stream' });

    res.setHeader('Content-Type', fileMeta.data.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.data.name}"`);
    
    (response.data as any).pipe(res);
    return;

  } catch (error: any) {
    console.error('Drive download error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Delete file
router.delete('/delete/:fileId', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.uid;

    // Verify ownership
    const fileDoc = await db.collection('drive_files').doc(fileId).get();
    if (!fileDoc.exists || fileDoc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Move to trash
    await drive.files.update({
      fileId,
      requestBody: { trashed: true }
    });

    // Update Firestore
    await db.collection('drive_files').doc(fileId).update({
      trashed: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'File moved to trash' });
    return;

  } catch (error: any) {
    console.error('Drive delete error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Share file
router.post('/share/:fileId', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { email, role = 'reader', type = 'user' } = req.body;
    const userId = req.user!.uid;

    // Verify ownership
    const fileDoc = await db.collection('drive_files').doc(fileId).get();
    if (!fileDoc.exists || fileDoc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Create permission
    const permission = await drive.permissions.create({
      fileId,
      requestBody: {
        role,
        type,
        emailAddress: email
      },
      sendNotificationEmail: true,
      fields: 'id, role, emailAddress'
    });

    res.json({
      success: true,
      permission: permission.data
    });
    return;

  } catch (error: any) {
    console.error('Drive share error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Create folder
router.post('/folder', verifyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user!.uid;

    // Get user's root folder
    const userFolderDoc = await db.collection('drive_folders').doc(userId).get();
    const rootFolderId = userFolderDoc.exists ? userFolderDoc.data()?.folderId : null;

    const folder = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : rootFolderId ? [rootFolderId] : []
      },
      fields: 'id, name, webViewLink, createdTime'
    });

    await db.collection('drive_files').doc(folder.data.id!).set({
      userId,
      fileName: name,
      mimeType: 'application/vnd.google-apps.folder',
      driveFileId: folder.data.id,
      folderId: parentId || rootFolderId,
      webViewLink: folder.data.webViewLink,
      isFolder: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      folder: folder.data
    });
    return;

  } catch (error: any) {
    console.error('Drive folder error:', error);
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
