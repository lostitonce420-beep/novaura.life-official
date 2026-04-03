/**
 * NovAura OS — kernelStorage
 *
 * Drop-in replacement for localStorage across the entire codebase.
 * Routes all reads/writes through the kernel's MemoryMap (Firestore-backed)
 * with an automatic localStorage fallback for:
 *   - Unauthenticated guests
 *   - Pre-kernel-boot reads
 *   - Guarded features (auth walls, paid tiers)
 *
 * Usage — identical surface to localStorage:
 *   import { kernelStorage } from '../kernel/kernelStorage';
 *   kernelStorage.setItem('my_key', 'value');
 *   const val = kernelStorage.getItem('my_key');
 *   kernelStorage.removeItem('my_key');
 *
 * The kernel is resolved lazily so this module is safe to import at the
 * module level before the kernel has booted.
 */

import { kernel } from './NovaKernel.js';

// Keys that should ALWAYS stay in localStorage (auth tokens, boot flags, etc.)
const LOCAL_ONLY_KEYS = new Set([
  'firebase:authUser',
  'novaura_boot_flag',
  'novaura_first_visit',
  // Legacy auth tokens — kept local, Firebase Auth is the source of truth
  'auth_token',
  'novaura-auth-token',
  'user_data',
  'novaura_user_cache',
  'novaura_current_user',
  // Staff portal tokens — never go to Firestore
  'DILLAN_TOKEN',
  'TYRONE_TOKEN',
  // API client token
  'novaura_api_token',
]);

// Keys that should ALWAYS stay in localStorage (sensitive / access-gate)
// Anything prefixed with these strings stays local
const LOCAL_ONLY_PREFIXES = [
  'firebase:',
  'CookieConsent',
  '__stripe',
  // GitHub token — stays local, never sync to cloud
  'novaura_github',
  // Secrets window — encrypted at rest, user explicit local-only intent
  'novaura-secrets',
  // FCM tokens — device-specific
  'novaura_fcm',
];

function isLocalOnly(key) {
  if (LOCAL_ONLY_KEYS.has(key)) return true;
  return LOCAL_ONLY_PREFIXES.some(p => key.startsWith(p));
}

function isKernelReady() {
  return kernel.bootPhase === 'ready' && kernel.memory && kernel.auth?.uid;
}

// ─── Sync localStorage shim (for legacy callers expecting synchronous get) ──

function localGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function localSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function localRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ─── Public API ──────────────────────────────────────────────────────────────

const kernelStorage = {
  /**
   * Synchronous get — returns value from kernel memory cache if available,
   * otherwise falls back to localStorage.
   * The async `getItemAsync` is preferred when you can await.
   */
  getItem(key) {
    if (isLocalOnly(key)) return localGet(key);
    if (isKernelReady()) {
      const v = kernel.memory.get(key);
      // If kernel has it, return it; if not, fall back to localStorage
      // (could be a first-run before Firestore sync completes)
      return v !== null ? (typeof v === 'string' ? v : JSON.stringify(v)) : localGet(key);
    }
    return localGet(key);
  },

  /**
   * Async get — waits for Firestore if kernel is ready, faster than sync fallback.
   */
  async getItemAsync(key) {
    if (isLocalOnly(key)) return localGet(key);
    if (isKernelReady()) {
      const v = kernel.memory.get(key);
      return v !== null ? (typeof v === 'string' ? v : JSON.stringify(v)) : localGet(key);
    }
    return localGet(key);
  },

  /**
   * Set — writes to kernel memory (Firestore) if kernel is ready,
   * always also mirrors to localStorage as fallback.
   */
  setItem(key, value) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);

    if (isLocalOnly(key)) {
      localSet(key, strVal);
      return;
    }

    // Always mirror to localStorage as instant fallback
    localSet(key, strVal);

    if (isKernelReady()) {
      // Parse JSON for structured storage in MemoryMap
      let parsed = strVal;
      try { parsed = JSON.parse(strVal); } catch {}
      kernel.memory.set(key, parsed);
    }
  },

  /**
   * Remove from both kernel memory and localStorage.
   */
  removeItem(key) {
    localRemove(key);
    if (isKernelReady() && !isLocalOnly(key)) {
      kernel.memory.forget(key);
    }
  },

  /**
   * Clear all non-protected keys from both stores.
   */
  clear() {
    // Only clear non-protected localStorage keys
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !isLocalOnly(k)) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  /**
   * Migrate all existing localStorage keys into the kernel MemoryMap.
   * Call this once after kernel boots for first-time users or upgrades.
   */
  async migrateFromLocalStorage() {
    if (!isKernelReady()) return 0;
    let migrated = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || isLocalOnly(key)) continue;
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch {}
        kernel.memory.set(key, parsed);
        migrated++;
      }
      kernel.ipc?.emit('storage:migrated', { count: migrated });
    } catch {}
    return migrated;
  },
};

export { kernelStorage };
export default kernelStorage;
