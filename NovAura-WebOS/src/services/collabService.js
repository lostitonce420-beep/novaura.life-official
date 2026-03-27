/**
 * NovAura Real-Time Collaboration Service
 *
 * Uses Firestore for:
 *  - Session management (create, join, leave)
 *  - Real-time document sync (file content changes)
 *  - Presence (who's online, cursor positions)
 *  - Chat within sessions
 *
 * Gracefully degrades if Firebase is not configured.
 */

import { db, auth, isFirebaseConfigured } from '../config/firebase';
import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, query, where, orderBy, limit, arrayUnion, arrayRemove,
  writeBatch, deleteField,
} from 'firebase/firestore';

// ── Session Colors for Collaborators ─────────────────────────
const COLLAB_COLORS = [
  '#00f0ff', '#8b5cf6', '#ff006e', '#00ff88', '#f59e0b',
  '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#a78bfa',
];

function getCollabColor(index) {
  return COLLAB_COLORS[index % COLLAB_COLORS.length];
}

// ── Generate session ID ──────────────────────────────────────
function generateSessionId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── Noop service when Firebase is not configured ─────────────
const noopService = {
  createSession: () => Promise.resolve(null),
  joinSession: () => Promise.resolve(null),
  leaveSession: () => Promise.resolve(),
  updateFile: () => Promise.resolve(),
  updateCursor: () => Promise.resolve(),
  sendMessage: () => Promise.resolve(),
  onSessionUpdate: () => () => {},
  onPresenceUpdate: () => () => {},
  onFileUpdate: () => () => {},
  onChatUpdate: () => () => {},
  isAvailable: false,
};

if (!isFirebaseConfigured) {
  console.warn('[Collab] Firebase not configured — collaboration disabled');
}

// ── Collections ──────────────────────────────────────────────
const SESSIONS = 'collab_sessions';
const PRESENCE = 'presence';
const FILES = 'files';
const CHAT = 'chat';

// ── Create a new collaboration session ───────────────────────
export async function createSession(userId, userName, projectName, projectFiles) {
  if (!isFirebaseConfigured) return null;

  const sessionId = generateSessionId();
  const sessionRef = doc(db, SESSIONS, sessionId);

  const session = {
    id: sessionId,
    hostId: userId,
    hostName: userName,
    projectName: projectName || 'Untitled Project',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active', // active | paused | closed
    participants: [userId],
    participantNames: { [userId]: userName },
    maxParticipants: 5,
  };

  await setDoc(sessionRef, session);

  // Write initial files
  const batch = writeBatch(db);
  (projectFiles || []).forEach((file, i) => {
    const fileRef = doc(db, SESSIONS, sessionId, FILES, file.path || file.name || `file-${i}`);
    batch.set(fileRef, {
      path: file.path || file.name,
      content: file.content || '',
      lastEditor: userId,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();

  // Set host presence
  await setDoc(doc(db, SESSIONS, sessionId, PRESENCE, userId), {
    userId,
    userName,
    color: getCollabColor(0),
    cursor: null,
    activeFile: null,
    online: true,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });

  return { sessionId, ...session };
}

// ── Join an existing session ─────────────────────────────────
export async function joinSession(sessionId, userId, userName) {
  if (!isFirebaseConfigured) return null;

  const sessionRef = doc(db, SESSIONS, sessionId);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return null;

  const session = snap.data();
  if (session.status === 'closed') return null;
  if (session.participants?.length >= session.maxParticipants) return null;

  // Add participant
  await updateDoc(sessionRef, {
    participants: arrayUnion(userId),
    [`participantNames.${userId}`]: userName,
    updatedAt: serverTimestamp(),
  });

  // Set presence
  const colorIndex = (session.participants?.length || 0);
  await setDoc(doc(db, SESSIONS, sessionId, PRESENCE, userId), {
    userId,
    userName,
    color: getCollabColor(colorIndex),
    cursor: null,
    activeFile: null,
    online: true,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });

  return { sessionId, ...session };
}

// ── Leave a session ──────────────────────────────────────────
export async function leaveSession(sessionId, userId) {
  if (!isFirebaseConfigured) return;

  const sessionRef = doc(db, SESSIONS, sessionId);

  // Update presence to offline
  await updateDoc(doc(db, SESSIONS, sessionId, PRESENCE, userId), {
    online: false,
    lastSeen: serverTimestamp(),
  });

  // Remove from participants
  await updateDoc(sessionRef, {
    participants: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });

  // If host left, close session
  const snap = await getDoc(sessionRef);
  if (snap.exists() && snap.data().hostId === userId) {
    await updateDoc(sessionRef, { status: 'closed' });
  }
}

// ── Update a file in the session ─────────────────────────────
export async function updateFile(sessionId, filePath, content, userId) {
  if (!isFirebaseConfigured) return;

  const fileRef = doc(db, SESSIONS, sessionId, FILES, filePath);
  await setDoc(fileRef, {
    path: filePath,
    content,
    lastEditor: userId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ── Update cursor position ───────────────────────────────────
export async function updateCursor(sessionId, userId, cursor) {
  if (!isFirebaseConfigured) return;

  // cursor: { file, line, column }
  await updateDoc(doc(db, SESSIONS, sessionId, PRESENCE, userId), {
    cursor,
    activeFile: cursor?.file || null,
    lastSeen: serverTimestamp(),
  });
}

// ── Send a chat message ──────────────────────────────────────
export async function sendMessage(sessionId, userId, userName, text) {
  if (!isFirebaseConfigured) return;

  const msgRef = doc(collection(db, SESSIONS, sessionId, CHAT));
  await setDoc(msgRef, {
    userId,
    userName,
    text,
    createdAt: serverTimestamp(),
  });
}

// ── Real-time listeners ──────────────────────────────────────

/** Watch session metadata changes */
export function onSessionUpdate(sessionId, callback) {
  if (!isFirebaseConfigured) return () => {};

  return onSnapshot(doc(db, SESSIONS, sessionId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

/** Watch all participants' presence */
export function onPresenceUpdate(sessionId, callback) {
  if (!isFirebaseConfigured) return () => {};

  return onSnapshot(
    collection(db, SESSIONS, sessionId, PRESENCE),
    (snap) => {
      const participants = [];
      snap.forEach(d => participants.push({ id: d.id, ...d.data() }));
      callback(participants);
    }
  );
}

/** Watch a specific file for changes */
export function onFileUpdate(sessionId, filePath, callback) {
  if (!isFirebaseConfigured) return () => {};

  return onSnapshot(
    doc(db, SESSIONS, sessionId, FILES, filePath),
    (snap) => {
      if (snap.exists()) callback({ path: snap.id, ...snap.data() });
    }
  );
}

/** Watch all file changes in session */
export function onAllFilesUpdate(sessionId, callback) {
  if (!isFirebaseConfigured) return () => {};

  return onSnapshot(
    collection(db, SESSIONS, sessionId, FILES),
    (snap) => {
      const files = [];
      snap.forEach(d => files.push({ path: d.id, ...d.data() }));
      callback(files);
    }
  );
}

/** Watch chat messages */
export function onChatUpdate(sessionId, callback) {
  if (!isFirebaseConfigured) return () => {};

  return onSnapshot(
    query(
      collection(db, SESSIONS, sessionId, CHAT),
      orderBy('createdAt', 'asc'),
      limit(100)
    ),
    (snap) => {
      const messages = [];
      snap.forEach(d => messages.push({ id: d.id, ...d.data() }));
      callback(messages);
    }
  );
}

// ── Heartbeat — keep presence alive ──────────────────────────
let heartbeatInterval = null;

export function startHeartbeat(sessionId, userId) {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (isFirebaseConfigured) {
      updateDoc(doc(db, SESSIONS, sessionId, PRESENCE, userId), {
        lastSeen: serverTimestamp(),
        online: true,
      }).catch(() => {});
    }
  }, 30000); // every 30s
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ── Export availability check ────────────────────────────────
export const isCollabAvailable = isFirebaseConfigured;
export { getCollabColor, generateSessionId };
