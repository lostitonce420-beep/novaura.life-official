import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { KernelContext } from './KernelProvider.jsx';
import { kernel as kernelSingleton } from './NovaKernel.js';
import { kernelStorage } from './kernelStorage.js';

/**
 * NovAura OS — Kernel Hooks
 * Clean React hooks for interacting with the kernel from any component.
 */

// Always returns the kernel (falls back to singleton if outside KernelProvider)
export function useKernel() {
  const ctx = useContext(KernelContext);
  return ctx || kernelSingleton;
}

/**
 * Returns the live windows array. Re-renders when any window opens/closes/changes.
 */
export function useWindows() {
  const kernel = useKernel();
  const [windows, setWindows] = useState(() => kernel.wm?.getAll() || []);

  useEffect(() => {
    if (!kernel.wm) return;
    setWindows(kernel.wm.getAll());
    return kernel.wm.subscribe(setWindows);
  }, [kernel]);

  return windows;
}

/**
 * Returns current auth state. Re-renders on auth changes.
 */
export function useAuth() {
  const kernel = useKernel();
  const [authState, setAuthState] = useState({
    user: kernel.auth?.currentUser || null,
    uid: kernel.auth?.uid || null,
    isAuthenticated: kernel.auth?.isAuthenticated || false,
  });

  useEffect(() => {
    return kernel.ipc.on('auth:changed', ({ user, uid, isAuthenticated }) => {
      setAuthState({ user, uid, isAuthenticated });
    });
  }, [kernel]);

  return authState;
}

/**
 * Returns active notifications. Re-renders when notifications change.
 */
export function useNotifications() {
  const kernel = useKernel();
  const [notifications, setNotifications] = useState(
    () => kernel.notifications?.getActive() || []
  );

  useEffect(() => {
    if (!kernel.notifications) return;
    setNotifications(kernel.notifications.getActive());
    return kernel.notifications.subscribe(setNotifications);
  }, [kernel]);

  return notifications;
}

/**
 * Read and write a single settings key.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {[any, Function]}  [value, setter]
 */
export function useSettings(key, defaultValue = null) {
  const kernel = useKernel();
  const [value, setValue] = useState(() => kernel.settings?.get(key, defaultValue) ?? defaultValue);

  useEffect(() => {
    if (!kernel.settings) return;
    setValue(kernel.settings.get(key, defaultValue));
    return kernel.settings.watch(key, (newVal) => setValue(newVal));
  }, [kernel, key]);

  const set = useCallback((newValue) => {
    kernel.settings?.set(key, newValue);
  }, [kernel, key]);

  return [value, set];
}

/**
 * AI request hook.
 * @returns {{ request: Function, pending: boolean, providers: object }}
 */
export function useAI() {
  const kernel = useKernel();
  const [pending, setPending] = useState(false);
  const [providers, setProviders] = useState({});

  useEffect(() => {
    const unsubStart = kernel.ipc.on('ai:request:start', () => setPending(true));
    const unsubEnd = kernel.ipc.on('ai:request:complete', () => setPending(false));
    const unsubErr = kernel.ipc.on('ai:request:error', () => setPending(false));
    const unsubProviders = kernel.ipc.on('ai:providers:updated', ({ providers: p }) => setProviders(p));

    // Load initial provider status
    if (kernel.ai) setProviders(kernel.ai.getProviderStatus());

    return () => { unsubStart(); unsubEnd(); unsubErr(); unsubProviders(); };
  }, [kernel]);

  const request = useCallback((prompt, options = {}) => {
    return kernel.ai?.request(prompt, options);
  }, [kernel]);

  return { request, pending, providers };
}

/**
 * Subscribe to an IPC channel. Automatically cleans up on unmount.
 * @param {string} channel
 * @param {Function} handler
 * @param {Array} deps
 */
export function useIPC(channel, handler, deps = []) {
  const kernel = useKernel();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return kernel.ipc.on(channel, (payload, ch) => handlerRef.current(payload, ch));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kernel, channel, ...deps]);
}

/**
 * Process manager hook — returns running processes.
 */
export function useProcesses() {
  const kernel = useKernel();
  const [processes, setProcesses] = useState(() => kernel.processes?.getAll() || []);

  useEffect(() => {
    if (!kernel.processes) return;
    setProcesses(kernel.processes.getAll());
    return kernel.processes.subscribe(setProcesses);
  }, [kernel]);

  return processes;
}

/**
 * MemoryMap hook — read/write kernel memory.
 * @returns {{ get: Function, set: Function, forget: Function }}
 */
export function useMemory() {
  const kernel = useKernel();
  const get = useCallback((key, fallback = null) => {
    return kernel.memory?.get(key, fallback) ?? fallback;
  }, [kernel]);
  const set = useCallback((key, value, options = {}) => {
    return kernel.memory?.set(key, value, options);
  }, [kernel]);
  const forget = useCallback((key) => {
    return kernel.memory?.forget(key);
  }, [kernel]);
  return { get, set, forget };
}

/**
 * Plugin registry hook.
 * @returns {{ register: Function, call: Function, broadcast: Function, findByCapability: Function }}
 */
export function usePlugins() {
  const kernel = useKernel();
  const register = useCallback((id, name, handler) => {
    return kernel.plugins?.register(id, name, handler);
  }, [kernel]);
  const call = useCallback((id, capability, args) => {
    return kernel.plugins?.call(id, capability, args);
  }, [kernel]);
  const broadcast = useCallback((capability, args) => {
    return kernel.plugins?.broadcast(capability, args);
  }, [kernel]);
  const findByCapability = useCallback((name) => {
    return kernel.plugins?.findByCapability(name) || [];
  }, [kernel]);
  return { register, call, broadcast, findByCapability };
}

/**
 * Scheduler hook — inspect and control scheduled tasks.
 * @returns {{ tasks: object[], runNow: Function, pause: Function, resume: Function }}
 */
export function useScheduler() {
  const kernel = useKernel();
  const [tasks, setTasks] = useState(() => kernel.scheduler?.getAll?.() || []);

  useEffect(() => {
    const unsub = kernel.ipc.on('scheduler:task:run', () => {
      setTasks(kernel.scheduler?.getAll?.() || []);
    });
    return unsub;
  }, [kernel]);

  const runNow = useCallback((name) => kernel.scheduler?.runNow(name), [kernel]);
  const pause = useCallback((name) => kernel.scheduler?.pause(name), [kernel]);
  const resume = useCallback((name) => kernel.scheduler?.resume(name), [kernel]);

  return { tasks, runNow, pause, resume };
}

/**
 * Crash handler hook — access crash log and repair status.
 * @returns {{ crashes: object[], circuitOpen: boolean, repairStatus: Function }}
 */
export function useCrash() {
  const kernel = useKernel();
  const [crashes, setCrashes] = useState(() => kernel.crash?.getLog(10) || []);
  const [circuitOpen, setCircuitOpen] = useState(false);

  useEffect(() => {
    const unsubCrash  = kernel.ipc.on('crash:detected', () => setCrashes(kernel.crash?.getLog(10) || []));
    const unsubRepair = kernel.ipc.on('crash:repair:ready', () => setCrashes(kernel.crash?.getLog(10) || []));
    const unsubOpen   = kernel.ipc.on('crash:circuit:open', () => setCircuitOpen(true));
    const unsubClosed = kernel.ipc.on('crash:circuit:closed', () => setCircuitOpen(false));
    return () => { unsubCrash(); unsubRepair(); unsubOpen(); unsubClosed(); };
  }, [kernel]);

  const repairStatus = useCallback((crashId) => {
    return kernel.crash?.getRepairStatus(crashId) || null;
  }, [kernel]);

  return { crashes, circuitOpen, repairStatus };
}

/**
 * Persistent window memory — drop-in replacement for useState that automatically
 * saves to kernelStorage (→ MemoryMap → Firestore) and restores on mount.
 *
 * Works for authenticated users (Firestore-backed) and guests (localStorage fallback).
 * Writes are debounced 600ms so keystrokes don't hammer the database.
 *
 * Usage:
 *   const [draft, setDraft] = useWindowMemory('art-studio', 'lastPrompt', '');
 *   const [settings, setSettings] = useWindowMemory('music-composer', 'config', defaultConfig);
 *
 * @param {string} windowType   The window's type id (e.g. 'art-studio', 'ide')
 * @param {string} key          Sub-key within that window's namespace
 * @param {any}    initialValue Fallback when no saved value exists
 * @returns {[any, Function]}   [value, setter] — same interface as useState
 */
export function useWindowMemory(windowType, key, initialValue = null) {
  const storageKey = `win_mem:${windowType}:${key}`;

  const [state, setStateRaw] = useState(() => {
    try {
      const saved = kernelStorage.getItem(storageKey);
      if (saved === null || saved === undefined) return initialValue;
      try { return JSON.parse(saved); } catch { return saved; }
    } catch {
      return initialValue;
    }
  });

  const debounceRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback((valueOrUpdater) => {
    setStateRaw(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      // Debounce the write so rapid updates (typing) don't spam the DB
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          kernelStorage.setItem(storageKey, typeof next === 'string' ? next : JSON.stringify(next));
        } catch { /* non-critical */ }
      }, 600);
      return next;
    });
  }, [storageKey]);

  // Flush immediately on unmount so no data is lost when the window closes
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        try {
          kernelStorage.setItem(
            storageKey,
            typeof stateRef.current === 'string' ? stateRef.current : JSON.stringify(stateRef.current)
          );
        } catch { /* non-critical */ }
      }
    };
  }, [storageKey]);

  return [state, setState];
}

/**
 * Clears all persisted memory for a specific window type.
 * Useful for "reset" buttons in windows.
 *
 * @param {string} windowType
 * @param {string[]} keys   Array of keys that were saved via useWindowMemory
 */
export function clearWindowMemory(windowType, keys) {
  keys.forEach(key => {
    try { kernelStorage.removeItem(`win_mem:${windowType}:${key}`); } catch { /* non-critical */ }
  });
}

/**
 * Persistent window memory — drop-in replacement for useState that automatically
 * saves to kernelStorage (→ MemoryMap → Firestore) and restores on mount.
 *
 * Works for authenticated users (Firestore-backed) and guests (localStorage fallback).
 * Writes are debounced 600ms so keystrokes don't hammer the database.
 *
 * Usage:
 *   const [draft, setDraft] = useWindowMemory('art-studio', 'lastPrompt', '');
 *   const [settings, setSettings] = useWindowMemory('music-composer', 'config', defaultConfig);
 *
 * @param {string} windowType   The window's type id (e.g. 'art-studio', 'ide')
 * @param {string} key          Sub-key within that window's namespace
 * @param {any}    initialValue Fallback when no saved value exists
 * @returns {[any, Function]}   [value, setter] — same interface as useState
 */
export function useWindowMemory(windowType, key, initialValue = null) {
  const storageKey = `win_mem:${windowType}:${key}`;

  const [state, setStateRaw] = useState(() => {
    try {
      const saved = kernelStorage.getItem(storageKey);
      if (saved === null || saved === undefined) return initialValue;
      try { return JSON.parse(saved); } catch { return saved; }
    } catch {
      return initialValue;
    }
  });

  const debounceRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback((valueOrUpdater) => {
    setStateRaw(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      // Debounce the write so rapid updates (typing) don't spam the DB
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          kernelStorage.setItem(storageKey, typeof next === 'string' ? next : JSON.stringify(next));
        } catch { /* non-critical */ }
      }, 600);
      return next;
    });
  }, [storageKey]);

  // Flush immediately on unmount so no data is lost when the window closes
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        try {
          kernelStorage.setItem(
            storageKey,
            typeof stateRef.current === 'string' ? stateRef.current : JSON.stringify(stateRef.current)
          );
        } catch { /* non-critical */ }
      }
    };
  }, [storageKey]);

  return [state, setState];
}

/**
 * Clears all persisted memory for a specific window type.
 * Useful for "reset" buttons in windows.
 *
 * @param {string} windowType
 * @param {string[]} keys   Array of keys that were saved via useWindowMemory
 */
export function clearWindowMemory(windowType, keys) {
  keys.forEach(key => {
    try { kernelStorage.removeItem(`win_mem:${windowType}:${key}`); } catch { /* non-critical */ }
  });
}
