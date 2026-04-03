/**
 * NovAura OS — Window Manager
 * Manages all OS windows as first-class processes with state.
 */

let _windowCounter = 0;

class WindowManager {
  constructor() {
    this._kernel = null;
    this._windows = new Map();
    this._nextZIndex = 1000;
    this._subscribers = new Set();
  }

  init(kernel) {
    this._kernel = kernel;

    // Auto-restart a window when CrashHandler signals it's safe to
    kernel.ipc.on('window:restart', ({ windowId }) => {
      const win = this._windows.get(windowId);
      if (!win) return;
      const { type, title, props } = win;
      this.close(windowId);
      setTimeout(() => {
        kernel.ipc.emit('window:restarting', { windowId, type, title });
        this.open(type, title, props);
      }, 300);
    });
  }

  /**
   * Open a new window.
   * @param {string} type
   * @param {string} title
   * @param {object} props
   * @returns {string} windowId
   */
  open(type, title, props = {}) {
    const id = 'win_' + (++_windowCounter) + '_' + Date.now();
    const win = {
      id,
      type,
      title,
      props,
      state: 'normal',
      zIndex: ++this._nextZIndex,
      createdAt: Date.now(),
    };

    this._windows.set(id, win);
    this._notify();
    this._kernel.ipc.emit('window:opened', { id, type, title });
    return id;
  }

  /**
   * Close a window by id.
   * @param {string} id
   */
  close(id) {
    const win = this._windows.get(id);
    if (!win) return;
    this._windows.delete(id);
    this._notify();
    this._kernel.ipc.emit('window:closed', { id, type: win.type });
  }

  /**
   * Bring a window to front.
   * @param {string} id
   */
  focus(id) {
    const win = this._windows.get(id);
    if (!win) return;
    win.zIndex = ++this._nextZIndex;
    if (win.state === 'minimized') win.state = 'normal';
    this._windows.set(id, win);
    this._notify();
    this._kernel.ipc.emit('window:focused', { id });
  }

  minimize(id) {
    this._setState(id, 'minimized');
    this._kernel.ipc.emit('window:minimized', { id });
  }

  restore(id) {
    const win = this._windows.get(id);
    if (!win) return;
    win.state = 'normal';
    win.zIndex = ++this._nextZIndex;
    this._windows.set(id, win);
    this._notify();
    this._kernel.ipc.emit('window:restored', { id });
  }

  maximize(id) {
    this._setState(id, 'maximized');
    this._kernel.ipc.emit('window:maximized', { id });
  }

  /** Update props of an existing window */
  updateProps(id, props) {
    const win = this._windows.get(id);
    if (!win) return;
    win.props = { ...win.props, ...props };
    this._windows.set(id, win);
    this._notify();
  }

  /** Close all windows */
  closeAll() {
    const ids = [...this._windows.keys()];
    ids.forEach(id => this.close(id));
  }

  getAll() {
    return [...this._windows.values()];
  }

  getById(id) {
    return this._windows.get(id) || null;
  }

  getByType(type) {
    return this.getAll().filter(w => w.type === type);
  }

  /** Subscribe to window state changes (for React re-renders) */
  subscribe(handler) {
    this._subscribers.add(handler);
    return () => this._subscribers.delete(handler);
  }

  _setState(id, state) {
    const win = this._windows.get(id);
    if (!win) return;
    win.state = state;
    this._windows.set(id, win);
    this._notify();
  }

  _notify() {
    this._subscribers.forEach(h => {
      try { h(this.getAll()); } catch (e) { console.error('[WM] subscriber error', e); }
    });
  }
}

export default WindowManager;
