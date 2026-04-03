import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Minimize2, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, isFirebaseConfigured } from '../config/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, limit, deleteDoc, getDocs
} from 'firebase/firestore';
import { chatCloud } from '../services/aiService';

const GREETING = "Hey — I'm Nova. Always here when you need me. Ask me anything or just think out loud.";

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubRef = useRef(null);

  const uid = auth?.currentUser?.uid || null;
  const colPath = uid ? `users/${uid}/chat_history` : null;

  // Wire Firestore listener when user is known
  useEffect(() => {
    if (unsubRef.current) unsubRef.current();

    if (!isFirebaseConfigured || !db || !colPath) {
      // Unauthenticated — show greeting only, no persistence
      setMessages([{ id: 'seed', role: 'assistant', content: GREETING }]);
      return;
    }

    const q = query(
      collection(db, colPath),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    unsubRef.current = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setMessages([{ id: 'seed', role: 'assistant', content: GREETING }]);
        return;
      }
      const loaded = snap.docs.map(d => ({
        id: d.id,
        role: d.data().role,
        content: d.data().content,
      }));
      setMessages(loaded);
    }, () => {
      // Offline or permission error — still show greeting
      setMessages([{ id: 'seed', role: 'assistant', content: GREETING }]);
    });

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [uid, colPath]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const saveMessage = useCallback(async (role, content) => {
    if (!isFirebaseConfigured || !db || !colPath) return;
    try {
      await addDoc(collection(db, colPath), {
        role,
        content,
        createdAt: serverTimestamp(),
      });
    } catch { /* silent — don't break chat */ }
  }, [colPath]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;

    setInput('');
    setIsThinking(true);

    // Optimistic local message (Firestore snapshot will confirm)
    const optimistic = { id: `opt-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev.filter(m => m.id !== 'seed'), optimistic]);
    saveMessage('user', text);

    try {
      const result = await chatCloud(text, {
        provider: 'gemini',
        conversation: messages
          .filter(m => m.id !== 'seed')
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content })),
      });
      const reply = result.response || 'Signal lost. Try again.';
      saveMessage('assistant', reply);
    } catch {
      saveMessage('assistant', 'Neural link interrupted. Check your connection.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = async () => {
    if (!isFirebaseConfigured || !db || !colPath) {
      setMessages([{ id: 'seed', role: 'assistant', content: GREETING }]);
      return;
    }
    try {
      const snap = await getDocs(collection(db, colPath));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch { /* silent */ }
    // Snapshot listener will update messages
  };

  return (
    <>
      {/* Collapsed bubble — anchored bottom-right next to command bar */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 300 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-20 z-[860] w-12 h-12 rounded-full bg-black/80 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center hover:border-cyan-400/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.25)] transition-all group backdrop-blur-sm"
            title="Open Nova Chat"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel — grows upward from bottom-right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="fixed bottom-24 right-4 z-[860] w-[340px] flex flex-col bg-black/90 border border-white/10 rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.8),0_0_1px_rgba(0,240,255,0.08)] overflow-hidden backdrop-blur-xl"
            style={{ maxHeight: 480 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white">Nova</span>
                <span className="text-[9px] text-cyan-400/50 font-mono">● live</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Clear chat history"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  title="Minimize"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-white rounded-tr-none'
                      : 'bg-white/[0.06] border border-white/5 text-white/80 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-cyan-400/60 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Nova is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-white/5 bg-white/[0.03] shrink-0"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={uid ? 'Message Nova...' : 'Sign in to save your chat'}
                  disabled={isThinking}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/40 disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isThinking || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {!uid && (
                <p className="text-[9px] text-white/30 text-center mt-1.5 font-mono">
                  messages not saved · sign in for persistence
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
