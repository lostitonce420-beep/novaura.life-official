import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { kernel } from './NovaKernel.js';

/**
 * NovAura OS — Kernel Provider
 * React context that boots the kernel and makes it available throughout the tree.
 * Shows an animated boot screen while the kernel is initializing.
 */

export const KernelContext = createContext(null);

export function KernelProvider({ children }) {
  const [bootState, setBootState] = useState({
    phase: -1,
    progress: 0,
    label: 'Starting NovAura OS...',
    ready: false,
    error: null,
  });
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const unsubPhase = kernel.ipc.on('system:boot:phase', ({ phase, label, progress }) => {
      setBootState(prev => ({ ...prev, phase, label, progress }));
    });

    const unsubReady = kernel.ipc.once('system:ready', () => {
      setBootState(prev => ({ ...prev, progress: 100, label: 'Ready.', ready: true }));
    });

    const unsubError = kernel.ipc.once('system:boot:error', ({ error }) => {
      setBootState(prev => ({ ...prev, error, ready: false }));
    });

    kernel.boot().catch(e => {
      setBootState(prev => ({ ...prev, error: e.message }));
    });

    return () => {
      unsubPhase();
      unsubReady();
      unsubError();
    };
  }, []);

  if (bootState.error) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: '#0a0a0f', color: '#fff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: '#ff4444', fontSize: 16 }}>Kernel boot failed</div>
        <div style={{ color: '#ffffff40', fontSize: 12 }}>{bootState.error}</div>
        <button
          onClick={() => { booted.current = false; kernel.restart(); }}
          style={{
            marginTop: 16, padding: '8px 24px',
            background: 'transparent', border: '1px solid #00f0ff44',
            color: '#00f0ff', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!bootState.ready) {
    return <BootScreen state={bootState} />;
  }

  return (
    <KernelContext.Provider value={kernel}>
      {children}
    </KernelContext.Provider>
  );
}

function BootScreen({ state }) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Background glow effect */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 24,
      }}>
        {/* Logo */}
        <div style={{
          width: 120, height: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'novaura-pulse 2s ease-in-out infinite',
        }}>
          <img 
            src="/logo.png" 
            alt="NovAura"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.5))',
            }}
          />
        </div>

        {/* Brand */}
        <div>
          <div style={{
            fontSize: 32, fontWeight: 800, letterSpacing: 6,
            background: 'linear-gradient(135deg, #00f0ff, #7c3aed, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            NOVAURA OS
          </div>
          <div style={{ color: '#ffffff25', fontSize: 10, letterSpacing: 8, marginTop: 6 }}>
            KERNEL BOOT
          </div>
        </div>

        {/* Progress bar + phase label */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 2, background: '#ffffff08', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: state.progress + '%',
              background: 'linear-gradient(90deg, #00f0ff, #7c3aed)',
              borderRadius: 4,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 12px #00f0ff88',
            }} />
          </div>
          <div style={{ color: '#ffffff35', fontSize: 10, letterSpacing: 2, textAlign: 'center' }}>
            {state.label}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes novaura-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function useKernelContext() {
  return useContext(KernelContext);
}
