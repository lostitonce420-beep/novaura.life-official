/**
 * NovAura Multi-Host Sync Configuration
 * Keeps state in sync between Firebase (novaura.life) and Replit (www.novaura.life)
 */

// Database config - both hosts connect to same PostgreSQL
export const SYNC_CONFIG = {
  // Primary: Firebase hosted (novaura.life)
  // Secondary: Replit hosted (www.novaura.life)
  // Tertiary: Staff portal (staff.novaura.life)
  
  hosts: {
    primary: {
      domain: 'novaura.life',
      host: 'firebase',
      region: 'us-central1',
      priority: 1
    },
    secondary: {
      domain: 'www.novaura.life', 
      host: 'replit',
      region: 'global',
      priority: 2
    },
    staff: {
      domain: 'staff.novaura.life',
      host: 'replit', // or separate instance
      region: 'global',
      priority: 3,
      restricted: true // Admin only
    }
  },
  
  // Real-time sync settings
  sync: {
    // Window state (positions, open apps)
    windows: {
      enabled: true,
      debounce: 500, // ms
      storage: 'postgres'
    },
    // File system (IDE files, projects)
    files: {
      enabled: true,
      storage: 'firebase-storage',
      cache: 'indexeddb'
    },
    // User settings/preferences
    settings: {
      enabled: true,
      storage: 'firebase-firestore',
      realtime: true
    },
    // AI conversation history
    chats: {
      enabled: true,
      storage: 'postgres',
      retention: '30d'
    },
    // Active sessions (who's online)
    presence: {
      enabled: true,
      storage: 'firebase-realtime-db',
      heartbeat: 30000 // 30s
    }
  },
  
  // Failover settings
  failover: {
    enabled: true,
    healthCheckInterval: 30000, // 30s
    autoRedirect: true,
    cooldown: 60000 // 1min between switches
  }
};

// Determine which host we're running on
export function getCurrentHost() {
  const hostname = window.location.hostname;
  if (hostname === 'novaura.life') return 'primary';
  if (hostname === 'www.novaura.life') return 'secondary';
  if (hostname === 'staff.novaura.life') return 'staff';
  return 'development';
}

// Get sync endpoint based on current host
export function getSyncEndpoint() {
  const host = getCurrentHost();
  return SYNC_CONFIG.hosts[host]?.syncUrl || SYNC_CONFIG.hosts.primary.syncUrl;
}

// Check if this is the primary host
export function isPrimaryHost() {
  return getCurrentHost() === 'primary';
}

// Check if staff portal
export function isStaffPortal() {
  return getCurrentHost() === 'staff';
}
