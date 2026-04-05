import { db } from '../../config/firebase.js';
import { doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * NovAura OS — MemoryMap
 * Cross-session persistent key-value store backed by Firestore.
 * Remembers: open windows, workspace state, user patterns, session context.
 * Path: users/{uid}/memory/{key}
 */

const MAX_CACHE = 500;

class MemoryMap {
  constructor() {
    this._kernel = null;
    this._uid = null;
    this._cache = new Map();
    this._writeQueue = new Map(); // key -> { value, timer }
    this._DEBOUNCE = 800;
  }

  init(kernel) {
    this._kernel = kernel;
    this._uid = kernel.auth.uid;

    kernel.ipc.on('auth:changed', ({ uid }) => {
      this._uid = uid || null;
      this._cache.clear();
      if (uid) this._warmCache();
    });

    if (this._uid) this._warmCache();
  }

  /**
   * Remember a value. Persisted to Firestore, instant in memory.
   * @param {string} key
   * @param {any} value
   * @param {object} options  { ttl?: ms, tags?: string[] }
   */
  set(key, value, options = {}) {
    const entry = {
      value,
      tags: options.tags || [],
      expiresAt: options.ttl ? Date.now() + options.ttl : null,
      updatedAt: Date.now(),
    };
    this._cache.set(key, entry);
    this._scheduleWrite(key, entry);
    this._kernel.ipc.emit('memory:set', { key, value });
  }

  /**
   * Recall a value.
   * @param {string} key
   * @param {any} fallback
   * @returns {any}
   */
  get(key, fallback = null) {
    const entry = this._cache.get(key);
    if (!entry) return fallback;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this.forget(key);
      return fallback;
    }
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key.
   */
  async forget(key) {
    this._cache.delete(key);
    if (this._writeQueue.has(key)) {
      clearTimeout(this._writeQueue.get(key).timer);
      this._writeQueue.delete(key);
    }
    if (!this._uid || !db) return;
    try {
      await deleteDoc(doc(db, this._docPath(key)));
      this._kernel.ipc.emit('memory:forget', { key });
    } catch {}
  }

  /**
   * Get all keys with a given tag.
   * @param {string} tag
   * @returns {string[]}
   */
  getByTag(tag) {
    const result = {};
    for (const [key, entry] of this._cache.entries()) {
      if (entry.tags?.includes(tag)) result[key] = entry.value;
    }
    return result;
  }

  /**
   * Snapshot — save current workspace state (open windows, positions).
   */
  snapshotWorkspace() {
    const windows = this._kernel.wm.getAll().map(w => ({
      type: w.type,
      title: w.title,
      props: w.props,
      state: w.state,
    }));
    this.set('workspace:snapshot', windows, { tags: ['workspace'] });
    this.set('workspace:snapshot:ts', Date.now(), { tags: ['workspace'] });
  }

  /**
   * Restore workspace from last snapshot.
   * @returns {number} count of windows restored
   */
  restoreWorkspace() {
    const snapshot = this.get('workspace:snapshot');
    if (!snapshot?.length) return 0;
    snapshot.forEach(w => {
      if (w.state !== 'minimized') {
        this._kernel.wm.open(w.type, w.title, w.props || {});
      }
    });
    return snapshot.length;
  }

  getAll() {
    const result = {};
    for (const [key, entry] of this._cache.entries()) {
      if (!entry.expiresAt || Date.now() < entry.expiresAt) {
        result[key] = entry.value;
      }
    }
    return result;
  }

  _docPath(key) {
    // 4 segments = valid Firestore document path (even = doc, odd = collection)
    const safe = String(key || 'empty').replace(/[^a-zA-Z0-9_-]/g, '_') || 'empty';
    return 'users/' + this._uid + '/memory/' + safe;
  }

  _scheduleWrite(key, entry) {
    if (this._writeQueue.has(key)) clearTimeout(this._writeQueue.get(key).timer);
    const timer = setTimeout(() => this._flush(key, entry), this._DEBOUNCE);
    this._writeQueue.set(key, { entry, timer });
  }

  async _flush(key, entry) {
    if (!this._uid || !db) return;
    this._writeQueue.delete(key);
    try {
      await setDoc(doc(db, this._docPath(key)), {
        key,
        value: entry.value,
        tags: entry.tags,
        expiresAt: entry.expiresAt,
        updatedAt: serverTimestamp(),
        uid: this._uid,
      });
    } catch (e) {
      console.warn('[Memory] flush error', key, e.message);
    }
  }

  async _warmCache() {
    if (!this._uid || !db) return;
    try {
      const colRef = collection(db, 'users', this._uid, 'memory');
      const snap = await getDocs(colRef);
      const now = Date.now();
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.expiresAt && now > data.expiresAt) return; // skip expired
        if (this._cache.size < MAX_CACHE) {
          this._cache.set(data.key, {
            value: data.value,
            tags: data.tags || [],
            expiresAt: data.expiresAt || null,
            updatedAt: data.updatedAt?.toMillis?.() || now,
          });
        }
      });
      this._kernel.ipc.emit('memory:ready', { count: this._cache.size });
    } catch (e) {
      console.warn('[Memory] warm cache error', e.message);
    }
  }
}

export default MemoryMap;
