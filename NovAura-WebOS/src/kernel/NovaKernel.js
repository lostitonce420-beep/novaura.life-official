import { ipc } from './IPCBus.js';
import { kernelStorage } from './kernelStorage.js';
import AuthSubsystem from './subsystems/AuthSubsystem.js';
import WindowManager from './subsystems/WindowManager.js';
import AISubsystem from './subsystems/AISubsystem.js';
import FileSystem from './subsystems/FileSystem.js';
import SettingsStore from './subsystems/SettingsStore.js';
import NotificationBus from './subsystems/NotificationBus.js';
import ProcessManager from './subsystems/ProcessManager.js';
import MemoryMap from './subsystems/MemoryMap.js';
import PluginRegistry from './subsystems/PluginRegistry.js';
import Scheduler from './subsystems/Scheduler.js';
import CrashHandler from './subsystems/CrashHandler.js';
import { getSemanticsEngine } from './SemanticsEngine.js';

/**
 * NovAura OS — Nova Kernel v2
 * Orchestrates all 13 subsystems. Single boot sequence. Singleton instance.
 *
 * Boot phases:
 *   0  KERNEL_INIT   — subsystems instantiated
 *   1  IPC_READY     — event bus online
 *   2  FIREBASE      — firebase connection confirmed
 *   3  AUTH          — first auth state resolved
 *   4  PREFS         — user preferences loaded
 *   5  MEMORY        — memory map online, workspace snapshot loaded
 *   6  AI_CONNECT    — AI provider availability probed (Phase 1/2/3 engine warm)
 *   7  SEMANTICS     — semantics engine online (AI controllable OS)
 *   8  PLUGINS       — plugin registry online
 *   9  SCHEDULER     — task scheduler starts, system tasks registered
 *   10 CRASH_GUARD   — global error handlers installed
 *   11 DESKTOP       — kernel ready, emit system:ready
 */

const BOOT_PHASES = [
  { id: 0,  name: 'KERNEL_INIT',  label: 'Initializing kernel...' },
  { id: 1,  name: 'IPC_READY',    label: 'Event bus online...' },
  { id: 2,  name: 'FIREBASE',     label: 'Connecting to Firebase...' },
  { id: 3,  name: 'AUTH',         label: 'Resolving authentication...' },
  { id: 4,  name: 'PREFS',        label: 'Loading preferences...' },
  { id: 5,  name: 'MEMORY',       label: 'Restoring memory map...' },
  { id: 6,  name: 'AI_CONNECT',   label: 'Probing AI providers...' },
  { id: 7,  name: 'SEMANTICS',    label: 'Initializing semantics engine...' },
  { id: 8,  name: 'PLUGINS',      label: 'Loading plugin registry...' },
  { id: 9,  name: 'SCHEDULER',    label: 'Starting task scheduler...' },
  { id: 10, name: 'CRASH_GUARD',  label: 'Installing crash guard...' },
  { id: 11, name: 'DESKTOP',      label: 'Launching desktop...' },
];

class NovaKernel {
  constructor() {
    this.ipc = ipc;

    // Subsystems (instantiated in boot)
    this.auth          = null;
    this.wm            = null;
    this.ai            = null;
    this.fs            = null;
    this.settings      = null;
    this.notifications = null;
    this.processes     = null;
    this.memory        = null;
    this.plugins       = null;
    this.scheduler     = null;
    this.crash         = null;
    this.semantics     = null;

    this.bootPhase = 'idle';
    this.bootLog   = [];
    this._bootStart = null;
  }

  // ─── Boot Sequence ──────────────────────────────────────────────────────

  async boot() {
    if (this.bootPhase === 'booting' || this.bootPhase === 'ready') return;
    this.bootPhase = 'booting';
    this._bootStart = Date.now();

    try {
      // Phase 0 — Instantiate all 12 subsystems
      await this._phase(0, () => {
        this.auth          = new AuthSubsystem();
        this.wm            = new WindowManager();
        this.ai            = new AISubsystem();
        this.fs            = new FileSystem();
        this.settings      = new SettingsStore();
        this.notifications = new NotificationBus();
        this.processes     = new ProcessManager();
        this.memory        = new MemoryMap();
        this.plugins       = new PluginRegistry();
        this.scheduler     = new Scheduler();
        this.crash         = new CrashHandler();
      });

      // Phase 1 — IPC ready
      await this._phase(1, () => {
        this._log(1, 'IPC bus online. ' + this.ipc._bus.size + ' registered channels.');
      });

      // Phase 2 — Firebase check
      await this._phase(2, async () => {
        const { isFirebaseConfigured } = await import('../config/firebase.js');
        if (!isFirebaseConfigured) {
          this._log(2, 'Firebase not configured — running in offline mode.');
        } else {
          this._log(2, 'Firebase connection confirmed.');
        }
      });

      // Phase 3 — Auth
      await this._phase(3, async () => {
        this.auth.init(this);
        await this.auth.onReady();
        this._log(3, this.auth.isAuthenticated
          ? 'Authenticated: ' + this.auth.currentUser?.email
          : 'No active session.');
      });

      // Phase 4 — Preferences
      await this._phase(4, async () => {
        this.settings.init(this);
        this.settings.onReady?.();
        const llmConfig = this.settings.get('llm_config');
        this._log(4, 'Preferences loaded.' + (llmConfig ? ' LLM config present.' : ''));
      });

      // Phase 5 — Memory map + workspace restore
      await this._phase(5, async () => {
        this.memory.init(this);
        this.memory.onReady?.();
        const snapshot = this.memory.get('workspace:snapshot');
        if (snapshot?.length) {
          this._log(5, 'Workspace snapshot found (' + snapshot.windows.length + ' windows). Restoring...');
          this.memory.restoreWorkspace();
        } else {
          this._log(5, 'Memory map online. No prior workspace snapshot.');
        }
      });

      // Phase 6 — AI providers (Phase 1/2/3 engine)
      await this._phase(6, async () => {
        this.ai.init(this);
        const llmConfig = this.settings.get('llm_config');
        if (llmConfig) this.ai.setConfig(llmConfig);
        await this.ai.loadCacheFromFirestore?.();
        this._log(6, 'AI engine online. Hash cache loaded. Provider probe dispatched.');
      });

      // Phase 7 — Semantics Engine (makes OS AI-controllable)
      await this._phase(7, () => {
        this.semantics = getSemanticsEngine();
        this.semantics.init(this);
        this._log(7, `Semantics engine online. ${this.semantics.getAvailableApps().length} apps registered.`);
      });

      // Phase 8 — Plugin registry
      await this._phase(8, () => {
        this.plugins.init(this);
        this._log(8, 'Plugin registry online.');
      });

      // Phase 9 — Scheduler
      await this._phase(9, () => {
        this.scheduler.init(this);
        // System tasks (heartbeat, autosave, prefs:sync, ai:probe) are
        // registered inside Scheduler.init() → _registerSystemTasks()
        // Add one extra: AI cache warmup on a longer cadence
        this.scheduler.schedule('ai:cache:warmup', () => {
          this.ai.warmupCache?.();
        }, { interval: 1_800_000, tags: ['system', 'ai'] });

        this._log(9, 'Scheduler online. ' + this.scheduler.getAll().length + ' system tasks registered.');
      });

      // Phase 10 — Crash guard
      await this._phase(10, () => {
        this.crash.init(this);
        this._log(10, 'Crash guard installed. Auto-repair via Gemini active.');
      });

      // Phase 11 — Remaining subsystems + Desktop ready
      await this._phase(11, () => {
        this.fs.init(this);
        this.notifications.init(this);
        this.processes.init(this);
        this.processes.boot();
        this._log(11, 'Desktop ready. Boot took ' + (Date.now() - this._bootStart) + 'ms.');
      });

      this.bootPhase = 'ready';
      this.ipc.emit('system:ready', {
        uid: this.auth.uid,
        bootTime: Date.now() - this._bootStart,
        bootLog: this.bootLog,
      });

      // Migrate any existing localStorage data into kernel memory (non-blocking)
      if (this.auth.uid) {
        kernelStorage.migrateFromLocalStorage().then(count => {
          if (count > 0) this._log(10, 'Migrated ' + count + ' localStorage keys to kernel memory.');
        });
      }

    } catch (error) {
      this.bootPhase = 'error';
      console.error('[Kernel] Boot failed:', error);
      this.ipc.emit('system:boot:error', {
        phase: this.bootPhase,
        error: error.message,
      });
      throw error;
    }
  }

  // ─── Convenience API ────────────────────────────────────────────────────

  openWindow(type, title, props = {}) {
    return this.wm.open(type, title, props);
  }

  closeWindow(id) {
    return this.wm.close(id);
  }

  notify(title, body, type = 'info', options = {}) {
    return this.notifications.push({ title, body, type, ...options });
  }

  async request(prompt, options = {}) {
    return this.ai.request(prompt, options);
  }

  remember(key, value, options = {}) {
    return this.memory.set(key, value, options);
  }

  recall(key) {
    return this.memory.get(key);
  }

  reportCrash(error, context = {}) {
    return this.crash.report(error, context);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  async shutdown() {
    this._log(-1, 'Shutdown initiated...');
    this.ipc.emit('system:shutdown', {});

    try {
      // Snapshot workspace before closing
      if (this.auth?.isAuthenticated && this.memory && this.wm) {
        this.memory.snapshotWorkspace();
        this._log(-1, 'Workspace snapshot saved.');
      }

      this.scheduler?.destroy();
      this.crash?.destroy();
      this.wm?.closeAll();
      this.settings?._flush?.();
      this.settings?.destroy();
      this.notifications?.destroy();

      if (this.auth?.isAuthenticated) await this.auth.signOut();
    } catch (e) {
      console.error('[Kernel] Shutdown error', e);
    }

    this.bootPhase = 'idle';
    this.ipc.clear();
  }

  async restart() {
    await this.shutdown();
    await this.boot();
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  async _phase(phaseId, fn) {
    const phase = BOOT_PHASES[phaseId];
    this._log(phaseId, phase.label);
    this.ipc.emit('system:boot:phase', {
      phase: phaseId,
      name: phase.name,
      label: phase.label,
      progress: Math.round((phaseId / (BOOT_PHASES.length - 1)) * 100),
    });
    await fn();
  }

  _log(phase, message) {
    const entry = { phase, message, ts: Date.now() };
    this.bootLog.push(entry);
    if (import.meta.env.DEV) {
      console.log('[Kernel] Phase ' + phase + ': ' + message);
    }
  }
}

export const kernel = new NovaKernel();
export default NovaKernel;
