import { db } from '../../config/firebase.js';
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * NovAura OS — Virtual File System
 * Persistent file system backed by Firestore.
 * Falls back to localStorage for unauthenticated/guest users.
 */

const MAX_CACHE = 200;

class FileSystem {
  constructor() {
    this._kernel = null;
    this._uid = null;
    this._cache = new Map(); // path -> { data, ts }
    this._watchers = new Map(); // path -> unsubscribe
    this._cacheOrder = []; // LRU tracking
  }

  init(kernel) {
    this._kernel = kernel;

    kernel.ipc.on('auth:changed', ({ uid }) => {
      this._uid = uid || null;
      // Clear cache on auth change
      this._cache.clear();
      this._cacheOrder = [];
    });

    this._uid = kernel.auth.uid;
  }

  _fsPath(path) {
    if (!this._uid) return null;
    // Encode path as Firestore doc id (replace / with __)
    const encoded = path.replace(/\//g, '__').replace(/^__/, '');
    return 'users/' + this._uid + '/fs/' + encoded;
  }

  _localKey(path) {
    return 'novaura_fs_' + (this._uid || 'guest') + '_' + path;
  }

  /**
   * Read a file.
   * @param {string} path
   * @returns {Promise<any|null>}
   */
  async read(path) {
    // Check cache first
    const cached = this._cache.get(path);
    if (cached && Date.now() - cached.ts < 30_000) return cached.data;

    const fsPath = this._fsPath(path);
    if (!fsPath || !db) {
      // Guest fallback
      try {
        const raw = localStorage.getItem(this._localKey(path));
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }

    try {
      const snap = await getDoc(doc(db, fsPath));
      if (!snap.exists()) return null;
      const data = snap.data()?.data ?? null;
      this._setCache(path, data);
      return data;
    } catch (e) {
      console.error('[FS] read error', path, e);
      return null;
    }
  }

  /**
   * Write a file.
   * @param {string} path
   * @param {any} data
   */
  async write(path, data) {
    this._setCache(path, data);

    const fsPath = this._fsPath(path);
    if (!fsPath || !db) {
      try { localStorage.setItem(this._localKey(path), JSON.stringify(data)); } catch {}
      this._kernel.ipc.emit('fs:write', { path, data });
      return;
    }

    try {
      await setDoc(doc(db, fsPath), {
        data,
        path,
        updatedAt: serverTimestamp(),
        uid: this._uid,
      });
      this._kernel.ipc.emit('fs:write', { path, data });
    } catch (e) {
      console.error('[FS] write error', path, e);
    }
  }

  /**
   * Delete a file.
   * @param {string} path
   */
  async delete(path) {
    this._cache.delete(path);
    this._cacheOrder = this._cacheOrder.filter(p => p !== path);

    const fsPath = this._fsPath(path);
    if (!fsPath || !db) {
      localStorage.removeItem(this._localKey(path));
      this._kernel.ipc.emit('fs:delete', { path });
      return;
    }

    try {
      await deleteDoc(doc(db, fsPath));
      this._kernel.ipc.emit('fs:delete', { path });
    } catch (e) {
      console.error('[FS] delete error', path, e);
    }
  }

  /**
   * List files in a directory.
   * @param {string} dirPath
   * @returns {Promise<Array>}
   */
  async list(dirPath) {
    if (!this._uid || !db) return [];
    try {
      const colRef = collection(db, 'users/' + this._uid + '/fs');
      const snap = await getDocs(colRef);
      const prefix = dirPath.replace(/\/$/, '');
      return snap.docs
        .map(d => ({ path: d.data().path, updatedAt: d.data().updatedAt }))
        .filter(f => f.path && f.path.startsWith(prefix + '/'))
        .map(f => ({
          name: f.path.split('/').pop(),
          path: f.path,
          type: 'file',
          updatedAt: f.updatedAt,
        }));
    } catch (e) {
      console.error('[FS] list error', dirPath, e);
      return [];
    }
  }

  /**
   * Watch a file for changes.
   * @param {string} path
   * @param {Function} handler  (data) => void
   * @returns {Function} unsubscribe
   */
  watch(path, handler) {
    const fsPath = this._fsPath(path);
    if (!fsPath || !db) {
      this._kernel.ipc.on('fs:write', ({ path: p, data }) => {
        if (p === path) handler(data);
      });
      return () => {};
    }

    if (this._watchers.has(path)) this._watchers.get(path)();

    const unsub = onSnapshot(doc(db, fsPath), (snap) => {
      const data = snap.exists() ? snap.data()?.data ?? null : null;
      this._setCache(path, data);
      handler(data);
    });

    this._watchers.set(path, unsub);
    this._kernel.ipc.emit('fs:watch', { path });
    return () => {
      unsub();
      this._watchers.delete(path);
    };
  }

  /**
   * Move/rename a file.
   * @param {string} from
   * @param {string} to
   */
  async move(from, to) {
    const data = await this.read(from);
    if (data === null) return;
    await this.write(to, data);
    await this.delete(from);
  }

  _setCache(path, data) {
    if (this._cacheOrder.length >= MAX_CACHE) {
      const evict = this._cacheOrder.shift();
      this._cache.delete(evict);
    }
    this._cache.set(path, { data, ts: Date.now() });
    this._cacheOrder = this._cacheOrder.filter(p => p !== path);
    this._cacheOrder.push(path);
  }
}

export default FileSystem;
