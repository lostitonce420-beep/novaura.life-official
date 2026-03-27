/**
 * NovAura Firebase Configuration
 *
 * Initializes Firebase App, Auth, Firestore, Storage, Functions, and AI.
 * Config values come from VITE_ env vars. If not set, Firebase
 * features gracefully degrade (collab, presence, etc. won't work
 * but the app still runs).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

// FCM OAuth Client ID (novaura-systems project)
export const FCM_OAUTH_CLIENT_ID = import.meta.env.VITE_FCM_OAUTH_CLIENT_ID || '';
export const FCM_SENDER_ID = import.meta.env.VITE_FCM_SENDER_ID || '';

let app, auth, googleProvider, db, storage, functions, messaging, ai;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // Initialize Cloud Messaging (only in supported browsers)
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('[NovAura] Firebase Cloud Messaging initialized');
    } else {
      console.warn('[NovAura] FCM not supported in this browser');
    }
  }).catch(() => {
    console.warn('[NovAura] FCM initialization skipped');
  });

  // Initialize Firebase AI (lazy loaded via dynamic import)
  import('firebase/ai').then(({ getAI, GoogleAIBackend }) => {
    ai = getAI(app, { backend: new GoogleAIBackend() });
    console.log('[NovAura] Firebase AI initialized');
  }).catch((err) => {
    console.warn('[NovAura] Firebase AI not available:', err.message);
  });
} else {
  console.warn('[NovAura] Firebase not configured. Set VITE_FIREBASE_* env vars to enable real-time features.');
}

export { app, auth, googleProvider, db, storage, functions, messaging, ai };
