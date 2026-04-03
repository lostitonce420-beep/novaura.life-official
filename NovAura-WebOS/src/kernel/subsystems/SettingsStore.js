import { db } from '../../config/firebase.js';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * NovAura OS — Settings Store
 * User preferences with Firestore persistence and local cache.
 * Batches writes to avoid Firestore hammering.
 */

const DEFAULTS = {
  theme: 'cosmic',
  llm_config: null,
  sidebar_collapsed: false,
  notifications_enabled: true,
  desktop_icons: [],
  font_size: 'normal',
  animations_enabled: true,
  chat_history_limit: 100,
};

class SettingsStore {
  constructor() {
    this._kernel = null;
    this._uid = null;
    this._prefs = { ...DEFAULTS };
    this._dirty = {};
    this._writeTimer = null;
    this._watchers = new Map(); // key -> Set<handler>
    this._firestoreUnsub = null;
    this._WRITE_DEBOUNCE = 500;
  }

  init(kernel) {
    this._kernel = kernel;

    kernel.ipc.on('auth:changed', async ({ uid }) => {
      this._uid = uid || null;
      if (this._firestoreUnsub) { this._firestoreUnsub(); this._firestoreUnsub = null; }
      if (uid) {
        await this._loadFromFirestore();
        this._watchFirestore();
      } else {
        this._prefs = { ...DEFAULTS };
      }
    });

    this._uid = kernel.auth.uid;
    if (this._uid) {
      this._loadFromFirestore();
      this._watchFirestore();
    }
  }

  /**
   * Get a preference value.
   * @param {string} key
   * @param {any} defaultValue
   */
  get(key, defaultValue = undefined) {
    const val = this._prefs[key];
    if (val === undefined || val === null) {
      return defaultValue !== undefined ? defaultValue : (DEFAULTS[key] ?? null);
    }
    return val;
  }

  /**
   * Set a preference value (debounced Firestore write).
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    const prev = this._prefs[key];
    this._prefs[key] = value;
    this._dirty[key] = value;

    this._kernel.ipc.emit('settings:changed', { key, value, prev });
    this._notifyWatchers(key, value, prev);

    // Debounced batch write
    if (this._writeTimer) clearTimeout(this._writeTimer);
    this._writeTimer = setTimeout(() => this._flush(), this._WRITE_DEBOUNCE);
  }

  getAll() {
    return { ...this._prefs };
  }

  /**
   * Watch a specific key for changes.
   * @param {string} key
   * @param {Function} handler  (value, prev) => void
   * @returns {Function} unsubscribe
   */
  watch(key, handler) {
    if (!this._watchers.has(key)) this._watchers.set(key, new Set());
    this._watchers.get(key).add(handler);
    return () => {
      const set = this._watchers.get(key);
      if (set) set.delete(handler);
    };
  }

  async _loadFromFirestore() {
    if (!this._uid || !db) return;
    try {
      const snap = await getDoc(doc(db, 'users/' + this._uid + '/prefs/settings'));
      if (snap.exists()) {
        const data = snap.data();
        delete data.updatedAt;
        this._prefs = { ...DEFAULTS, ...data };
      }
    } catch (e) {
      console.error('[Settings] load error', e);
    }
  }

  _watchFirestore() {
    if (!this._uid || !db) return;
    this._firestoreUnsub = onSnapshot(
      doc(db, 'users/' + this._uid + '/prefs/settings'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        delete data.updatedAt;
        const prev = { ...this._prefs };
        this._prefs = { ...DEFAULTS, ...data };

        // Fire watchers for any changed keys
        Object.keys(this._prefs).forEach(key => {
          if (this._prefs[key] !== prev[key]) {
            this._notifyWatchers(key, this._prefs[key], prev[key]);
          }
        });
      }
    );
  }

  async _flush() {
    if (!this._uid || !db || Object.keys(this._dirty).length === 0) {
      this._dirty = {};
      return;
    }
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'users/' + this._uid + '/prefs/settings'),
        { ...this._prefs, updatedAt: serverTimestamp() },
        { merge: true }
      );
      this._dirty = {};
    } catch (e) {
      console.error('[Settings] flush error', e);
    }
  }

  _notifyWatchers(key, value, prev) {
    const set = this._watchers.get(key);
    if (set) set.forEach(h => { try { h(value, prev); } catch {} });
  }

  destroy() {
    if (this._firestoreUnsub) this._firestoreUnsub();
    if (this._writeTimer) clearTimeout(this._writeTimer);
    this._flush();
  }
}

export default SettingsStore;
