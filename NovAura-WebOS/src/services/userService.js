import { db, isFirebaseConfigured } from '../config/firebase.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { kernelStorage } from '../kernel/kernelStorage.js';

/**
 * Loads user preferences from Firestore.
 * Falls back to localStorage cache if Firestore is unavailable.
 */
export async function loadUserPrefs(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;
  try {
    const ref = doc(db, 'users', uid, 'prefs', 'settings');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      // Update local cache
      kernelStorage.setItem('novaura_prefs_cache', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('[userService] Firestore unavailable, using cache:', e.message);
    // Failsafe: return cached prefs
    try {
      const cached = kernelStorage.getItem('novaura_prefs_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  return null;
}

/**
 * Saves a single preference field to Firestore and updates cache.
 */
export async function saveUserPref(uid, key, value) {
  if (!isFirebaseConfigured || !db || !uid) return;
  try {
    const ref = doc(db, 'users', uid, 'prefs', 'settings');
    await setDoc(ref, { [key]: value, updatedAt: serverTimestamp() }, { merge: true });
    // Update cache
    try {
      const cached = JSON.parse(kernelStorage.getItem('novaura_prefs_cache') || '{}');
      cached[key] = value;
      kernelStorage.setItem('novaura_prefs_cache', JSON.stringify(cached));
    } catch {}
  } catch (e) {
    console.warn('[userService] Failed to save pref to Firestore:', e.message);
    // Failsafe: at least save locally
    try {
      const cached = JSON.parse(kernelStorage.getItem('novaura_prefs_cache') || '{}');
      cached[key] = value;
      kernelStorage.setItem('novaura_prefs_cache', JSON.stringify(cached));
    } catch {}
  }
}

/**
 * Records a user session event in Firestore for tracking.
 */
export async function recordSession(uid, email) {
  if (!isFirebaseConfigured || !db || !uid) return;
  try {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, {
      email,
      lastSeen: serverTimestamp(),
      uid,
    }, { merge: true });
  } catch (e) {
    console.warn('[userService] Failed to record session:', e.message);
  }
}
