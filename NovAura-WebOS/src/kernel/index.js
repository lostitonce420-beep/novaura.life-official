/**
 * NovAura OS Kernel — Public API
 * Import anything kernel-related from here.
 *
 * Usage:
 *   import { kernel, useKernel, useWindows, KernelProvider, kernelStorage } from '../kernel';
 */

export { kernel }                        from './NovaKernel.js';
export { ipc }                           from './IPCBus.js';
export { KernelProvider, KernelContext }            from './KernelProvider.jsx';
export { kernelStorage }                            from './kernelStorage.js';
export { default as KernelErrorBoundary, withErrorBoundary } from './KernelErrorBoundary.jsx';
export {
  useKernel,
  useWindows,
  useAuth,
  useNotifications,
  useSettings,
  useAI,
  useIPC,
  useProcesses,
  useMemory,
  usePlugins,
  useScheduler,
  useCrash,
} from './useKernel.js';
