/**
 * NovAura Unified Firebase Functions
 * 
 * Includes:
 * - Social Network (notifications, DMs, posts, followers)
 * - Platform API (Auth, AI, Domains) via Express
 * 
 * Initialized with Service Account for God Mode access
 */

// MUST import init first — initializes Firebase Admin before any route modules
import { admin } from './init';
import * as functions from 'firebase-functions';
import apiApp from './api/app';


// Firestore shorthand
const db = admin.firestore();
const messaging = admin.messaging();

// ═══════════════════════════════════════════════════════════════
// EXPRESS API (Auth, AI, Domains)
// ═══════════════════════════════════════════════════════════════

// Export as Firebase HTTP Function
export const api = functions.https.onRequest(apiApp);

// ═══════════════════════════════════════════════════════════════
// SOCIAL NETWORK FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Push Notifications
export const sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, body, data: payloadData = {} } = data;
  if (!userId || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const tokensSnapshot = await db
      .collection('user_fcm_tokens')
      .doc(userId)
      .collection('tokens')
      .get();

    if (tokensSnapshot.empty) {
      return { success: false, error: 'User has no registered devices' };
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    const message = { notification: { title, body }, data: payloadData, tokens };
    const response = await messaging.sendEachForMulticast(message);

    // Clean up invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && (resp.error?.code?.includes('not-registered') || resp.error?.code?.includes('invalid'))) {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length > 0) {
      const batch = db.batch();
      invalidTokens.forEach(token => {
        batch.delete(db.collection('user_fcm_tokens').doc(userId).collection('tokens').doc(token));
      });
      await batch.commit();
    }

    return { success: true, sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

export const registerFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  const { token, platform = 'web' } = data;
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Token required');
  
  await db.collection('user_fcm_tokens').doc(context.auth.uid).collection('tokens').doc(token).set({
    platform, createdAt: admin.firestore.FieldValue.serverTimestamp(), lastUsed: admin.firestore.FieldValue.serverTimestamp()
  });
  return { success: true };
});

export const unregisterFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  const { token } = data;
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Token required');
  
  await db.collection('user_fcm_tokens').doc(context.auth.uid).collection('tokens').doc(token).delete();
  return { success: true };
});

// Social Triggers
export const onDirectMessageCreated = functions.firestore
  .document('social_dm_threads/{threadId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const threadDoc = await db.collection('social_dm_threads').doc(context.params.threadId).get();
    if (!threadDoc.exists) return;
    
    const recipientId = threadDoc.data()?.participants?.find((id: string) => id !== message.senderId);
    if (!recipientId) return;

    const senderDoc = await db.collection('social_profiles').doc(message.senderId).get();
    const senderName = senderDoc.exists ? senderDoc.data()?.displayName || 'Someone' : 'Someone';

    const tokensSnapshot = await db.collection('user_fcm_tokens').doc(recipientId).collection('tokens').get();
    if (tokensSnapshot.empty) return;

    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    await messaging.sendEachForMulticast({
      notification: { title: senderName, body: message.text?.slice(0, 100) + (message.text?.length > 100 ? '...' : '') },
      data: { type: 'direct_message', threadId: context.params.threadId, senderId: message.senderId },
      tokens
    });
  });

export const onPostCreated = functions.firestore
  .document('social_posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const followersDoc = await db.collection('social_followers').doc(post.authorId).get();
    if (!followersDoc.exists) return;
    
    const followers: string[] = followersDoc.data()?.followers || [];
    if (followers.length === 0) return;

    const authorDoc = await db.collection('social_profiles').doc(post.authorId).get();
    const authorName = authorDoc.exists ? authorDoc.data()?.displayName || 'Someone' : 'Someone';

    for (let i = 0; i < followers.length; i += 500) {
      const batch = followers.slice(i, i + 500);
      const tokenPromises = batch.map(async (followerId) => {
        const snap = await db.collection('user_fcm_tokens').doc(followerId).collection('tokens').limit(3).get();
        return snap.docs.map(d => d.id);
      });
      
      const allTokens = (await Promise.all(tokenPromises)).flat();
      if (allTokens.length === 0) continue;

      await messaging.sendEachForMulticast({
        notification: { title: `${authorName} posted`, body: post.text?.slice(0, 100) },
        data: { type: 'new_post', postId: context.params.postId, authorId: post.authorId },
        tokens: allTokens
      });
    }
  });

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  await db.collection('social_profiles').doc(user.uid).set({
    id: user.uid, displayName: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '', avatar: user.photoURL || '', bio: '', status: 'online',
    joinedAt: admin.firestore.FieldValue.serverTimestamp(), friendCount: 0, postCount: 0
  });
});

export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const batch = db.batch();
  batch.delete(db.collection('social_profiles').doc(user.uid));
  const tokens = await db.collection('user_fcm_tokens').doc(user.uid).collection('tokens').get();
  tokens.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
});
