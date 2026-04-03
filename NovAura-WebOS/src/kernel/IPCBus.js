/**
 * NovAura OS — IPC Bus
 * Fast typed pub/sub event bus. The nervous system of the kernel.
 * Every subsystem communicates exclusively through this bus.
 */

let _requestCounter = 0;

class IPCBus {
  constructor() {
    this._bus = new Map();
    this._history = [];
    this._maxHistory = 500;
    this._debug = typeof import.meta.env !== 'undefined' && import.meta.env.DEV;
  }

  emit(channel, payload) {
    if (this._history.length >= this._maxHistory) this._history.shift();
    this._history.push({ channel, payload, ts: Date.now() });

    const handlers = this._bus.get(channel);
    if (handlers) {
      handlers.forEach(h => {
        try { h(payload, channel); } catch (e) { console.error('[IPC] handler error on ' + channel, e); }
      });
    }

    this._bus.forEach((set, pattern) => {
      if (pattern === channel) return;
      if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, -2);
        if (channel.startsWith(prefix + ':')) {
          set.forEach(h => {
            try { h(payload, channel); } catch (e) { console.error('[IPC] wildcard handler error on ' + pattern, e); }
          });
        }
      }
    });
  }

  on(channel, handler) {
    if (!this._bus.has(channel)) this._bus.set(channel, new Set());
    this._bus.get(channel).add(handler);
    return () => this.off(channel, handler);
  }

  once(channel, handler) {
    const wrapped = (payload, ch) => {
      this.off(channel, wrapped);
      handler(payload, ch);
    };
    return this.on(channel, wrapped);
  }

  off(channel, handler) {
    const handlers = this._bus.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) this._bus.delete(channel);
    }
  }

  request(channel, payload, timeout = 5000) {
    const requestId = 'req_' + (++_requestCounter) + '_' + Date.now();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error('[IPC] request timeout: ' + channel + ' (' + timeout + 'ms)'));
      }, timeout);

      const unsub = this.once(channel + ':response', (data) => {
        if (data._requestId !== requestId) return;
        clearTimeout(timer);
        resolve(data.payload);
      });

      this.emit(channel, Object.assign({}, payload, { _requestId: requestId }));
    });
  }

  reply(channel, requestId, payload) {
    this.emit(channel + ':response', { _requestId: requestId, payload });
  }

  history(n = 50) {
    return this._history.slice(-n);
  }

  clear() {
    this._bus.clear();
  }
}

export const ipc = new IPCBus();
export default IPCBus;
