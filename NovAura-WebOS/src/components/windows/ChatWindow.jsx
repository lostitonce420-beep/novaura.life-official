import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, Code, Wand2,
  Gamepad2, MessageCircle, ChevronDown, Copy,
  Check, Cpu, Terminal, ScrollText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { db, auth, isFirebaseConfigured } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const MODES = [
  { id: 'general', label: 'General', icon: MessageCircle, color: 'blue', desc: 'Chat about anything' },
  { id: 'coding', label: 'Code', icon: Code, color: 'emerald', desc: 'Programming help' },
  { id: 'gamedev', label: 'Game Dev', icon: Gamepad2, color: 'purple', desc: 'Unity, Unreal, Godot' },
  { id: 'creative', label: 'Creative', icon: Wand2, color: 'pink', desc: 'Writing, art, ideas' },
];

const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'csharp', label: 'C#', ext: 'cs' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'gdscript', label: 'GDScript', ext: 'gd' },
];

// Simple markdown/code parser
const parseContent = (content) => {
  const lines = content.split('\n');
  const elements = [];
  let currentCode = [];
  let codeLang = '';
  let inCode = false;
  
  lines.forEach((line, idx) => {
    const codeMatch = line.match(/^```(\w*)/);
    
    if (codeMatch) {
      if (inCode) {
        // End code block
        elements.push(
          <CodeBlock key={idx} lang={codeLang} code={currentCode.join('\n')} />
        );
        currentCode = [];
        codeLang = '';
        inCode = false;
      } else {
        // Start code block
        codeLang = codeMatch[1] || 'text';
        inCode = true;
      }
    } else if (inCode) {
      currentCode.push(line);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-primary">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-xl font-bold mt-4 mb-2 text-primary">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold mt-4 mb-2 text-primary">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={idx} className="ml-4 text-sm">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\./)) {
      elements.push(<li key={idx} className="ml-4 text-sm list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="h-2" />);
    } else {
      elements.push(<p key={idx} className="text-sm leading-relaxed">{line}</p>);
    }
  });
  
  return elements;
};

const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-primary/20 bg-black/40">
      <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
        <span className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
          <Terminal className="w-3 h-3" />
          {lang}
        </span>
        <button 
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs font-mono text-emerald-300">{code}</code>
      </pre>
    </div>
  );
};

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: '👋 **Welcome to Nova Chat!**\n\nI can help you with:\n- 💻 **Coding** in any language (JS, Python, C++, C#, Rust...)\n- 🎮 **Game Development** (Unity, Unreal, Godot)\n- 🎨 **Creative projects** and brainstorming\n- 🔧 **Debugging** and problem solving\n\nSelect a mode below to get started!',
    timestamp: new Date(),
  },
];

export default function ChatWindow({ onAIChat }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState('general');
  const [showModes, setShowModes] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');
  const scrollRef = useRef(null);

  // Get current user UID from Firebase Auth (single source of truth)
  const uid = auth?.currentUser?.uid || null;

  // Load persisted messages from Firestore on mount
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) return;
    const q = query(
      collection(db, 'chat_messages'),
      where('uid', '==', uid),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      const loaded = snap.docs.map(d => ({
        id: d.id,
        role: d.data().role,
        content: d.data().content,
        timestamp: d.data().createdAt?.toDate?.() || new Date(),
      }));
      setMessages([initialMessages[0], ...loaded]);
    }, () => { /* silent fail — offline or permissions */ });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save a message to Firestore
  const saveMessage = async (role, content) => {
    if (!isFirebaseConfigured || !db || !uid) return;
    try {
      await addDoc(collection(db, 'chat_messages'), {
        uid,
        role,
        content,
        createdAt: serverTimestamp(),
      });
    } catch { /* silent — don't break chat if save fails */ }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !onAIChat) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    saveMessage('user', input);
    setInput('');
    setIsTyping(true);

    try {
      let enhancedPrompt = input;
      if (mode === 'coding') {
        enhancedPrompt = `[${codeLang.toUpperCase()}] ${input}\n\nProvide clean, well-commented code with explanations.`;
      } else if (mode === 'gamedev') {
        enhancedPrompt = `[GAME DEV] ${input}\n\nFocus on game development best practices, performance, and engine-specific considerations.`;
      }

      const result = await onAIChat(enhancedPrompt, mode === 'general' ? 'conversations' : mode);

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result?.response || 'Sorry, I could not process that request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      saveMessage('assistant', aiMessage.content);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '❌ Error: Unable to connect to AI service. Please check your AI provider settings in Profile > AI Providers.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentMode = MODES.find(m => m.id === mode);
  const ModeIcon = currentMode?.icon || MessageCircle;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-window-header/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Nova AI</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-${currentMode.color}-500`} />
              {currentMode.label} Mode
            </p>
          </div>
        </div>
        
        {/* Mode Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowModes(!showModes)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs transition-colors"
          >
            <ModeIcon className="w-3.5 h-3.5" />
            <span>{currentMode.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showModes ? 'rotate-180' : ''}`} />
          </button>
          
          {showModes && (
            <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-lg bg-popover border border-border shadow-xl z-50">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setShowModes(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${mode === m.id ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Language selector for coding mode */}
      {mode === 'coding' && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5 overflow-x-auto">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          {CODE_LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setCodeLang(lang.id)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                codeLang === lang.id 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 scrollbar-custom">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className={`w-8 h-8 shadow-lg ${
                message.role === 'user' 
                  ? 'bg-accent shadow-accent/20' 
                  : 'bg-gradient-to-br from-primary to-secondary shadow-primary/20'
              }`}>
                <AvatarFallback>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-accent/20 border border-accent/30 text-foreground'
                    : 'bg-primary/5 border border-primary/20 text-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {parseContent(message.content)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-2 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-secondary">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-primary/10 bg-window-header/50 backdrop-blur">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'coding' 
                ? `Ask for ${codeLang} code...` 
                : mode === 'gamedev'
                ? 'Ask about Unity, Unreal, Godot...'
                : 'Ask AI anything...'}
              className="w-full bg-background/50 border-primary/20 focus-visible:ring-primary/50 pr-10"
            />
            <ScrollText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isTyping}
            className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,255,0.3)] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground/60">
          <span>Supports markdown & code blocks</span>
          <span>{mode === 'coding' && codeLang.toUpperCase()}</span>
        </div>
      </form>
    </div>
  );
}
