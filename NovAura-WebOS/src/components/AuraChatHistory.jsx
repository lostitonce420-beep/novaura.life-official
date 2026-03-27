import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Bookmark, Play, Trash2, Search, 
  Tag, Zap, Clock, Star, Copy, Check, Sparkles,
  ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { toast } from 'sonner';

// ── Prompt Power Calculator ─────────────────────────────────────────────────
function calculatePromptPower(prompt, usageCount = 0) {
  let power = 0;
  let depth = 0;
  
  // Length factor (detailed prompts = more power)
  if (prompt.length > 200) power += 2;
  else if (prompt.length > 100) power += 1;
  
  // Specificity markers
  const specificityMarkers = [
    'with', 'using', 'include', 'add', 'create', 'build', 'generate',
    'react', 'vue', 'angular', 'tailwind', 'typescript', 'api',
    'component', 'function', 'class', 'hook', 'style', 'layout'
  ];
  const specificityCount = specificityMarkers.reduce((acc, marker) => 
    prompt.toLowerCase().includes(marker) ? acc + 1 : acc, 0
  );
  power += Math.min(specificityCount, 5);
  
  // Context depth markers
  const depthMarkers = [
    'because', 'since', 'therefore', 'however', 'additionally',
    'considering', 'given that', 'for example', 'such as'
  ];
  depth = depthMarkers.reduce((acc, marker) => 
    prompt.toLowerCase().includes(marker) ? acc + 1 : acc, 0
  );
  
  // Usage bonus
  power += Math.min(usageCount * 0.5, 3);
  
  return {
    power: Math.min(Math.round(power), 10),
    depth: Math.min(depth, 5),
    level: power >= 8 ? 'Legendary' : power >= 6 ? 'Epic' : power >= 4 ? 'Rare' : 'Common'
  };
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, onReuse, onSave, isSaved }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const stats = calculatePromptPower(message.text, message.usageCount || 0);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };
  
  return (
    <div className={`group mb-3 ${isUser ? 'ml-4' : 'mr-4'}`}>
      <div className={`p-3 rounded-lg text-xs leading-relaxed ${
        isUser 
          ? 'bg-primary/15 text-gray-200 ml-auto max-w-[90%]' 
          : 'bg-white/5 text-gray-300 max-w-[90%]'
      }`}>
        {/* Header with stats */}
        <div className="flex items-center justify-between mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider">
              {isUser ? 'You' : 'Aura'}
            </span>
            {isUser && (
              <>
                <span className="text-[8px] px-1 rounded bg-white/10">
                  ⚡ {stats.power}
                </span>
                <span className={`text-[8px] px-1 rounded ${
                  stats.level === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                  stats.level === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                  stats.level === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {stats.level}
                </span>
              </>
            )}
          </div>
          <span className="text-[8px] text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.text}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUser && (
            <button
              onClick={() => onReuse(message.text)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 text-[9px]"
            >
              <Play className="w-3 h-3" /> Re-run
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/10 text-gray-400"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {isUser && (
            <button
              onClick={() => onSave(message)}
              className={`p-1 rounded ${isSaved ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
            >
              <Bookmark className="w-3 h-3" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prompt Library Item ───────────────────────────────────────────────────────
function PromptLibraryItem({ prompt, onUse, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const stats = calculatePromptPower(prompt.text, prompt.usageCount || 0);
  
  return (
    <div className="p-2 rounded bg-white/5 border border-white/5 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] px-1 rounded ${
              stats.level === 'Legendary' ? 'bg-yellow-500/20 text-yellow-400' :
              stats.level === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
              stats.level === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {stats.level}
            </span>
            <span className="text-[9px] text-gray-500">⚡ {stats.power}</span>
            {prompt.tags?.map(tag => (
              <span key={tag} className="text-[8px] px-1 rounded bg-white/10 text-gray-400">
                {tag}
              </span>
            ))}
          </div>
          <p className={`text-[10px] text-gray-300 ${expanded ? '' : 'line-clamp-2'}`}>
            {prompt.text}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 text-gray-500 hover:text-gray-300"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-[8px] text-gray-500">
          Used {prompt.usageCount || 0} times
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUse(prompt.text)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 text-[9px]"
          >
            <Play className="w-3 h-3" /> Use
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AuraChatHistory({ 
  isOpen, 
  onClose, 
  messages = [], 
  onSendMessage,
  savedPrompts = [],
  onSavePrompt,
  onDeletePrompt 
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'library'
  const [searchQuery, setSearchQuery] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const scrollRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && activeTab === 'history') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);
  
  // Filter messages
  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter saved prompts
  const filteredPrompts = savedPrompts.filter(p => 
    p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleReuse = (text) => {
    onSendMessage?.(text);
    toast.success('Prompt sent to Aura');
  };
  
  const handleSave = (message) => {
    const stats = calculatePromptPower(message.text);
    onSavePrompt?.({
      id: Date.now().toString(),
      text: message.text,
      timestamp: message.timestamp,
      power: stats.power,
      depth: stats.depth,
      level: stats.level,
      tags: [],
      usageCount: 1
    });
    toast.success('Prompt saved to library');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-16 right-4 w-80 h-[calc(100vh-6rem)] bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-300">Aura Memory</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'history' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          History ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
            activeTab === 'library' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Star className="w-3 h-3 inline mr-1" />
          Library ({savedPrompts.length})
        </button>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 placeholder-gray-500 outline-none focus:border-primary/30"
          />
        </div>
      </div>
      
      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {activeTab === 'history' ? (
          <>
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">No messages yet</p>
                <p className="text-[9px] opacity-60">Start chatting with Aura</p>
              </div>
            ) : (
              filteredMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || i}
                  message={msg}
                  onReuse={handleReuse}
                  onSave={handleSave}
                  isSaved={savedPrompts.some(p => p.text === msg.text)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">No saved prompts</p>
                <p className="text-[9px] opacity-60">Bookmark prompts from history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPrompts.map(prompt => (
                  <PromptLibraryItem
                    key={prompt.id}
                    prompt={prompt}
                    onUse={handleReuse}
                    onDelete={onDeletePrompt}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-[9px] text-gray-500">
          <span>{messages.filter(m => m.role === 'user').length} prompts</span>
          <span>
            {savedPrompts.reduce((acc, p) => acc + (p.usageCount || 0), 0)} executions
          </span>
        </div>
      </div>
    </div>
  );
}
