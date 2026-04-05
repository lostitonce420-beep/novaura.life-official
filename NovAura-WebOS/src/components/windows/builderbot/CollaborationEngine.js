/**
 * CollaborationEngine - Real-time collaboration for Cybeni IDE
 * 
 * Features:
 * - Multiple cursors
 * - Real-time sync
 * - Presence indicators
 * - Follow mode
 * - Voice chat (WebRTC)
 */

export const PRESENCE_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  TYPING: 'typing',
  IDLE: 'idle'
};

export class CollaborationEngine {
  constructor(options = {}) {
    this.userId = options.userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.userName = options.userName || 'Anonymous';
    this.userColor = options.userColor || this.generateUserColor();
    this.sessionId = options.sessionId || null;
    
    this.participants = new Map();
    this.cursorPositions = new Map();
    this.selections = new Map();
    
    this.websocket = null;
    this.rtcConnections = new Map();
    this.dataChannels = new Map();
    
    this.callbacks = {
      onParticipantJoin: null,
      onParticipantLeave: null,
      onCursorMove: null,
      onSelectionChange: null,
      onContentChange: null,
      onVoiceStream: null
    };

    this.isConnected = false;
  }

  /**
   * Generate consistent color for user
   */
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Connection Management
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Connect to collaboration session
   */
  async connect(sessionId, wsUrl = 'wss://collab.cybeni.dev') {
    this.sessionId = sessionId;
    
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(`${wsUrl}?session=${sessionId}&user=${this.userId}`);
        
        this.websocket.onopen = () => {
          this.isConnected = true;
          this.send({
            type: 'join',
            userId: this.userId,
            userName: this.userName,
            userColor: this.userColor
          });
          resolve({ success: true });
        };

        this.websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };

        this.websocket.onclose = () => {
          this.isConnected = false;
          this.cleanup();
        };

        this.websocket.onerror = (err) => {
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from session
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.rtcConnections.forEach(conn => conn.close());
    this.rtcConnections.clear();
    this.dataChannels.clear();
    this.participants.clear();
    this.isConnected = false;
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'participant-joined':
        this.handleParticipantJoined(message);
        break;
      case 'participant-left':
        this.handleParticipantLeft(message);
        break;
      case 'cursor-move':
        this.handleCursorMove(message);
        break;
      case 'selection-change':
        this.handleSelectionChange(message);
        break;
      case 'content-change':
        this.handleContentChange(message);
        break;
      case 'presence-update':
        this.handlePresenceUpdate(message);
        break;
      case 'webrtc-offer':
        this.handleWebRTCOffer(message);
        break;
      case 'webrtc-answer':
        this.handleWebRTCAnswer(message);
        break;
      case 'webrtc-ice':
        this.handleWebRTCIce(message);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Participant Management
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Handle participant joining
   */
  handleParticipantJoined(message) {
    const { userId, userName, userColor } = message;
    
    this.participants.set(userId, {
      userId,
      userName,
      userColor,
      status: PRESENCE_STATUS.ONLINE,
      lastSeen: Date.now()
    });

    if (this.callbacks.onParticipantJoin) {
      this.callbacks.onParticipantJoin({ userId, userName, userColor });
    }
  }

  /**
   * Handle participant leaving
   */
  handleParticipantLeft(message) {
    const { userId } = message;
    const participant = this.participants.get(userId);
    
    this.participants.delete(userId);
    this.cursorPositions.delete(userId);
    this.selections.delete(userId);

    if (this.callbacks.onParticipantLeave && participant) {
      this.callbacks.onParticipantLeave(participant);
    }
  }

  /**
   * Get all participants
   */
  getParticipants() {
    return Array.from(this.participants.values());
  }

  /**
   * Get participant by ID
   */
  getParticipant(userId) {
    return this.participants.get(userId);
  }

  /**
   * Update presence status
   */
  updatePresence(status) {
    this.send({
      type: 'presence-update',
      userId: this.userId,
      status
    });
  }

  /**
   * Handle presence update
   */
  handlePresenceUpdate(message) {
    const { userId, status } = message;
    const participant = this.participants.get(userId);
    if (participant) {
      participant.status = status;
      participant.lastSeen = Date.now();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Cursor & Selection Sync
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Send cursor position
   */
  sendCursorPosition(filePath, line, column) {
    this.send({
      type: 'cursor-move',
      userId: this.userId,
      filePath,
      line,
      column,
      timestamp: Date.now()
    });
  }

  /**
   * Handle cursor move from other user
   */
  handleCursorMove(message) {
    const { userId, filePath, line, column } = message;
    
    this.cursorPositions.set(userId, {
      filePath,
      line,
      column,
      timestamp: Date.now()
    });

    if (this.callbacks.onCursorMove) {
      this.callbacks.onCursorMove({ userId, filePath, line, column });
    }
  }

  /**
   * Get cursor position for user
   */
  getCursorPosition(userId) {
    return this.cursorPositions.get(userId);
  }

  /**
   * Send selection change
   */
  sendSelection(filePath, startLine, startColumn, endLine, endColumn) {
    this.send({
      type: 'selection-change',
      userId: this.userId,
      filePath,
      selection: {
        startLine,
        startColumn,
        endLine,
        endColumn
      },
      timestamp: Date.now()
    });
  }

  /**
   * Handle selection change from other user
   */
  handleSelectionChange(message) {
    const { userId, filePath, selection } = message;
    
    this.selections.set(userId, {
      filePath,
      selection,
      timestamp: Date.now()
    });

    if (this.callbacks.onSelectionChange) {
      this.callbacks.onSelectionChange({ userId, filePath, selection });
    }
  }

  /**
   * Get selection for user
   */
  getSelection(userId) {
    return this.selections.get(userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Content Sync (CRDT-based)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Send content change
   */
  sendContentChange(filePath, changes) {
    // Convert changes to CRDT operations
    const operations = changes.map(change => ({
      type: change.text ? 'insert' : 'delete',
      position: change.rangeOffset,
      text: change.text,
      length: change.rangeLength,
      timestamp: Date.now(),
      userId: this.userId
    }));

    this.send({
      type: 'content-change',
      userId: this.userId,
      filePath,
      operations
    });
  }

  /**
   * Handle content change from other user
   */
  handleContentChange(message) {
    if (this.callbacks.onContentChange) {
      this.callbacks.onContentChange(message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Voice Chat (WebRTC)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Initialize voice chat
   */
  async initVoiceChat() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create peer connections for each participant
      this.participants.forEach((participant, userId) => {
        if (userId !== this.userId) {
          this.createPeerConnection(userId, stream);
        }
      });

      return { success: true, stream };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Create WebRTC peer connection
   */
  createPeerConnection(userId, localStream) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // Add local stream
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (this.callbacks.onVoiceStream) {
        this.callbacks.onVoiceStream({ userId, stream: event.streams[0] });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'webrtc-ice',
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    this.rtcConnections.set(userId, pc);
    return pc;
  }

  /**
   * Create and send offer
   */
  async createOffer(userId) {
    const pc = this.rtcConnections.get(userId);
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.send({
      type: 'webrtc-offer',
      targetUserId: userId,
      offer
    });
  }

  /**
   * Handle WebRTC offer
   */
  async handleWebRTCOffer(message) {
    const { userId, offer } = message;
    
    // Get local stream first
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const pc = this.createPeerConnection(userId, stream);

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.send({
      type: 'webrtc-answer',
      targetUserId: userId,
      answer
    });
  }

  /**
   * Handle WebRTC answer
   */
  async handleWebRTCAnswer(message) {
    const { userId, answer } = message;
    const pc = this.rtcConnections.get(userId);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }

  /**
   * Handle WebRTC ICE candidate
   */
  async handleWebRTCIce(message) {
    const { userId, candidate } = message;
    const pc = this.rtcConnections.get(userId);
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Event Callbacks
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Set event callbacks
   */
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  /**
   * Remove event callback
   */
  off(event) {
    this.callbacks[event] = null;
  }
}

export default CollaborationEngine;
