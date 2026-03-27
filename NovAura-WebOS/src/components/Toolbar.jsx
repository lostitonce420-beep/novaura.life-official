import React, { useState, useEffect } from 'react';
import {
  Code, Globe, Music, MessageSquare, Terminal, Phone, Brain,
  Palette, Eraser, Hammer, FolderOpen, Store, User,
  BookOpen, Paintbrush, Zap, Gamepad2, Music2, Settings,
  Wand2, Blocks, Shuffle, Briefcase, Swords, Image, Shirt,
  Sparkles, UserCircle, Users, Bot, Radio, PenTool, Library,
  CreditCard, FileText, Bell, Trophy, PieChart, Layers, Shield
} from 'lucide-react';

// Master registry of all toolbar-capable apps — keyed by window type (same IDs as PersonalizationWindow)
const APP_REGISTRY = {
  // Dev Tools
  'ide':               { icon: Code,          label: 'IDE',       color: 'var(--app-ide)' },
  'website-builder':   { icon: Hammer,        label: 'Builder',   color: 'var(--app-builder)' },
  'vibe-coding':       { icon: Zap,           label: 'Vibe',      color: 'var(--app-ide)' },
  'creator-studio':    { icon: Wand2,         label: 'Creator',   color: 'var(--app-ide)' },
  'constructor':       { icon: Blocks,        label: 'Construct',  color: 'var(--app-builder)' },
  'script-fusion':     { icon: Shuffle,       label: 'Script',    color: 'var(--app-ide)' },
  'workspace':         { icon: Briefcase,     label: 'Work',      color: 'var(--app-files)' },
  'dojo':              { icon: Swords,         label: 'Dojo',      color: 'var(--app-ide)' },
  'terminal':          { icon: Terminal,       label: 'Term',      color: 'var(--app-terminal)' },
  // Creative
  'art-studio':        { icon: Paintbrush,    label: 'Art',       color: 'var(--app-vertex)' },
  'art-gallery':       { icon: Image,         label: 'Gallery',   color: 'var(--app-vertex)' },
  'comic-creator':     { icon: Layers,        label: 'Comics',    color: 'var(--app-vertex)' },
  'clothing-creator':  { icon: Shirt,         label: 'Clothing',  color: 'var(--app-vertex)' },
  'outfit-generator':  { icon: Sparkles,      label: 'Outfits',   color: 'var(--app-vertex)' },
  'outfit-manager':    { icon: Shirt,         label: 'Wardrobe',  color: 'var(--app-vertex)' },
  'avatar-builder':    { icon: UserCircle,    label: 'Avatar',    color: 'var(--app-profile)' },
  'avatar-gallery':    { icon: Users,         label: 'Avatars',   color: 'var(--app-profile)' },
  // Writing
  'literature-ide':    { icon: BookOpen,      label: 'Lit IDE',   color: 'var(--app-ide)' },
  'poems':             { icon: PenTool,       label: 'Poems',     color: 'var(--app-ide)' },
  'collab-writing':    { icon: PenTool,       label: 'Collab',    color: 'var(--app-chat)' },
  'writing-library':   { icon: Library,       label: 'Writings',  color: 'var(--app-files)' },
  // Media
  'music-composer':    { icon: Music2,        label: 'Music',     color: 'var(--app-media)' },
  'live-broadcast':    { icon: Radio,         label: 'Live',      color: 'var(--app-media)' },
  'media':             { icon: Music,         label: 'Media',     color: 'var(--app-media)' },
  'media-library':     { icon: FolderOpen,    label: 'Files',     color: 'var(--app-files)' },
  // AI
  'chat':              { icon: MessageSquare,  label: 'Chat',     color: 'var(--app-chat)' },
  'voice':             { icon: Phone,          label: 'Voice',    color: 'var(--app-voice)' },
  'ai-assistant':      { icon: Brain,          label: 'Assist',   color: 'var(--app-chat)' },
  'ai-companion':      { icon: Bot,            label: 'Nova',     color: 'var(--app-chat)' },
  'vertex':            { icon: Palette,        label: 'Vertex',   color: 'var(--app-vertex)' },
  'bg-remover':        { icon: Eraser,         label: 'BG Cut',   color: 'var(--app-bgremover)' },
  // Utility
  'browser':           { icon: Globe,          label: 'Browser',  color: 'var(--app-browser)' },
  'business-card':     { icon: CreditCard,     label: 'Cards',    color: 'var(--app-builder)' },
  'tax-filing':        { icon: FileText,       label: 'Tax',      color: 'var(--app-files)' },
  'notifications':     { icon: Bell,           label: 'Alerts',   color: 'var(--app-chat)' },
  'profile':           { icon: User,           label: 'Profile',  color: 'var(--app-profile)' },
  'appstore':          { icon: Store,          label: 'Store',    color: 'var(--app-store)' },
  'personalization':   { icon: Settings,       label: 'Settings', color: 'var(--app-chat)' },
  // Games & Learn
  'games-arena':       { icon: Gamepad2,       label: 'Games',    color: 'var(--app-store)' },
  'aetherium-tcg':     { icon: Gamepad2,       label: 'TCG',      color: 'var(--app-store)' },
  'card-deck-creator': { icon: Layers,         label: 'Decks',    color: 'var(--app-store)' },
  'challenges':        { icon: Trophy,         label: 'Chal.',    color: 'var(--app-store)' },
  'psychometrics':     { icon: PieChart,       label: 'Psyche',   color: 'var(--app-chat)' },
  // Additional
  'files':             { icon: FolderOpen,     label: 'Files',    color: 'var(--app-files)' },
  'pixai':             { icon: Image,          label: 'PixAI',    color: 'var(--app-vertex)' },
  'git':               { icon: FolderOpen,     label: 'Git',      color: 'var(--app-ide)' },
  'secrets':           { icon: Shield,         label: 'Secrets',  color: 'var(--app-terminal)' },
  'billing':           { icon: CreditCard,     label: 'Billing',  color: 'var(--app-store)' },
  'pricing':           { icon: CreditCard,     label: 'Pricing',  color: 'var(--app-store)' },
};

// Default toolbar apps (used when no saved config exists)
const DEFAULT_APPS = [
  'ide', 'website-builder', 'browser', 'vertex', 'bg-remover',
  'media', 'media-library', 'chat', 'voice', 'terminal',
  'ai-assistant', 'literature-ide', 'art-studio', 'music-composer',
  'vibe-coding', 'games-arena', 'appstore', 'profile', 'personalization',
];

export default function Toolbar({ onOpenWindow }) {
  const [activeApps, setActiveApps] = useState(DEFAULT_APPS);

  useEffect(() => {
    const saved = localStorage.getItem('novaura-taskbar-apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveApps(parsed);
        }
      } catch { /* use defaults */ }
    }

    // Listen for changes from PersonalizationWindow (same tab)
    const onStorage = (e) => {
      if (e.key === 'novaura-taskbar-apps' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setActiveApps(updated);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);

    // Also listen for custom event (same-tab writes don't fire 'storage')
    const onCustom = (e) => {
      if (Array.isArray(e.detail)) setActiveApps(e.detail);
    };
    window.addEventListener('novaura-taskbar-update', onCustom);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('novaura-taskbar-update', onCustom);
    };
  }, []);

  // Build the visible toolbar items from saved order
  const visibleTools = activeApps
    .map(id => {
      const reg = APP_REGISTRY[id];
      if (!reg) return null;
      return { id, type: id, ...reg };
    })
    .filter(Boolean);

  return (
    <div className="rgb-border rounded-2xl">
      <div className="rgb-flow-layer" />
      <div className="flex items-center gap-0.5 bg-black rounded-2xl p-1.5 relative z-10">
        {visibleTools.map((tool, index) => {
          const Icon = tool.icon;
          const delay = `${(index * 0.23).toFixed(2)}s`;
          return (
            <button
              key={tool.id}
              onClick={() => onOpenWindow(tool.type, tool.label)}
              className="group flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
                         hover:bg-white/5 transition-all duration-200 hover:scale-105 active:scale-95
                         touch-manipulation relative"
            >
              <Icon
                size={18}
                className="rgb-icon-glow transition-all duration-300"
                style={{ animationDelay: delay }}
              />
              <span className="text-[9px] font-medium text-white/40 group-hover:text-white/80 transition-colors leading-none">
                {tool.label}
              </span>
              
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Open {tool.label}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
