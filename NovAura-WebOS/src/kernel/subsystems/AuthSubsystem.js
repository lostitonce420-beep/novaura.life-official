import { auth as firebaseAuth, isFirebaseConfigured } from '../../config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

/**
 * NovAura OS — Auth Subsystem
 * Single source of truth for authentication state.
 * Firebase Auth only — no localStorage bypass.
 */
class AuthSubsystem {
  constructor() {
    this._kernel = null;
    this._user = null;
    this._ready = false;
    this._readyPromise = null;
    this._readyResolve = null;
    this._unsubscribe = null;

    this._readyPromise = new Promise(resolve => {
      this._readyResolve = resolve;
    });
  }

  init(kernel) {
    this._kernel = kernel;

    if (!isFirebaseConfigured || !firebaseAuth) {
      this._user = null;
      this._ready = true;
      this._readyResolve();
      return;
    }

    this._unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const wasAuthenticated = !!this._user;

      if (firebaseUser) {
        this._user = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || null,
          avatar: firebaseUser.photoURL || null,
        };
      } else {
        this._user = null;
      }

      // First call resolves the ready promise
      if (!this._ready) {
        this._ready = true;
        this._readyResolve();
      }

      kernel.ipc.emit('auth:changed', {
        user: this._user,
        uid: this._user?.uid || null,
        isAuthenticated: !!this._user,
        wasAuthenticated,
      });
    });
  }

  get currentUser() {
    return this._user;
  }

  get uid() {
    return this._user?.uid || null;
  }

  get isAuthenticated() {
    return !!this._user;
  }

  /** Resolves when the first Firebase auth check completes */
  onReady() {
    return this._readyPromise;
  }

  /** Get a fresh Firebase ID token */
  async getToken() {
    try {
      const fbUser = firebaseAuth?.currentUser;
      if (!fbUser) return null;
      return await fbUser.getIdToken();
    } catch (e) {
      console.error('[Auth] getToken error', e);
      return null;
    }
  }

  async signOut() {
    try {
      await signOut(firebaseAuth);
      this._kernel.ipc.emit('auth:signout', {});
    } catch (e) {
      console.error('[Auth] signOut error', e);
    }
  }

  destroy() {
    if (this._unsubscribe) this._unsubscribe();
  }
}

export default AuthSubsystem;
