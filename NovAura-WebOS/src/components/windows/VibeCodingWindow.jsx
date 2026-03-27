import React, { useState, useRef, useEffect } from 'react';
import { Zap, Send, Code, MessageSquare, SplitSquareHorizontal, Play, Copy, Download } from 'lucide-react';

const INITIAL_MESSAGES = [
  { role: 'system', content: "Welcome to Vibe Coding! This is your collaborative AI coding space. Describe what you want to build, and we'll create it together. Code on the left, chat on the right — or switch to split view." }
];

export default function VibeCodingWindow({ onAIChat }) {
  const [code, setCode] = useState('// Start coding here...\n// Or describe what you want in the chat\n');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [view, setView] = useState('split'); // code | chat | split
  const [language, setLanguage] = useState('javascript');
  const [sessionStats, setSessionStats] = useState({ turns: 0, linesWritten: 0 });
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (onAIChat) {
      setMessages(prev => [...prev, { role: 'system', content: 'Thinking...' }]);
      try {
        const prompt = `You are a coding assistant. The user is writing ${language} code. Help them with: ${input.trim()}\n\nCurrent code:\n${code}`;
        const result = await onAIChat(prompt, 'coding');
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: result?.response || 'No response from AI provider.' }]);
      } catch {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'AI provider unavailable. Check Settings > AI Providers.' }]);
      }
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connect an AI provider in Settings > AI Providers to enable chat.' }]);
    }
    setSessionStats(prev => ({ turns: prev.turns + 1, linesWritten: code.split('\n').length }));
  };

  const copyCode = () => navigator.clipboard.writeText(code);
  const downloadCode = () => {
    const ext = { javascript:'.js', typescript:'.ts', python:'.py', csharp:'.cs' }[language] || '.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a'); link.download = `vibe-session${ext}`; link.href = URL.createObjectURL(blob); link.click();
  };

  const CodePanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 bg-black/20 border-b border-slate-800/50 shrink-0 flex items-center gap-2">
        <Code className="w-3 h-3 text-lime-400" />
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="bg-transparent border-none text-[10px] text-slate-400 focus:outline-none">
          {['javascript','typescript','python','csharp','html','css'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-[9px] text-slate-600 ml-auto">{code.split('\n').length} lines</span>
        <button onClick={copyCode} className="p-1 hover:bg-slate-800 rounded text-slate-500"><Copy className="w-3 h-3" /></button>
        <button onClick={downloadCode} className="p-1 hover:bg-slate-800 rounded text-slate-500"><Download className="w-3 h-3" /></button>
      </div>
      <textarea value={code} onChange={e => setCode(e.target.value)}
        className="flex-1 p-3 bg-transparent font-mono text-xs text-lime-200/80 resize-none focus:outline-none leading-relaxed"
        spellCheck={false} />
    </div>
  );

  const ChatPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-cyan-300' : m.role === 'system' ? 'text-slate-500 italic' : 'text-slate-300'}`}>
            {m.role === 'user' && <span className="text-[9px] font-medium text-cyan-400 block mb-0.5">You</span>}
            {m.role === 'assistant' && <span className="text-[9px] font-medium text-purple-400 block mb-0.5">Aura</span>}
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="px-3 py-2 border-t border-slate-800 shrink-0 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Describe what you want to build..."
          className="flex-1 px-3 py-1.5 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-600/50" />
        <button onClick={sendMessage} disabled={!input.trim()}
          className="px-3 bg-lime-600/50 hover:bg-lime-500/50 rounded text-lime-300 disabled:opacity-30">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-lime-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-lime-400" />
          <span className="text-sm font-semibold">Vibe Coding</span>
          <span className="text-[9px] text-slate-500">{sessionStats.turns} turns</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('code')} title="Code only"
            className={`p-1.5 rounded ${view === 'code' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Code className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView('chat')} title="Chat only"
            className={`p-1.5 rounded ${view === 'chat' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:bg-slate-800'}`}>
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView('split')} title="Split view"
            className={`p-1.5 rounded ${view === 'split' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:bg-slate-800'}`}>
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {(view === 'code' || view === 'split') && <CodePanel />}
        {view === 'split' && <div className="w-px bg-slate-800" />}
        {(view === 'chat' || view === 'split') && <ChatPanel />}
      </div>
    </div>
  );
}
