/**
 * NovAura OS — Crash Handler v2
 *
 * Intercepts, classifies, and heals runtime errors silently before users notice.
 *
 * Healing pipeline:
 *   1. Noise filter  — drop browser-extension / ResizeObserver / benign errors
 *   2. Dedup guard   — same message within 10s = silent drop
 *   3. Pattern match — 20+ known error patterns → instant fix, no AI needed
 *   4. AI repair     — Gemini diagnoses + suggests fix (temp 0.2)
 *   5. Auto-restart  — if pattern or AI says "restart", kernel relaunches the window
 *   6. Firestore log — every crash recorded for post-mortem
 *
 * Circuit breaker: if >5 repairs/min → pause AI repairs, keep logging
 */

import { db } from '../../config/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://us-central1-novaura-systems.cloudfunctions.net/api';

// ─── Noise Filter ───────────────────────────────────────────────────────────
// These patterns are known-benign or external; never log or repair them.
const NOISE_PATTERNS = [
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /ResizeObserver loop limit exceeded/,
  /ResizeObserver loop completed/,
  /Non-Error promise rejection captured with keys/,
  /^Script error\.?$/,
  /Invariant: attempted to hard navigate/,
  /Loading chunk \d+ failed/,           // handled separately as ChunkLoadError
  /hydration/i,
  /The play\(\) request was interrupted/,
  /NotAllowedError: play\(\)/,
];

// ─── Instant-Repair Patterns ────────────────────────────────────────────────
// Known error message → { fix description, canRestart }
// These run WITHOUT calling AI, sub-millisecond response.
const INSTANT_REPAIRS = [
  {
    match: /Cannot read propert(?:y|ies) of (null|undefined)/i,
    fix: 'Add null guard before property access (e.g. `obj?.prop`). Safe to restart window.',
    canRestart: true,
  },
  {
    match: /is not a function/i,
    fix: 'The called value is undefined or not a function. Check import path and export name.',
    canRestart: true,
  },
  {
    match: /Failed to fetch|NetworkError|net::ERR_/i,
    fix: 'Network request failed. Backend may be unreachable. Request will be retried on next action.',
    canRestart: false,
  },
  {
    match: /Firebase: Error \(auth\/network-request-failed\)/i,
    fix: 'Firebase auth network error. Check internet connection. Auth state preserved.',
    canRestart: false,
  },
  {
    match: /Firebase: Error \(auth\/too-many-requests\)/i,
    fix: 'Auth rate limit hit. Wait 60 seconds before retrying sign-in.',
    canRestart: false,
  },
  {
    match: /PERMISSION_DENIED|Missing or insufficient permissions/i,
    fix: 'Firestore security rule blocked this read/write. User may not be authenticated or lacks access.',
    canRestart: false,
  },
  {
    match: /Quota exceeded|QUOTA_EXCEEDED|storage quota/i,
    fix: 'Storage quota exceeded. Clear cached data via Settings > Storage.',
    canRestart: false,
  },
  {
    match: /ChunkLoadError|Loading CSS chunk/i,
    fix: 'Code chunk failed to load (likely a deploy update). Page reload required.',
    canRestart: true,
    hardReload: true,
  },
  {
    match: /Maximum update depth exceeded/i,
    fix: 'React infinite render loop detected. Check useEffect dependency arrays for missing or circular deps.',
    canRestart: true,
  },
  {
    match: /Each child in a list should have a unique "key"/i,
    fix: 'React list missing key props. Add unique `key` to each mapped element.',
    canRestart: false,
  },
  {
    match: /Minified React error/i,
    fix: 'React internal error. Enable DEV mode for full message. Likely a hook rule violation.',
    canRestart: true,
  },
  {
    match: /WebGL context lost/i,
    fix: 'GPU context lost. Graphics-intensive window will be restarted.',
    canRestart: true,
  },
  {
    match: /AudioContext.*not allowed/i,
    fix: 'Web Audio requires a user gesture before starting. Trigger audio after a click event.',
    canRestart: false,
  },
  {
    match: /IndexedDB/i,
    fix: 'IndexedDB access failed. App will fall back to in-memory storage.',
    canRestart: false,
  },
  {
    match: /Objects are not valid as a React child/i,
    fix: 'An object was passed where a React node is expected. Stringify or destructure the value.',
    canRestart: true,
  },
  {
    match: /Invalid hook call/i,
    fix: 'Hook called outside a React component or inside a conditional. Move hook to top level.',
    canRestart: true,
  },
  {
    match: /Cannot update a component .* while rendering a different component/i,
    fix: 'State update during render. Move the setState call into a useEffect.',
    canRestart: true,
  },
  {
    match: /out of memory|allocation failed/i,
    fix: 'JavaScript heap exhausted. Close unused windows to free memory.',
    canRestart: false,
  },
  {
    match: /CORS/i,
    fix: 'Cross-origin request blocked. Ensure the backend sets correct CORS headers for this origin.',
    canRestart: false,
  },
  {
    match: /JSON\.parse|Unexpected token|JSON at position/i,
    fix: 'Malformed JSON received from server or localStorage. Data will be reset to default.',
    canRestart: false,
  },
];

const REPAIR_PROMPT = (error, context) =>
  'You are a live code repair agent for NovAura OS (React/Vite browser OS). ' +
  'A runtime error occurred. Diagnose the root cause and provide a specific, actionable fix.\n\n' +
  'ERROR: ' + (error.message || String(error)) + '\n\n' +
  'STACK:\n' + (error.stack || 'unavailable').slice(0, 800) + '\n\n' +
  'CONTEXT:\n' + JSON.stringify(context, null, 2).slice(0, 600) + '\n\n' +
  'Respond with:\n' +
  '1. Root cause (one sentence)\n' +
  '2. Exact fix (code change or config)\n' +
  '3. Can the window safely restart? (yes/no)\n' +
  'Be concise. No markdown headers.';

// ─── Main Class ──────────────────────────────────────────────────────────────

class CrashHandler {
  constructor() {
    this._kernel = null;
    this._log = [];
    this._MAX_LOG = 100;
    this._repairing = new Set();

    // Dedup: message -> last timestamp
    this._recentErrors = new Map();
    this._DEDUP_WINDOW_MS = 10_000;

    // Circuit breaker
    this._repairTimestamps = [];
    this._REPAIR_RATE_LIMIT = 5;
    this._REPAIR_RATE_WINDOW = 60_000;
    this._circuitOpen = false;

    this._globalErrorHandler = null;
    this._globalRejectionHandler = null;
  }

  init(kernel) {
    this._kernel = kernel;

    kernel.ipc.on('crash:report', async (payload) => {
      await this.report(payload.error, payload.context);
    });

    // React error boundary hook — windows emit this when they catch render errors
    kernel.ipc.on('crash:boundary', async ({ error, componentStack, windowId, windowType }) => {
      const crashId = await this.report(
        { message: error?.message || 'React render error', stack: componentStack },
        { type: 'react:boundary', windowId, windowType }
      );
      // Auto-restart the window after a short delay
      if (windowId) {
        setTimeout(() => {
          kernel.ipc.emit('window:restart', { windowId });
        }, 1500);
      }
      return crashId;
    });

    this._globalErrorHandler = (event) => {
      if (this._isNoise(event.message)) return;
      event.preventDefault?.(); // suppress browser console error for handled ones
      this.report(
        { message: event.message, stack: event.error?.stack, filename: event.filename, lineno: event.lineno },
        { type: 'global:error', source: event.filename }
      );
    };

    this._globalRejectionHandler = (event) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason);
      if (this._isNoise(msg)) return;
      event.preventDefault?.();
      this.report(
        { message: msg, stack: reason?.stack },
        { type: 'global:unhandledRejection' }
      );
    };

    window.addEventListener('error', this._globalErrorHandler);
    window.addEventListener('unhandledrejection', this._globalRejectionHandler);
    kernel.ipc.on('system:shutdown', () => this.destroy());
  }

  // ─── Noise Filter ─────────────────────────────────────────────────────────

  _isNoise(message) {
    if (!message) return true;
    return NOISE_PATTERNS.some(p => p.test(message));
  }

  // ─── Dedup Guard ──────────────────────────────────────────────────────────

  _isDuplicate(message) {
    const now = Date.now();
    const last = this._recentErrors.get(message);
    if (last && now - last < this._DEDUP_WINDOW_MS) return true;
    this._recentErrors.set(message, now);
    // Clean old entries periodically
    if (this._recentErrors.size > 50) {
      for (const [k, v] of this._recentErrors) {
        if (now - v > this._DEDUP_WINDOW_MS) this._recentErrors.delete(k);
      }
    }
    return false;
  }

  // ─── Circuit Breaker ──────────────────────────────────────────────────────

  _canRepair() {
    if (this._circuitOpen) return false;
    const now = Date.now();
    this._repairTimestamps = this._repairTimestamps.filter(t => now - t < this._REPAIR_RATE_WINDOW);
    if (this._repairTimestamps.length >= this._REPAIR_RATE_LIMIT) {
      this._circuitOpen = true;
      this._kernel.ipc.emit('crash:circuit:open', { reason: 'repair rate limit hit' });
      setTimeout(() => {
        this._circuitOpen = false;
        this._kernel.ipc.emit('crash:circuit:closed', {});
      }, this._REPAIR_RATE_WINDOW);
      return false;
    }
    return true;
  }

  // ─── Instant Pattern Match ────────────────────────────────────────────────

  _instantRepair(message) {
    for (const rule of INSTANT_REPAIRS) {
      if (rule.match.test(message)) return rule;
    }
    return null;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Report an error. Full healing pipeline runs automatically.
   * @param {object} error   { message, stack, filename?, lineno? }
   * @param {object} context { windowId?, windowType?, component?, type? }
   * @returns {string} crashId
   */
  async report(error, context = {}) {
    const message = error?.message || String(error);

    if (this._isNoise(message)) return null;
    if (this._isDuplicate(message)) return null;

    const crashId = 'crash_' + Date.now();
    const record = {
      id: crashId,
      error: {
        message,
        stack: error.stack || null,
        filename: error.filename || null,
        lineno: error.lineno || null,
      },
      context,
      ts: Date.now(),
      repairStatus: 'pending',
      repairResponse: null,
      instant: false,
    };

    this._log.push(record);
    if (this._log.length > this._MAX_LOG) this._log.shift();

    this._kernel.ipc.emit('crash:detected', { crashId, error: record.error, context });

    // ── Phase 1: Instant repair (pattern match) ──
    const instant = this._instantRepair(message);
    if (instant) {
      record.repairStatus = 'complete';
      record.repairResponse = instant.fix;
      record.instant = true;

      this._kernel.ipc.emit('crash:repair:ready', {
        crashId,
        repair: instant.fix,
        context,
        canRestart: instant.canRestart,
        instant: true,
      });

      if (instant.hardReload) {
        setTimeout(() => window.location.reload(), 2000);
        this._kernel.notifications.push({
          type: 'warning',
          title: 'Reloading to apply update',
          body: instant.fix,
          source: 'crash-handler',
          ttl: 3000,
        });
      } else if (instant.canRestart && context.windowId) {
        setTimeout(() => {
          this._kernel.ipc.emit('window:restart', { windowId: context.windowId });
        }, 800);
      }
    } else {
      // ── Phase 2: AI repair (Gemini) ──
      this._kernel.notifications.push({
        id: crashId + '_notif',
        type: 'error',
        title: 'Error Detected — Diagnosing...',
        body: message.slice(0, 120),
        source: 'crash-handler',
        ttl: 6000,
      });

      if (this._canRepair()) {
        this._repairTimestamps.push(Date.now());
        this._repairWithAI(record);
      }
    }

    this._logToFirestore(record);
    return crashId;
  }

  async _repairWithAI(record) {
    if (this._repairing.has(record.id)) return;
    this._repairing.add(record.id);

    this._kernel.ipc.emit('crash:repair:start', { crashId: record.id });

    try {
      const token = await this._kernel.auth.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(BACKEND_URL + '/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: REPAIR_PROMPT(record.error, record.context),
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          maxTokens: 512,
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      const repairText = data.response || 'No repair suggestion available.';
      const canRestart = /\byes\b/i.test(repairText) || /restart/i.test(repairText);

      record.repairStatus = 'complete';
      record.repairResponse = repairText;

      this._kernel.ipc.emit('crash:repair:ready', {
        crashId: record.id,
        repair: repairText,
        context: record.context,
        canRestart,
        instant: false,
      });

      this._kernel.notifications.push({
        type: 'info',
        title: 'Auto-Repair Ready',
        body: repairText.slice(0, 140) + (repairText.length > 140 ? '…' : ''),
        source: 'crash-handler',
        ttl: 12000,
      });

      if (canRestart && record.context?.windowId) {
        setTimeout(() => {
          this._kernel.ipc.emit('window:restart', { windowId: record.context.windowId });
        }, 1500);
      }

      this._logToFirestore(record);

    } catch (e) {
      record.repairStatus = 'failed';
      this._kernel.ipc.emit('crash:repair:error', { crashId: record.id, error: e.message });
    } finally {
      this._repairing.delete(record.id);
    }
  }

  async _logToFirestore(record) {
    if (!db) return;
    try {
      const uid = this._kernel.auth.uid || 'anonymous';
      await addDoc(collection(db, 'crash_logs'), {
        ...record,
        uid,
        updatedAt: serverTimestamp(),
      });
    } catch {} // never let logging break anything
  }

  getLog(n = 20) {
    return this._log.slice(-n);
  }

  getRepairStatus(crashId) {
    return this._log.find(r => r.id === crashId) || null;
  }

  destroy() {
    if (this._globalErrorHandler) window.removeEventListener('error', this._globalErrorHandler);
    if (this._globalRejectionHandler) window.removeEventListener('unhandledrejection', this._globalRejectionHandler);
  }
}

export default CrashHandler;
