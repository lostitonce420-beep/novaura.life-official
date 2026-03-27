import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createSession, joinSession, leaveSession,
  updateFile, updateCursor, sendMessage,
  onSessionUpdate, onPresenceUpdate, onAllFilesUpdate, onChatUpdate,
  startHeartbeat, stopHeartbeat, isCollabAvailable,
} from '../services/collabService';

/**
 * React hook for real-time collaboration sessions.
 *
 * Usage:
 *   const collab = useCollabSession(userId, userName);
 *   collab.create(projectName, files);   // host creates
 *   collab.join(sessionId);              // guest joins
 *   collab.editFile(path, content);      // sync file edit
 *   collab.moveCursor({ file, line, column }); // sync cursor
 */
export default function useCollabSession(userId, userName) {
  const [sessionId, setSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const unsubsRef = useRef([]);

  // ── Cleanup all listeners ──────────────────────────────────
  const cleanup = useCallback(() => {
    unsubsRef.current.forEach(unsub => unsub());
    unsubsRef.current = [];
    stopHeartbeat();
  }, []);

  // ── Subscribe to session data ──────────────────────────────
  const subscribe = useCallback((sid) => {
    cleanup();

    const unsubs = [];

    // Session metadata
    unsubs.push(onSessionUpdate(sid, (data) => {
      setSession(data);
      if (data.status === 'closed') {
        setError('Session closed by host');
        setConnected(false);
      }
    }));

    // Presence
    unsubs.push(onPresenceUpdate(sid, (people) => {
      setParticipants(people.filter(p => p.online));
    }));

    // Files
    unsubs.push(onAllFilesUpdate(sid, (files) => {
      setRemoteFiles(files);
    }));

    // Chat
    unsubs.push(onChatUpdate(sid, (msgs) => {
      setChatMessages(msgs);
    }));

    unsubsRef.current = unsubs;
    startHeartbeat(sid, userId);
    setConnected(true);
  }, [userId, cleanup]);

  // ── Create a session ───────────────────────────────────────
  const create = useCallback(async (projectName, projectFiles) => {
    if (!isCollabAvailable) {
      setError('Real-time collaboration requires Firebase. Configure VITE_FIREBASE_* env vars.');
      return null;
    }

    try {
      setError(null);
      const result = await createSession(userId, userName, projectName, projectFiles);
      if (result) {
        setSessionId(result.sessionId);
        setIsHost(true);
        subscribe(result.sessionId);
        return result.sessionId;
      }
    } catch (err) {
      setError(err.message);
    }
    return null;
  }, [userId, userName, subscribe]);

  // ── Join a session ─────────────────────────────────────────
  const join = useCallback(async (sid) => {
    if (!isCollabAvailable) {
      setError('Real-time collaboration requires Firebase.');
      return false;
    }

    try {
      setError(null);
      const result = await joinSession(sid, userId, userName);
      if (result) {
        setSessionId(sid);
        setIsHost(false);
        subscribe(sid);
        return true;
      } else {
        setError('Session not found, full, or closed.');
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [userId, userName, subscribe]);

  // ── Leave session ──────────────────────────────────────────
  const leave = useCallback(async () => {
    if (sessionId && userId) {
      await leaveSession(sessionId, userId);
    }
    cleanup();
    setSessionId(null);
    setSession(null);
    setParticipants([]);
    setRemoteFiles([]);
    setChatMessages([]);
    setIsHost(false);
    setConnected(false);
    setError(null);
  }, [sessionId, userId, cleanup]);

  // ── Edit a file (debounced externally) ─────────────────────
  const editFile = useCallback(async (filePath, content) => {
    if (sessionId && userId) {
      await updateFile(sessionId, filePath, content, userId);
    }
  }, [sessionId, userId]);

  // ── Move cursor ────────────────────────────────────────────
  const moveCursor = useCallback(async (cursor) => {
    if (sessionId && userId) {
      await updateCursor(sessionId, userId, cursor);
    }
  }, [sessionId, userId]);

  // ── Send chat ──────────────────────────────────────────────
  const chat = useCallback(async (text) => {
    if (sessionId && userId) {
      await sendMessage(sessionId, userId, userName, text);
    }
  }, [sessionId, userId, userName]);

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (sessionId && userId) {
        leaveSession(sessionId, userId).catch(() => {});
      }
      cleanup();
    };
  }, [sessionId, userId, cleanup]);

  return {
    // State
    sessionId,
    session,
    participants,
    remoteFiles,
    chatMessages,
    isHost,
    connected,
    error,
    available: isCollabAvailable,

    // Actions
    create,
    join,
    leave,
    editFile,
    moveCursor,
    chat,
  };
}
