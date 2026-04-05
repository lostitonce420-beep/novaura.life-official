import React, { useState, useMemo } from 'react';
import {
  Clock, Cpu, Wifi, Activity, Bell, Settings, ChevronLeft, ChevronRight,
  Layers, Gauge, MemoryStick, Search,
  Gamepad2, Swords, Rocket, Crown, ShoppingBag, Users, User,
  // App icons
  Paintbrush, Image, Shirt, Wand2, PenTool, Library, Zap,
  BookOpen, Feather, FileText, MessageSquare, Phone, Brain,
  Code2, Globe, Hammer, Wrench, Blocks, GitMerge, FolderOpen,
  Music, Radio, Play, FolderOpen as Files,
  Palette, Eraser, Terminal, CreditCard, Store,
  Dumbbell, BrainCircuit, ChevronDown, ChevronUp, Bot, Heart,
  BellRing, Grid as GridIcon, Shield, Briefcase, Sparkles,
  CloudSun, Bitcoin, Calculator, Package, Smile,
  // Logout icons
  LogOut, AlertTriangle, X,
  // Platform icons
  ExternalLink, ArrowLeftFromLine
} from 'lucide-react';

// ─── App Registry ───
const APP_CATEGORIES = [
  {
    id: 'creative', label: 'Creative', color: 'text-pink-400',
    apps: [
      { type: 'art-studio', label: 'Art Studio', icon: Paintbrush },
      { type: 'art-gallery', label: 'Art Gallery', icon: Image },
      { type: 'clothing-creator', label: 'Clothing', icon: Shirt },
      { type: 'outfit-generator', label: 'Outfits', icon: Wand2 },
      { type: 'avatar-builder', label: 'Avatar', icon: User },
      { type: 'avatar-gallery', label: 'Avatars', icon: GridIcon },
      { type: 'outfit-manager', label: 'Wardrobe', icon: Heart },
      { type: 'comic-creator', label: 'Comics', icon: Palette },
    ],
  },
  {
    id: 'writing', label: 'Writing', color: 'text-violet-400',
    apps: [
      { type: 'literature-ide', label: 'Literature', icon: BookOpen },
      { type: 'poems', label: 'Poems', icon: Feather },
      { type: 'collab-writing', label: 'Collab Write', icon: PenTool },
      { type: 'writing-library', label: 'Library', icon: Library },
    ],
  },
  {
    id: 'dev', label: 'Dev Tools', color: 'text-cyan-400',
    apps: [
      { type: 'ide', label: 'Cybeni', icon: Code2 },
      { type: 'website-builder', label: 'Builder', icon: Hammer },
      { type: 'vibe-coding', label: 'Vibe Code', icon: Zap },
      { type: 'creator-studio', label: 'Creator', icon: Wrench },
      { type: 'constructor', label: 'Constructor', icon: Blocks },
      { type: 'script-fusion', label: 'Script Fuse', icon: GitMerge },
      { type: 'workspace', label: 'Workspace', icon: FolderOpen },
      { type: 'dojo', label: 'Dojo', icon: Swords },
      { type: 'avatar-creator', label: 'Living Avatar', icon: Smile },
    ],
  },
  {
    id: 'media', label: 'Media', color: 'text-green-400',
    apps: [
      { type: 'music-composer', label: 'Composer', icon: Music },
      { type: 'live-broadcast', label: 'Broadcast', icon: Radio },
      { type: 'media', label: 'Player', icon: Play },
      { type: 'media-library', label: 'Files', icon: Files },
    ],
  },
  {
    id: 'ai', label: 'AI', color: 'text-blue-400',
    apps: [
      { type: 'chat', label: 'Chat', icon: MessageSquare },
      { type: 'voice', label: 'Voice', icon: Phone },
      { type: 'live-ai', label: 'Nova Live', icon: Radio },
      { type: 'ai-assistant', label: 'Assistant', icon: Brain },
      { type: 'ai-companion', label: 'Nova AI', icon: Bot },
      { type: 'vertex', label: 'Vertex AI', icon: Palette },
      { type: 'imagen', label: 'Imagen', icon: Sparkles },
      { type: 'bg-remover', label: 'BG Remove', icon: Eraser },
      { type: 'pixai', label: 'PixAI Art', icon: Image },
    ],
  },
  {
    id: 'utility', label: 'Utility', color: 'text-amber-400',
    apps: [
      { type: 'files', label: 'Files', icon: FolderOpen },
      { type: 'terminal', label: 'Terminal', icon: Terminal },
      { type: 'browser', label: 'Browser', icon: Globe },
      { type: 'business-card', label: 'Biz Cards', icon: CreditCard },
      { type: 'tax-filing', label: 'Tax Filing', icon: FileText },
      { type: 'weather', label: 'Weather', icon: CloudSun },
      { type: 'crypto', label: 'Crypto', icon: Bitcoin },
      { type: 'calculator', label: 'Calculator', icon: Calculator },
      { type: 'notifications', label: 'Alerts', icon: BellRing },
      { type: 'profile', label: 'Profile', icon: User },
      { type: 'appstore', label: 'Repo Station', icon: Store },
    ],
  },
  {
    id: 'business', label: 'Business', color: 'text-orange-400',
    apps: [
      { type: 'business-operator', label: 'Operator', icon: Briefcase },
      { type: 'nova-concierge', label: 'Nova Biz', icon: Sparkles },
    ],
  },
  {
    id: 'admin', label: 'Admin', color: 'text-red-400',
    apps: [
      { type: 'admin-panel', label: 'Admin Panel', icon: Shield },
    ],
  },
  {
    id: 'learn', label: 'Learn', color: 'text-emerald-400',
    apps: [
      { type: 'challenges', label: 'Challenges', icon: Dumbbell },
      { type: 'psychometrics', label: 'Psyche', icon: BrainCircuit },
      { type: 'games-arena', label: 'Games', icon: Gamepad2 },
      { type: 'aetherium-tcg', label: 'Aetherium', icon: Swords },
      { type: 'gilded-cage', label: 'Gilded Cage', icon: Crown },
      { type: 'glb-game', label: '3D Games', icon: Rocket },
      { type: 'inventory', label: 'Inventory', icon: Package },
    ],
  },
];

function SystemWidget({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group">
      <Icon className="w-3 h-3 text-primary/50 group-hover:text-primary/80" />
      <div className="flex-1 min-w-0">
        <p className="text-[8px] text-white/30 leading-none">{label}</p>
        <p className="text-[10px] text-white/70 font-medium leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Pinned apps shown in icon rail when sidebar is collapsed ───
const PINNED_APPS = [
  { type: 'chat',          label: 'Chat',         icon: MessageSquare },
  { type: 'ide',           label: 'Cybeni IDE',   icon: Code2 },
  { type: 'literature-ide',label: 'Literature',   icon: BookOpen },
  { type: 'art-studio',    label: 'Art Studio',   icon: Paintbrush },
  { type: 'games-arena',   label: 'Games',        icon: Gamepad2 },
  { type: 'terminal',      label: 'Terminal',     icon: Terminal },
  { type: 'browser',       label: 'Browser',      icon: Globe },
  { type: 'appstore',      label: 'Repo Station', icon: Store },
  { type: 'profile',       label: 'Profile',      icon: User },
];

// Simple rail button (used for expand chevron only)
function RailButton({ icon: Icon, label, color = 'text-white/40', onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative group flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-all"
    >
      <Icon className={`w-4 h-4 ${color} group-hover:text-[#39ff14] transition-colors`}
        style={{ filter: 'none' }}
        onMouseEnter={e => e.currentTarget.style.filter = 'drop-shadow(0 0 6px #39ff14)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      />
      <span className="
        absolute left-full ml-2.5 z-50
        px-2.5 py-1 rounded-lg
        bg-black/90 backdrop-blur-sm
        border border-white/[0.08]
        text-[11px] text-white/85 font-medium
        whitespace-nowrap pointer-events-none
        opacity-0 -translate-x-1
        group-hover:opacity-100 group-hover:translate-x-0
        transition-all duration-150 ease-out
      ">
        {label}
      </span>
    </button>
  );
}

// Rail button with neon glow + click-to-open dropdown
function RailDropButton({ icon: Icon, label, isOpen, onToggle, onOpen }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
        style={{
          background: isOpen ? 'rgba(57,255,20,0.08)' : 'transparent',
          boxShadow: isOpen ? '0 0 10px rgba(57,255,20,0.15)' : 'none',
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon
          className="w-4 h-4 transition-all duration-200"
          style={{
            color: isOpen ? '#39ff14' : 'rgba(255,255,255,0.4)',
            filter: isOpen ? 'drop-shadow(0 0 8px #39ff14)' : 'none',
          }}
          onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.color = '#39ff14'; e.currentTarget.style.filter = 'drop-shadow(0 0 6px #39ff14)'; }}}
          onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.filter = 'none'; }}}
        />
      </button>
      {isOpen && (
        <div className="absolute left-full ml-2.5 top-0 z-[900] min-w-[160px] overflow-hidden"
          style={{
            background: 'rgba(5,5,10,0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(57,255,20,0.12), 0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
            <Icon className="w-3.5 h-3.5" style={{ color: '#39ff14', filter: 'drop-shadow(0 0 4px #39ff14)' }} />
            <span className="text-[12px] text-white/85 font-semibold">{label}</span>
          </div>
          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={onOpen}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.07] transition-colors text-left group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]/60 group-hover:bg-[#39ff14]" style={{ boxShadow: '0 0 4px #39ff14' }} />
              <span className="text-[11px] text-white/60 group-hover:text-white/90">Open App</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEFT SIDEBAR: App Launcher ───
export function LeftSidebar({ windowCount = 0, onOpenWindow, onExitToPlatform, className = '' }) {
  const [collapsed, setCollapsed] = useState(true);
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState({ creative: true, writing: true, dev: true, media: true, ai: true, utility: false, admin: false, learn: true });
  const [showSystem, setShowSystem] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const toggleCat = (id) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return APP_CATEGORIES;
    const q = search.toLowerCase();
    return APP_CATEGORIES.map(cat => ({
      ...cat,
      apps: cat.apps.filter(a => a.label.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)),
    })).filter(cat => cat.apps.length > 0);
  }, [search]);

  if (collapsed) {
    return (
      <>
        {/* Click-outside overlay to close dropdown */}
        {openDropdown && (
          <div className="fixed inset-0 z-[850]" onClick={() => setOpenDropdown(null)} />
        )}
        <div className={`fixed left-0 top-1/2 -translate-y-1/2 z-[900] pointer-events-auto ${className}`}>
          <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.06] border-l-0 rounded-r-xl">
            {/* Expand button */}
            <RailButton icon={ChevronRight} label="All Apps" color="text-white/30" onClick={() => setCollapsed(false)} />

            {/* Divider */}
            <div className="w-5 h-px bg-white/[0.06] my-1" />

            {/* Pinned app icons — scrollable */}
            <div className="flex flex-col items-center gap-1 overflow-y-auto max-h-[55vh]" style={{ scrollbarWidth: 'none' }}>
              {PINNED_APPS.map(app => (
                <RailDropButton
                  key={app.type}
                  icon={app.icon}
                  label={app.label}
                  isOpen={openDropdown === app.type}
                  onToggle={() => setOpenDropdown(openDropdown === app.type ? null : app.type)}
                  onOpen={() => { onOpenWindow?.(app.type, app.label); setOpenDropdown(null); }}
                />
              ))}
            </div>

            {/* Divider + clock */}
            <div className="w-5 h-px bg-white/[0.06] my-1" />
            <span className="text-[8px] text-white/25 font-medium [writing-mode:vertical-lr] rotate-180 leading-none py-1">{timeStr}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`fixed left-0 top-1/2 -translate-y-1/2 z-[800] pointer-events-auto ${className}`}>
      <div className="rgb-border rgb-border-subtle rounded-r-2xl">
        <div className="rgb-flow-layer" />
        <div className="relative z-10 bg-black rounded-r-2xl w-52 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-3 py-2 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Apps</span>
              <button onClick={() => setCollapsed(true)} className="text-white/20 hover:text-white/60 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Clock */}
            <div className="text-center py-1 mb-1.5 border-b border-white/[0.06]">
              <p className="text-lg font-bold text-white/90 tabular-nums leading-tight">{timeStr}</p>
              <p className="text-[9px] text-white/40">{dateStr}</p>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 text-white/20 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/[0.06] rounded-lg text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-primary/30"
              />
            </div>
          </div>

          {/* App List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin">
            {filteredCategories.map(cat => (
              <div key={cat.id}>
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  {expandedCats[cat.id] ? <ChevronDown className="w-2.5 h-2.5 text-white/30" /> : <ChevronRight className="w-2.5 h-2.5 text-white/30" />}
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                  <span className="text-[8px] text-white/20 ml-auto">{cat.apps.length}</span>
                </button>
                {expandedCats[cat.id] && (
                  <div className="ml-1 space-y-px">
                    {cat.apps.map(app => {
                      const Icon = app.icon;
                      return (
                        <button
                          key={app.type}
                          onClick={() => onOpenWindow?.(app.type, app.label)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.07] transition-all group text-left"
                        >
                          <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
                          <span className="text-[11px] text-white/60 group-hover:text-white/90 truncate">{app.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Exit to Platform */}
          <div className="shrink-0 border-t border-white/[0.06] px-2 pb-2">
            <a
              href="https://novaura.life"
              onClick={(e) => {
                if (onExitToPlatform) {
                  e.preventDefault();
                  onExitToPlatform();
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-neon-cyan/10 to-transparent border border-neon-cyan/20 hover:border-neon-cyan/40 hover:bg-neon-cyan/10 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ExternalLink className="w-4 h-4 text-neon-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-neon-cyan/90 group-hover:text-neon-cyan">Return to Platform</p>
                <p className="text-[9px] text-white/40">Exit WebOS</p>
              </div>
              <ArrowLeftFromLine className="w-3 h-3 text-neon-cyan/50 group-hover:text-neon-cyan opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
            </a>
          </div>

          {/* System section */}
          <div className="shrink-0 border-t border-white/[0.06]">
            <button
              onClick={() => setShowSystem(!showSystem)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 transition-colors"
            >
              {showSystem ? <ChevronDown className="w-2.5 h-2.5 text-white/30" /> : <ChevronRight className="w-2.5 h-2.5 text-white/30" />}
              <Cpu className="w-3 h-3 text-white/30" />
              <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">System</span>
            </button>
            {showSystem && (
              <div className="px-2 pb-2 space-y-0.5">
                <SystemWidget icon={Cpu} label="CPU" value="Ready" />
                <SystemWidget icon={MemoryStick} label="Memory" value={`${navigator.deviceMemory || '?'} GB`} />
                <SystemWidget icon={Gauge} label="GPU" value={navigator.gpu ? 'WebGPU' : 'WebGL'} />
                <SystemWidget icon={Wifi} label="Network" value={navigator.onLine ? 'Online' : 'Offline'} />
                <SystemWidget icon={Layers} label="Windows" value={`${windowCount} open`} />
              </div>
            )}
            <div className="px-2 pb-2 space-y-0.5">
              <button
                onClick={() => onOpenWindow?.('profile', 'Notifications')}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
              >
                <Bell className="w-3 h-3" />
                <span className="text-[10px]">Notifications</span>
              </button>
              <button
                onClick={() => onOpenWindow?.('profile', 'Settings')}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
              >
                <Settings className="w-3 h-3" />
                <span className="text-[10px]">Settings</span>
              </button>
              <button
                onClick={() => onOpenWindow?.('personalization', 'Personalization')}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
              >
                <Palette className="w-3 h-3" />
                <span className="text-[10px]">Themes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RIGHT SIDEBAR: Games + Social ───
const GAMES = [
  { id: 'games-arena', title: 'Games Arena', desc: 'Chess, Checkers & more', icon: Gamepad2, accent: 'from-cyan-500 to-emerald-500', windowType: 'games-arena' },
  { id: 'aetherium-tcg', title: 'Aetherium TCG', desc: 'Trading Card Game', icon: Swords, accent: 'from-purple-500 to-cyan-500', windowType: 'aetherium-tcg' },
  { id: 'gilded-cage', title: 'The Gilded Cage', desc: 'Steampunk RPG Adventure', icon: Crown, accent: 'from-amber-500 to-orange-600', windowType: 'gilded-cage' },
];

const SOCIAL = [
  { id: 'appstore', title: 'Repo Station', desc: 'Repo Station', icon: ShoppingBag, windowType: 'appstore', ready: true },
  { id: 'community', title: 'Community', desc: 'Connect & Share', icon: Users, windowType: 'social', ready: true },
];

export function RightSidebar({ onOpenGame, onOpenWindow, onLogout, className = '' }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
    else window.location.href = '/login';
  };
  const handleCancelLogout = () => setShowLogoutConfirm(false);

  if (collapsed) {
    return (
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-[800] pointer-events-auto ${className}`}>
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-black/60 backdrop-blur-sm border border-white/[0.06] border-r-0 rounded-l-xl">
          {/* Expand */}
          <button
            onClick={() => setCollapsed(false)}
            className="relative group flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            <span className="absolute right-full mr-2.5 z-50 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-sm border border-white/[0.08] text-[11px] text-white/85 font-medium whitespace-nowrap pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out">
              Games & More
            </span>
          </button>

          <div className="w-5 h-px bg-white/[0.06] my-1" />

          {/* Game icons */}
          {GAMES.map(game => {
            const Icon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => onOpenWindow?.(game.windowType, game.title)}
                className="relative group flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-all"
              >
                <Icon className="w-4 h-4 text-secondary/50 group-hover:text-secondary/90 transition-colors" />
                <span className="absolute right-full mr-2.5 z-50 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-sm border border-white/[0.08] text-[11px] text-white/85 font-medium whitespace-nowrap pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out">
                  {game.title}
                </span>
              </button>
            );
          })}

          <div className="w-5 h-px bg-white/[0.06] my-1" />

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className="relative group flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neon-red/10 transition-all"
          >
            <LogOut className="w-4 h-4 text-neon-red/50 group-hover:text-neon-red transition-colors" />
            <span className="absolute right-full mr-2.5 z-50 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-sm border border-neon-red/20 text-[11px] text-neon-red/90 font-medium whitespace-nowrap pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out">
              Logout
            </span>
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-[800] pointer-events-auto ${className}`}>
      <div className="rgb-border rgb-border-subtle rounded-l-2xl">
        <div className="rgb-flow-layer" />
        <div className="relative z-10 bg-black rounded-l-2xl w-52 py-3 px-2 space-y-3">
          {/* Logout Confirmation Dialog */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-void-light border border-neon-red/30 rounded-2xl p-5 w-72 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neon-red/10 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-neon-red" />
                  </div>
                  <h3 className="font-heading font-bold text-white">Logout?</h3>
                </div>
                <p className="text-sm text-white/60 mb-5">
                  Are you sure you want to logout? Any unsaved work may be lost.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelLogout}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLogout}
                    className="flex-1 px-4 py-2 rounded-lg bg-neon-red/20 text-neon-red hover:bg-neon-red/30 border border-neon-red/30 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logout Toggle - At the very top */}
          <div className="px-1 pb-2 border-b border-white/[0.06]">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-neon-red/5 border border-neon-red/20 hover:bg-neon-red/10 hover:border-neon-red/30 transition-all group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-neon-red/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4 text-neon-red" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-neon-red/90 group-hover:text-neon-red">Logout</p>
                <p className="text-[10px] text-white/30">Switch account or exit</p>
              </div>
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-secondary/60" />
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Games</span>
            </div>
            <button onClick={() => setCollapsed(true)} className="text-white/20 hover:text-white/60 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Games */}
          <div className="space-y-2">
            {GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  onClick={() => {
                    if (onOpenWindow) onOpenWindow(game.windowType, game.title);
                    else if (onOpenGame) onOpenGame(game.id, game.title);
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group text-left"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${game.accent} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 group-hover:text-white truncate">{game.title}</p>
                    <p className="text-[10px] text-white/30">{game.desc}</p>
                    <span className="text-[9px] text-success/60 font-medium">Play Now</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Social */}
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-[9px] text-white/30 font-medium uppercase tracking-wider px-1 mb-1.5">Social</p>
            <div className="space-y-1">
              {SOCIAL.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => item.ready && onOpenWindow?.(item.windowType, item.title)}
                    disabled={!item.ready}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all group text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/70 group-hover:text-white truncate">{item.title}</p>
                      <p className="text-[9px] text-white/30">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/[0.06] px-1">
            <p className="text-[9px] text-white/20 text-center">NovAura Game Library</p>
          </div>
        </div>
      </div>
    </div>
  );
}
