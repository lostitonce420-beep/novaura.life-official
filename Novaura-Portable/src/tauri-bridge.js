/**
 * Novaura Portable - Tauri Bridge
 * Provides JavaScript interface to Rust backend for:
 * - Session persistence
 * - AI context storage
 * - File operations
 * - Backup management
 */

import { invoke } from '@tauri-apps/api/tauri';
import { appWindow, PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

// ==================== Session Management ====================

/**
 * Save the complete desktop session (open windows, positions, theme)
 * @param {Object} sessionData - Desktop session state
 */
export async function saveSession(sessionData) {
  try {
    await invoke('save_session', { sessionData });
    console.log('💾 Session saved');
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Load the last saved session
 * @returns {Object|null} Session data or null if no session exists
 */
export async function loadSession() {
  try {
    const session = await invoke('load_session');
    return session?.data || null;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Clear all session data
 */
export async function clearSession() {
  try {
    await invoke('clear_session');
    console.log('🗑️ Session cleared');
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Auto-save session with debouncing
 */
let saveTimeout = null;
export function autoSaveSession(sessionData, delay = 2000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSession(sessionData);
  }, delay);
}

// ==================== Context / AI Conversations ====================

/**
 * Save a complete conversation
 * @param {string} id - Conversation ID
 * @param {string} title - Conversation title
 * @param {Array} messages - Array of message objects
 */
export async function saveConversation(id, title, messages) {
  try {
    await invoke('save_conversation', { id, title, messages });
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

/**
 * Get all conversations list
 * @returns {Array} List of conversations
 */
export async function loadConversations() {
  try {
    return await invoke('load_conversations');
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

/**
 * Get conversation context window (recent messages)
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Max number of messages
 * @returns {Array} Recent messages
 */
export async function getConversationContext(conversationId, limit = 10) {
  try {
    return await invoke('get_conversation_context', { conversationId, limit });
  } catch (error) {
    console.error('Failed to get context:', error);
    return [];
  }
}

/**
 * Delete a conversation
 * @param {string} id - Conversation ID
 */
export async function deleteConversation(id) {
  try {
    await invoke('delete_conversation', { id });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

/**
 * Append a message to conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} role - 'user' | 'assistant' | 'system'
 * @param {string} content - Message content
 */
export async function appendToContext(conversationId, role, content) {
  try {
    await invoke('append_to_context', { conversationId, role, content });
  } catch (error) {
    console.error('Failed to append to context:', error);
  }
}

/**
 * Build optimized context window for AI
 * @param {string} conversationId - Conversation ID
 * @param {number} maxTokens - Maximum tokens in context
 * @returns {string} Formatted context window
 */
export async function getContextWindow(conversationId, maxTokens = 4000) {
  try {
    return await invoke('get_context_window', { conversationId, maxTokens });
  } catch (error) {
    console.error('Failed to get context window:', error);
    return '';
  }
}

/**
 * Clear all messages in a conversation
 * @param {string} conversationId - Conversation ID
 */
export async function clearContext(conversationId) {
  try {
    await invoke('clear_context', { conversationId });
  } catch (error) {
    console.error('Failed to clear context:', error);
  }
}

// ==================== File Operations ====================

export async function readFile(path) {
  try {
    return await invoke('read_file', { path });
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
}

export async function writeFile(path, contents) {
  try {
    await invoke('write_file', { path, contents });
  } catch (error) {
    console.error('Failed to write file:', error);
    throw error;
  }
}

export async function listDirectory(path) {
  try {
    return await invoke('list_directory', { path });
  } catch (error) {
    console.error('Failed to list directory:', error);
    return [];
  }
}

export async function createDirectory(path) {
  try {
    await invoke('create_directory', { path });
  } catch (error) {
    console.error('Failed to create directory:', error);
    throw error;
  }
}

export async function deletePath(path) {
  try {
    await invoke('delete_path', { path });
  } catch (error) {
    console.error('Failed to delete:', error);
    throw error;
  }
}

// ==================== Project Management ====================

export async function saveProject(id, name, data) {
  try {
    await invoke('save_project', { id, name, data });
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
}

export async function loadProject(id) {
  try {
    return await invoke('load_project', { id });
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
}

export async function listProjects() {
  try {
    return await invoke('list_projects');
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}

export async function deleteProject(id) {
  try {
    await invoke('delete_project', { id });
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
}

export async function exportProject(id, exportPath) {
  try {
    await invoke('export_project', { id, exportPath });
  } catch (error) {
    console.error('Failed to export project:', error);
    throw error;
  }
}

export async function importProject(importPath) {
  try {
    return await invoke('import_project', { importPath });
  } catch (error) {
    console.error('Failed to import project:', error);
    throw error;
  }
}

// ==================== Backup Management ====================

export async function createBackup() {
  try {
    const path = await invoke('create_backup');
    console.log('✅ Backup created:', path);
    return path;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

export async function listBackups() {
  try {
    return await invoke('list_backups');
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

export async function restoreBackup(backupPath) {
  try {
    await invoke('restore_backup', { backupPath });
    console.log('✅ Backup restored');
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw error;
  }
}

export async function deleteBackup(backupPath) {
  try {
    await invoke('delete_backup', { backupPath });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    throw error;
  }
}

// ==================== Storage Info ====================

export async function getStorageStats() {
  try {
    return await invoke('get_storage_stats');
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
}

export async function getAppDirectory() {
  try {
    return await invoke('get_app_directory');
  } catch (error) {
    console.error('Failed to get app directory:', error);
    return null;
  }
}

// ==================== Auto-save Settings ====================

export async function setAutosaveInterval(minutes) {
  try {
    await invoke('set_autosave_interval', { minutes });
  } catch (error) {
    console.error('Failed to set autosave interval:', error);
  }
}

export async function getAutosaveStatus() {
  try {
    return await invoke('get_autosave_status');
  } catch (error) {
    console.error('Failed to get autosave status:', error);
    return { enabled: true, interval_minutes: 5, last_save: null };
  }
}

// ==================== Window Management ====================

/**
 * Save current window state to backend
 */
export async function saveWindowState() {
  try {
    const size = await appWindow.innerSize();
    const position = await appWindow.outerPosition();
    const isMaximized = await appWindow.isMaximized();
    
    const state = {
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y,
      maximized: isMaximized,
    };
    
    await saveSession({ windowState: state });
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

/**
 * Restore window state from saved session
 */
export async function restoreWindowState() {
  try {
    const session = await loadSession();
    if (session?.windowState) {
      const { width, height, x, y, maximized } = session.windowState;
      
      await appWindow.setSize(new PhysicalSize(width, height));
      await appWindow.setPosition(new PhysicalPosition(x, y));
      
      if (maximized) {
        await appWindow.maximize();
      }
    }
  } catch (error) {
    console.error('Failed to restore window state:', error);
  }
}

// ==================== Initialization ====================

/**
 * Initialize the Tauri bridge
 * - Restore window state
 * - Load previous session
 * - Setup auto-save listeners
 */
export async function initTauriBridge() {
  console.log('🔧 Initializing Novaura Portable Bridge...');
  
  // Restore window state
  await restoreWindowState();
  
  // Setup window event listeners for auto-save
  appWindow.onResized(() => saveWindowState());
  appWindow.onMoved(() => saveWindowState());
  
  console.log('✅ Tauri bridge initialized');
  
  // Return load session data for the app
  return await loadSession();
}

export default {
  // Session
  saveSession,
  loadSession,
  clearSession,
  autoSaveSession,
  
  // Context/AI
  saveConversation,
  loadConversations,
  getConversationContext,
  deleteConversation,
  appendToContext,
  getContextWindow,
  clearContext,
  
  // Files
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  deletePath,
  
  // Projects
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  exportProject,
  importProject,
  
  // Backups
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  
  // Storage
  getStorageStats,
  getAppDirectory,
  
  // Auto-save
  setAutosaveInterval,
  getAutosaveStatus,
  
  // Window
  saveWindowState,
  restoreWindowState,
  
  // Init
  initTauriBridge,
};
