import React, { useState, useRef, useEffect } from 'react';
import { Users, BookOpen, Sparkles, Send, Clock, Trophy, Plus, ArrowLeft, Zap, Upload } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const VIBES = [
  { id: 'peaceful', label: 'Peaceful', icon: '🌿', color: 'bg-green-900/30 border-green-800/30' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', color: 'bg-yellow-900/30 border-yellow-800/30' },
  { id: 'dark', label: 'Dark', icon: '🌑', color: 'bg-slate-900/50 border-slate-700/30' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: 'bg-purple-900/30 border-purple-800/30' },
  { id: 'humorous', label: 'Humorous', icon: '😄', color: 'bg-amber-900/30 border-amber-800/30' },
  { id: 'romantic', label: 'Romantic', icon: '💕', color: 'bg-pink-900/30 border-pink-800/30' },
];

const PROMPTS = [
  "The last message on Earth was written in code...",
  "She opened the door to find a version of herself standing there...",
  "In the year 3077, memories were currency...",
  "The AI whispered something no one expected...",
  "Deep beneath the neon city, an old library still held real books...",
  "They said the anomaly appeared at exactly midnight...",
  "When the music stopped, everyone froze — except one person...",
  "The map led to a place that shouldn't exist...",
];

export default function CollaborativeWritingWindow() {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('writing_sessions') || '[]'); } catch { return []; }
  });
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState('');
  const [vibe, setVibe] = useState('creative');
  const [sessionName, setSessionName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const contentRef = useRef(null);

  const saveSessions = (updated) => {
    setSessions(updated);
    kernelStorage.setItem('writing_sessions', JSON.stringify(updated));
  };

  const createSession = () => {
    if (!sessionName.trim()) return;
    const session = {
      id: `session-${Date.now()}`,
      name: sessionName,
      vibe,
      prompt: prompt || PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
      contributions: [],
      wordCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...sessions, session];
    saveSessions(updated);
    setActiveSession(session);
    setShowCreate(false);
    setSessionName('');
    setPrompt('');
  };

  const contribute = () => {
    if (!input.trim() || !activeSession) return;
    const contribution = {
      id: `c-${Date.now()}`,
      text: input.trim(),
      author: 'You',
      timestamp: new Date().toISOString(),
      wordCount: input.trim().split(/\s+/).length,
    };
    const updated = sessions.map(s => {
      if (s.id !== activeSession.id) return s;
      const contributions = [...s.contributions, contribution];
      return { ...s, contributions, wordCount: contributions.reduce((sum, c) => sum + c.wordCount, 0) };
    });
    saveSessions(updated);
    setActiveSession(updated.find(s => s.id === activeSession.id));
    setInput('');
  };

  const exportToLibrary = () => {
    if (!activeSession || activeSession.contributions.length === 0) return;
    const fullText = activeSession.contributions.map(c => c.text).join('\n\n');
    const doc = {
      id: `doc-${Date.now()}`,
      title: activeSession.name,
      content: fullText,
      format: 'text',
      wordCount: activeSession.wordCount,
      createdAt: activeSession.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const library = JSON.parse(kernelStorage.getItem('writing_library') || '[]');
    library.unshift(doc);
    kernelStorage.setItem('writing_library', JSON.stringify(library));
  };

  const randomPrompt = () => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [activeSession?.contributions?.length]);

  // Active session view
  if (activeSession) {
    const vibeData = VIBES.find(v => v.id === activeSession.vibe) || VIBES[3];
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className={`flex items-center gap-2 px-4 py-2 ${vibeData.color} border-b border-slate-800 shrink-0`}>
          <button onClick={() => setActiveSession(null)} className="p-1 hover:bg-slate-800/50 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <span>{vibeData.icon}</span>
          <span className="text-sm font-semibold truncate">{activeSession.name}</span>
          <button onClick={exportToLibrary} title="Export to Writing Library" className="ml-auto p-1 hover:bg-slate-800/50 rounded text-slate-400 hover:text-emerald-400"><Upload className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] text-slate-400">{activeSession.wordCount} words</span>
        </div>

        {/* Prompt banner */}
        <div className="px-4 py-2 bg-indigo-900/20 border-b border-indigo-800/20 shrink-0">
          <div className="text-[9px] text-indigo-400 uppercase mb-0.5">Prompt</div>
          <div className="text-xs text-indigo-200 italic">"{activeSession.prompt}"</div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeSession.contributions.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">Start writing your story below...</div>
          )}
          {activeSession.contributions.map(c => (
            <div key={c.id} className="group">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-medium text-cyan-400">{c.author}</span>
                <span className="text-[9px] text-slate-600">{new Date(c.timestamp).toLocaleTimeString()}</span>
                <span className="text-[9px] text-slate-600">{c.wordCount}w</span>
              </div>
              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{c.text}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-800 shrink-0">
          <div className="flex gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); contribute(); }}}
              placeholder="Continue the story... (Enter to submit, Shift+Enter for new line)"
              className="flex-1 px-3 py-2 bg-black/30 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-600/50"
              rows={2} />
            <button onClick={contribute} disabled={!input.trim()}
              className="px-3 bg-cyan-600/50 hover:bg-cyan-500/50 rounded-lg text-cyan-300 disabled:opacity-30 self-end">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create session view
  if (showCreate) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Plus className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">New Session</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">SESSION NAME</label>
            <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="My Story..."
              className="w-full px-3 py-2 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600/50" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">VIBE</label>
            <div className="grid grid-cols-3 gap-1.5">
              {VIBES.map(v => (
                <button key={v.id} onClick={() => setVibe(v.id)}
                  className={`p-2 rounded border text-center transition-all ${vibe === v.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-800 bg-slate-900/30 hover:border-slate-600'}`}>
                  <span className="text-lg block">{v.icon}</span>
                  <span className="text-[10px]">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500">WRITING PROMPT (optional)</label>
              <button onClick={randomPrompt} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"><Zap className="w-3 h-3" /> Random</button>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter a writing prompt or click Random..."
              className="w-full px-3 py-2 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-600/50" rows={3} />
          </div>
          <button onClick={createSession} disabled={!sessionName.trim()}
            className="w-full py-2.5 bg-cyan-600/50 hover:bg-cyan-500/50 border border-cyan-700 rounded-lg text-xs text-cyan-200 font-medium disabled:opacity-30">
            Create Session
          </button>
        </div>
      </div>
    );
  }

  // Session list
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Collaborative Writing</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="p-1.5 bg-cyan-600/40 hover:bg-cyan-500/40 rounded text-cyan-300"><Plus className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-500 mb-3">No writing sessions yet</div>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-cyan-600/40 hover:bg-cyan-500/40 rounded-lg text-xs text-cyan-300">
              Start Writing
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice().reverse().map(s => {
              const vibeData = VIBES.find(v => v.id === s.vibe) || VIBES[3];
              return (
                <button key={s.id} onClick={() => setActiveSession(s)}
                  className={`w-full text-left p-3 rounded-lg ${vibeData.color} border hover:border-slate-600 transition-all`}>
                  <div className="flex items-center gap-2">
                    <span>{vibeData.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{s.name}</div>
                      <div className="text-[9px] text-slate-400">{s.contributions.length} contributions · {s.wordCount} words</div>
                    </div>
                    <span className="text-[9px] text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
