/**
 * useMultiHostSync - Keeps user state synchronized across Firebase + Replit
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { SYNC_CONFIG, getCurrentHost, isPrimaryHost } from '../config/syncConfig';

export function useMultiHostSync() {
  const { user } = useAuth();
  const syncInterval = useRef(null);
  const lastSync = useRef(Date.now());
  
  // Sync window state to shared storage
  const syncWindows = useCallback(async (windows) => {
    if (!user?.uid) return;
    
    try {
      await fetch(`${SYNC_CONFIG.sync.windows.apiUrl}/sync/windows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          host: getCurrentHost(),
          windows: windows.map(w => ({
            id: w.id,
            type: w.type,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
            minimized: w.minimized,
            maximized: w.maximized,
            zIndex: w.zIndex
          })),
          timestamp: Date.now()
        })
      });
      lastSync.current = Date.now();
    } catch (err) {
      console.warn('[Sync] Failed to sync windows:', err);
    }
  }, [user]);
  
  // Load window state from shared storage
  const loadWindows = useCallback(async () => {
    if (!user?.uid) return null;
    
    try {
      const res = await fetch(
        `${SYNC_CONFIG.sync.windows.apiUrl}/sync/windows?userId=${user.uid}&host=${getCurrentHost()}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.windows;
    } catch (err) {
      console.warn('[Sync] Failed to load windows:', err);
      return null;
    }
  }, [user]);
  
  // Broadcast presence (which host user is on)
  const broadcastPresence = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await fetch(`${SYNC_CONFIG.sync.presence.apiUrl}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          host: getCurrentHost(),
          timestamp: Date.now(),
          online: true
        })
      });
    } catch (err) {
      // Silent fail for presence
    }
  }, [user]);
  
  // Listen for sync events from other hosts
  useEffect(() => {
    if (!user?.uid) return;
    
    // Set up presence heartbeat
    broadcastPresence();
    syncInterval.current = setInterval(broadcastPresence, SYNC_CONFIG.sync.presence.heartbeat);
    
    // Subscribe to cross-host sync events via WebSocket or polling
    const eventSource = new EventSource(
      `${SYNC_CONFIG.sync.windows.apiUrl}/sync/events?userId=${user.uid}`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.host !== getCurrentHost() && data.type === 'windows_updated') {
        // Another host updated windows - refresh if needed
        console.log('[Sync] Windows updated from:', data.host);
      }
    };
    
    return () => {
      clearInterval(syncInterval.current);
      eventSource.close();
    };
  }, [user, broadcastPresence]);
  
  // Handle failover - if primary goes down, redirect to secondary
  useEffect(() => {
    if (!SYNC_CONFIG.failover.enabled) return;
    if (isPrimaryHost()) return; // Only check on secondary
    
    const checkPrimary = async () => {
      try {
        const res = await fetch('https://novaura.life/health', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        if (res.ok && SYNC_CONFIG.failover.autoRedirect) {
          // Primary is back up - offer to redirect
          console.log('[Failover] Primary is back up');
        }
      } catch {
        // Primary is down - stay on secondary
        console.log('[Failover] Primary unavailable, staying on secondary');
      }
    };
    
    const interval = setInterval(checkPrimary, SYNC_CONFIG.failover.healthCheckInterval);
    return () => clearInterval(interval);
  }, []);
  
  return {
    syncWindows,
    loadWindows,
    broadcastPresence,
    currentHost: getCurrentHost(),
    isPrimary: isPrimaryHost()
  };
}
