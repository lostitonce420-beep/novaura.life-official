import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { KernelContext } from './KernelProvider.jsx';
import { kernel as kernelSingleton } from './NovaKernel.js';

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
