import React, { useState, useRef, useEffect } from 'react';
import {
  Users, Link2, Copy, Check, X, MessageSquare, Send,
  Wifi, WifiOff, Crown, Circle,
} from 'lucide-react';

// ── Presence Avatars ─────────────────────────────────────────
function PresenceBar({ participants, isHost, sessionId }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(sessionId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
      {/* Participant dots */}
      <div className="flex items-center -space-x-1.5">
        {participants.map((p, i) => (
          <div
            key={p.userId || i}
            className="relative group"
          >
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-black"
              style={{
                backgroundColor: p.color || '#00f0ff',
                borderColor: '#12121e',
              }}
              title={p.userName}
            >
              {p.userName?.[0]?.toUpperCase() || '?'}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/90 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {p.userName}
              {p.activeFile && <span className="text-gray-600 ml-1">in {p.activeFile}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Count */}
      <span className="text-[9px] text-gray-500">{participants.length}</span>

      {/* Divider */}
      <div className="w-px h-4 bg-white/10" />

      {/* Copy session ID */}
      {sessionId && (
        <button
          onClick={copyLink}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-gray-400 hover:text-primary hover:bg-white/5 transition-colors"
          title="Copy session code"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : sessionId}
        </button>
      )}

      {isHost && (
        <Crown className="w-3 h-3 text-amber-400" title="You are the host" />
      )}
    </div>
  );
}

// ── Remote Cursor Overlay ────────────────────────────────────
export function RemoteCursors({ participants, currentUserId, lineHeight = 18, charWidth = 7.2 }) {
  const remotePeople = participants.filter(p => p.userId !== currentUserId && p.cursor && p.online);

  return (
    <>
      {remotePeople.map(p => (
        <div
          key={p.userId}
          className="absolute pointer-events-none z-50 transition-all duration-150"
          style={{
            top: `${(p.cursor.line || 0) * lineHeight}px`,
            left: `${(p.cursor.column || 0) * charWidth}px`,
          }}
        >
          {/* Cursor line */}
          <div
            className="w-0.5 animate-pulse"
            style={{
              height: `${lineHeight}px`,
              backgroundColor: p.color,
            }}
          />
          {/* Name tag */}
          <div
            className="absolute -top-4 left-0 px-1 py-0.5 rounded text-[8px] font-medium text-black whitespace-nowrap"
            style={{ backgroundColor: p.color }}
          >
            {p.userName}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Session Chat ─────────────────────────────────────────────
function SessionChat({ messages, onSend, participants }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const getColor = (userId) => {
    const p = participants.find(p => p.userId === userId);
    return p?.color || '#888';
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={m.id || i} className="text-[10px]">
            <span className="font-medium" style={{ color: getColor(m.userId) }}>
              {m.userName}
            </span>
            <span className="text-gray-400 ml-1">{m.text}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-[9px] text-gray-600 text-center py-2">No messages yet</p>
        )}
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-white/10">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-primary/40"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Join Modal ───────────────────────────────────────────────
export function JoinSessionModal({ onJoin, onClose }) {
  const [code, setCode] = useState('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-200">Join Session</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-gray-500 mb-3">
          Enter the session code shared by your collaborator.
        </p>

        <input
          value={code}
          onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
          placeholder="Enter session code..."
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/40 tracking-wider text-center font-mono"
          maxLength={8}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && code.length >= 6 && onJoin(code)}
        />

        <button
          onClick={() => onJoin(code)}
          disabled={code.length < 6}
          className="w-full mt-3 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-medium transition-colors"
        >
          Join
        </button>
      </div>
    </div>
  );
}

// ── Main Collab Panel (sidebar in IDE) ───────────────────────
export default function CollabOverlay({
  collab, // useCollabSession return value
  userId,
  onCreateSession,
}) {
  const [showChat, setShowChat] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  if (!collab.available) {
    return (
      <div className="px-3 py-4 text-center">
        <WifiOff className="w-6 h-6 text-gray-600 mx-auto mb-2" />
        <p className="text-[10px] text-gray-500">Real-time collaboration requires Firebase configuration.</p>
      </div>
    );
  }

  // Not in a session
  if (!collab.connected) {
    return (
      <div className="px-3 py-4 space-y-3">
        <div className="text-center">
          <Users className="w-8 h-8 text-primary/30 mx-auto mb-2" />
          <p className="text-[11px] text-gray-400 font-medium">Real-time Collaboration</p>
          <p className="text-[9px] text-gray-600 mt-1">Code together live with shared cursors and chat.</p>
        </div>

        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-[11px] font-medium transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" /> Start Session
        </button>

        <button
          onClick={() => setShowJoin(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-[11px] transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Join Session
        </button>

        {collab.error && (
          <p className="text-[9px] text-red-400 text-center">{collab.error}</p>
        )}

        {showJoin && (
          <JoinSessionModal
            onJoin={async (code) => {
              const success = await collab.join(code);
              if (success) setShowJoin(false);
            }}
            onClose={() => setShowJoin(false)}
          />
        )}
      </div>
    );
  }

  // In a session
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <PresenceBar
          participants={collab.participants}
          isHost={collab.isHost}
          sessionId={collab.sessionId}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setShowChat(false)}
          className={`flex-1 py-1.5 text-[10px] border-b-2 transition-colors ${
            !showChat ? 'text-primary border-primary' : 'text-gray-500 border-transparent'
          }`}
        >
          <Users className="w-3 h-3 inline mr-1" /> People
        </button>
        <button
          onClick={() => setShowChat(true)}
          className={`flex-1 py-1.5 text-[10px] border-b-2 transition-colors ${
            showChat ? 'text-primary border-primary' : 'text-gray-500 border-transparent'
          }`}
        >
          <MessageSquare className="w-3 h-3 inline mr-1" /> Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showChat ? (
          <SessionChat
            messages={collab.chatMessages}
            onSend={collab.chat}
            participants={collab.participants}
          />
        ) : (
          <div className="px-3 py-2 space-y-1.5">
            {collab.participants.map(p => (
              <div key={p.userId} className="flex items-center gap-2 py-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                  style={{ backgroundColor: p.color }}
                >
                  {p.userName?.[0]?.toUpperCase()}
                </div>
                <span className="text-[11px] text-gray-300 flex-1">{p.userName}</span>
                {p.userId === collab.session?.hostId && (
                  <Crown className="w-3 h-3 text-amber-400" />
                )}
                <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                {p.activeFile && (
                  <span className="text-[8px] text-gray-600 truncate max-w-[80px]">{p.activeFile}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave button */}
      <div className="px-3 py-2 border-t border-white/10">
        <button
          onClick={collab.leave}
          className="w-full px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] transition-colors"
        >
          {collab.isHost ? 'End Session' : 'Leave Session'}
        </button>
      </div>
    </div>
  );
}
