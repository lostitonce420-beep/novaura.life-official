import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Wand2, BookOpen, Shrink, Brain, Zap, Eye, Scissors,
  MessageSquare, RefreshCw, ArrowDownToLine, Palette, User, Bot,
} from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import axios from 'axios';
import { BACKEND_URL } from '../../../services/aiService';
import { kernelStorage } from '../../../kernel/kernelStorage.js';

const AI_TOOLS = [
  { id: 'describe', label: 'Describe', icon: Eye, color: 'text-green-400',
    prompt: (sel) => `Analyze this word/phrase and generate rich sensory descriptions covering Sight, Smell, Sound, Touch, Taste, and a Metaphor. Be creative and vivid.\n\nText: "${sel}"` },
  { id: 'rewrite', label: 'Rewrite', icon: RefreshCw, color: 'text-blue-400',
    prompt: (sel, inst) => `Rewrite this passage. Instruction: ${inst || 'Show, don\'t tell. Make it more vivid and engaging.'}.\n\nOriginal:\n"${sel}"` },
  { id: 'expand', label: 'Expand', icon: ArrowDownToLine, color: 'text-purple-400',
    prompt: (sel) => `Take this brief summary and expand it into a full, well-paced scene with dialogue, sensory detail, and character interiority:\n\n"${sel}"` },
  { id: 'shrink', label: 'Shrink', icon: Scissors, color: 'text-orange-400',
    prompt: (sel) => `Condense this text into three versions:\n1. A one-paragraph summary\n2. A one-sentence logline\n3. A bullet-point outline\n\nText:\n"${sel}"` },
  { id: 'brainstorm', label: 'Brainstorm', icon: Brain, color: 'text-yellow-400',
    prompt: (sel) => `Based on this context, brainstorm 8-10 creative options. Include unexpected and genre-bending ideas:\n\n"${sel}"` },
  { id: 'twist', label: 'Twist', icon: Zap, color: 'text-red-400',
    prompt: (sel) => `Read this scene and suggest 3 unexpected narrative twists that subvert reader expectations while remaining consistent with the story logic:\n\n"${sel}"` },
];

const PERSONA_PRESETS = [
  { id: 'default', label: 'Default' },
  { id: 'literary', label: 'Literary Fiction' },
  { id: 'fantasy', label: 'High Fantasy' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'horror', label: 'Horror/Dark' },
  { id: 'romance', label: 'Romance' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'humor', label: 'Comedy' },
  { id: 'ya', label: 'Young Adult' },
  { id: 'childrens', label: "Children's" },
];

function getPersonaPrompt(persona) {
  const map = {
    literary: 'You are a literary fiction writing assistant. Favor nuanced prose, subtext, and thematic depth over plot mechanics.',
    fantasy: 'You are a high fantasy writing assistant. Embrace rich worldbuilding, epic scope, and mythological undertones.',
    scifi: 'You are a science fiction writing assistant. Ground ideas in plausible science and explore societal implications.',
    horror: 'You are a horror/dark fiction writing assistant. Build dread, use restraint, and let the reader\'s imagination do the work.',
    romance: 'You are a romance writing assistant. Focus on emotional tension, chemistry, and satisfying character arcs.',
    thriller: 'You are a thriller writing assistant. Maintain relentless pacing, plant clues, and engineer reversals.',
    humor: 'You are a comedic writing assistant. Use timing, irony, and observational wit.',
    ya: 'You are a young adult fiction writing assistant. Authentic teen voice, high stakes, identity themes.',
    childrens: 'You are a children\'s book writing assistant. Simple language, moral lessons, wonder and imagination.',
  };
  return map[persona] || 'You are a creative writing assistant. Be helpful, vivid, and imaginative.';
}

export default function AIWritingPanel({ selectedText = '', storyBible = null, onInsertText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState('default');
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToAI = async (prompt) => {
    setLoading(true);
    const userMsg = { role: 'user', text: prompt, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Build system context from story bible
      let systemCtx = getPersonaPrompt(persona);
      if (storyBible) {
        const chars = storyBible.characters?.map((c) => `${c.name}: ${c.description}`).join('\n') || '';
        const settings = storyBible.settings?.map((s) => `${s.name}: ${s.description}`).join('\n') || '';
        const rules = storyBible.rules?.join('\n') || '';
        if (chars || settings || rules) {
          systemCtx += `\n\n--- STORY BIBLE ---\nCharacters:\n${chars}\n\nSettings:\n${settings}\n\nRules:\n${rules}`;
        }
      }

      const token = kernelStorage.getItem('auth_token');
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: `${systemCtx}\n\n---\n\n${prompt}`,
        maxTokens: 2048,
        temperature: 0.8,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const aiText = res.data.content || 'No response generated.';
      setMessages((prev) => [...prev, { role: 'assistant', text: aiText, ts: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `Error: ${err.response?.data?.error || err.message}`,
        ts: Date.now(),
        isError: true,
      }]);
    }
    setLoading(false);
  };

  const handleToolClick = (tool) => {
    if (!selectedText && tool.id !== 'brainstorm') {
      setMessages((prev) => [...prev, {
        role: 'assistant', text: 'Select some text in the editor first, then use this tool.', ts: Date.now(),
      }]);
      return;
    }
    const prompt = tool.id === 'rewrite'
      ? tool.prompt(selectedText, rewriteInstruction)
      : tool.prompt(selectedText || 'a story idea');
    sendToAI(prompt);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const contextNote = selectedText ? `\n\n[Selected text: "${selectedText.slice(0, 200)}${selectedText.length > 200 ? '...' : ''}"]` : '';
    sendToAI(input + contextNote);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">AI Writing Assistant</span>
        </div>
        {/* Persona selector */}
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="w-full bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
        >
          {PERSONA_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* AI Tools grid */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="grid grid-cols-3 gap-1">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                disabled={loading}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <Icon className={`w-3.5 h-3.5 ${tool.color}`} />
                <span className="text-[9px] text-gray-400">{tool.label}</span>
              </button>
            );
          })}
        </div>
        {/* Rewrite instruction input */}
        <input
          value={rewriteInstruction}
          onChange={(e) => setRewriteInstruction(e.target.value)}
          placeholder="Rewrite instruction (e.g., 'more ominous')"
          className="mt-1.5 w-full bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none placeholder:text-gray-600"
        />
      </div>

      {/* Selected text indicator */}
      {selectedText && (
        <div className="px-3 py-1.5 bg-primary/10 border-b border-primary/20 text-[10px] text-primary truncate">
          Selected: "{selectedText.slice(0, 80)}{selectedText.length > 80 ? '...' : ''}"
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 scrollbar-custom">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6 text-gray-600">
              <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-[11px]">Select text and use tools above,</p>
              <p className="text-[11px]">or type a message below</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={`max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/20 border border-accent/30'
                  : msg.isError
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-[#2a2a4a] border border-[#3a3a5a]'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => onInsertText?.(msg.text)}
                    className="mt-1.5 text-[9px] text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <ArrowDownToLine className="w-2.5 h-2.5" /> Insert into editor
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-accent" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              Writing...
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-[#2a2a4a] flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={loading}
          className="flex-1 bg-[#2a2a4a] text-gray-200 text-[11px] rounded px-2.5 py-1.5 border border-gray-700 outline-none placeholder:text-gray-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-1.5 bg-primary/20 hover:bg-primary/30 rounded text-primary disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
