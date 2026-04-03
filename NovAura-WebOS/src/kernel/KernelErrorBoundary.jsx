/**
 * NovAura OS — Kernel Error Boundary
 *
 * Wraps any window or component. When a React render error occurs:
 *   1. Catches the error silently
 *   2. Reports to kernel CrashHandler via IPC (triggers AI repair)
 *   3. Shows a minimal in-window recovery UI instead of a blank crash
 *   4. Auto-restarts the window if CrashHandler says it's safe to
 *
 * Usage — wrap any window component:
 *   <KernelErrorBoundary windowId={id} windowType="MusicComposer">
 *     <MusicComposerWindow />
 *   </KernelErrorBoundary>
 *
 * Or use the HOC:
 *   export default withErrorBoundary(MusicComposerWindow, { windowType: 'MusicComposer' });
 */

import { Component } from 'react';
import { ipc } from './IPCBus.js';

class KernelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      crashId: null,
      repairText: null,
      restarting: false,
    };
    this._unsubRepair = null;
    this._restartTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { windowId, windowType } = this.props;

    // Emit to kernel crash handler via IPC
    ipc.emit('crash:boundary', {
      error: { message: error.message, stack: error.stack },
      componentStack: info?.componentStack,
      windowId,
      windowType,
    });

    // Listen for repair suggestion to display it
    this._unsubRepair = ipc.on('crash:repair:ready', ({ crashId, repair, canRestart }) => {
      this.setState({ repairText: repair });
      if (canRestart) {
        this.setState({ restarting: true });
        this._restartTimer = setTimeout(() => this._restart(), 2000);
      }
    });
  }

  componentWillUnmount() {
    this._unsubRepair?.();
    if (this._restartTimer) clearTimeout(this._restartTimer);
  }

  _restart() {
    this._unsubRepair?.();
    this.setState({
      hasError: false,
      error: null,
      crashId: null,
      repairText: null,
      restarting: false,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { windowType = 'Window' } = this.props;
    const { error, repairText, restarting } = this.state;

    return (
      <div style={{
        width: '100%', height: '100%',
        background: '#0d0d14',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, gap: 16,
        fontFamily: 'monospace',
        boxSizing: 'border-box',
      }}>
        {restarting ? (
          <>
            <div style={{ color: '#00f0ff', fontSize: 13, letterSpacing: 1 }}>
              Restarting {windowType}…
            </div>
            <div style={{
              width: 120, height: 2,
              background: '#ffffff10', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '100%',
                background: 'linear-gradient(90deg, #00f0ff, #7c3aed)',
                animation: 'ks-slide 2s linear forwards',
              }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#ff4466', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              {windowType} Error
            </div>

            <div style={{
              color: '#ffffff30', fontSize: 10, maxWidth: 280,
              textAlign: 'center', lineHeight: 1.6,
            }}>
              {error?.message?.slice(0, 120) || 'An unexpected error occurred.'}
            </div>

            {repairText && (
              <div style={{
                background: '#00f0ff08', border: '1px solid #00f0ff18',
                borderRadius: 6, padding: '10px 14px',
                color: '#00f0ffaa', fontSize: 10, maxWidth: 300,
                lineHeight: 1.7, textAlign: 'left',
              }}>
                {repairText.slice(0, 200)}{repairText.length > 200 ? '…' : ''}
              </div>
            )}

            {!repairText && (
              <div style={{ color: '#ffffff18', fontSize: 9, letterSpacing: 1 }}>
                Diagnosing with AI…
              </div>
            )}

            <button
              onClick={() => this._restart()}
              style={{
                marginTop: 8,
                padding: '6px 20px',
                background: 'transparent',
                border: '1px solid #ffffff18',
                color: '#ffffff50',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              RETRY
            </button>
          </>
        )}

        <style>{`
          @keyframes ks-slide {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }
}

/**
 * HOC — wraps a component with KernelErrorBoundary.
 * @param {React.Component} WrappedComponent
 * @param {{ windowType?: string }} options
 */
export function withErrorBoundary(WrappedComponent, options = {}) {
  const displayName = options.windowType || WrappedComponent.displayName || WrappedComponent.name || 'Window';

  function WithBoundary(props) {
    return (
      <KernelErrorBoundary windowId={props.windowId} windowType={displayName}>
        <WrappedComponent {...props} />
      </KernelErrorBoundary>
    );
  }

  WithBoundary.displayName = 'WithErrorBoundary(' + displayName + ')';
  return WithBoundary;
}

export default KernelErrorBoundary;
