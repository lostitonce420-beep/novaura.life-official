import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Globe, Terminal, Plus, X, Check, Clock, Sparkles,
  Server, Database, Cloud, Code, Layout, MessageSquare,
  TrendingUp, DollarSign, Users, Mail, Calendar, Search,
  Play, Pause, Settings, Shield, Zap, Cpu, Activity,
  ChevronRight, ExternalLink, Copy, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, Download, Upload, Folder, FileCode,
  Send, Mic, Image, Video, Music, BarChart3, Target,
  Briefcase, Award, Gift, Star, Heart, Bookmark,
  Command, Keyboard, Eye, EyeOff, Lock, Unlock,
  Wifi, WifiOff, Battery, BatteryCharging, Sun, Moon,
  Inbox, Package, ShieldCheck, Rocket, CircleDollarSign,
  Wallet, CreditCard, TrendingDown, ZapOff, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { DomainAPI } from '../../services/apiCodex';
import { useAuth } from '../../hooks/useAuth.jsx';

// ── Nova Avatar Component ────────────────────────────────────────────────────
function NovaAvatar({ mood, isThinking, size = 'normal' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    normal: 'w-16 h-16',
    large: 'w-24 h-24'
  };
  
  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`absolute inset-0 rounded-full ${
        isThinking ? 'animate-pulse bg-primary/30' : 'bg-gradient-to-br from-primary via-purple-500 to-pink-500'
      }`} />
      <div className="absolute inset-1 rounded-full bg-[#0a0a0f] flex items-center justify-center">
        <Bot className={`${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-12 h-12' : 'w-8 h-8'} text-primary`} />
      </div>
      {isThinking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '100ms' }} />
          <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>
      )}
    </div>
  );
}

// ── Tool Button Component ────────────────────────────────────────────────────
function ToolButton({ icon: Icon, label, onClick, isActive, badge, color = 'primary' }) {
  const colors = {
    primary: 'hover:bg-primary/20 hover:text-primary hover:border-primary/30',
    success: 'hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30',
    warning: 'hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/30',
    danger: 'hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30',
    info: 'hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30'
  };
  
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent transition-all ${
        isActive ? 'bg-primary/20 text-primary border-primary/30' : colors[color]
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ── Widget Card Component ────────────────────────────────────────────────────
function WidgetCard({ title, type, status, data, onClick, isEmpty }) {
  const typeIcons = {
    domain: Globe,
    database: Database,
    server: Server,
    app: Layout,
    analytics: BarChart3,
    store: DollarSign,
    email: Mail,
    social: Users,
    add: Plus
  };
  
  const Icon = typeIcons[type] || Layout;
  const statusColors = {
    active: 'text-green-400 border-green-500/30 bg-green-500/10',
    pending: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    building: 'text-blue-400 border-blue-500/30 bg-blue-500/10 animate-pulse',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    empty: 'text-gray-400 border-gray-500/30 bg-gray-500/10'
  };
  
  if (isEmpty) {
    return (
      <div 
        onClick={onClick}
        className="p-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[120px]"
      >
        <Plus className="w-8 h-8 text-gray-500 mb-2 group-hover:text-primary transition-colors" />
        <span className="text-xs text-gray-500 group-hover:text-gray-400">{title}</span>
      </div>
    );
  }
  
  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${statusColors[status] || statusColors.active}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${statusColors[status] || statusColors.active}`}>
          {status}
        </div>
      </div>
      <h4 className="text-sm font-medium text-gray-200 mb-1">{title}</h4>
      <p className="text-[10px] text-gray-500">{data}</p>
      <div className="flex items-center gap-1 mt-3 text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Manage</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </div>
  );
}

// ── Activity Log Item ─────────────────────────────────────────────────────────
function ActivityItem({ time, action, result, type }) {
  const typeIcons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Clock,
    task: Target
  };
  
  const typeColors = {
    success: 'text-green-400 bg-green-500/10',
    error: 'text-red-400 bg-red-500/10',
    info: 'text-blue-400 bg-blue-500/10',
    task: 'text-yellow-400 bg-yellow-500/10'
  };
  
  const Icon = typeIcons[type] || Clock;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`p-1.5 rounded ${typeColors[type]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300">{action}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{result}</p>
      </div>
      <span className="text-[9px] text-gray-600">{time}</span>
    </div>
  );
}

// ── Empty State Component ────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-300 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 max-w-[200px]">{description}</p>
      {action && (
        <Button onClick={onAction} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          {action}
        </Button>
      )}
    </div>
  );
}

// ── Domain Creator Modal ─────────────────────────────────────────────────────
function DomainCreatorModal({ isOpen, onClose, onCreate }) {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('app');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  
  if (!isOpen) return null;
  
  const checkAvailability = async () => {
    if (!domain.trim()) return;
    setIsChecking(true);
    
    try {
      const result = await DomainAPI.checkAvailability(domain);
      setAvailability(result);
    } catch (err) {
      toast.error('Failed to check availability');
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleCreate = async () => {
    if (!domain.trim()) return;
    onCreate({ name: domain, type, status: 'pending' });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[400px] p-6 rounded-2xl bg-[#0d0d1a] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Create New Domain</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Domain Name</label>
            <div className="flex items-center gap-2">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="my-app"
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 outline-none focus:border-primary/30"
              />
              <span className="text-xs text-gray-500">.com</span>
              <button
                onClick={checkAvailability}
                disabled={isChecking || !domain.trim()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs disabled:opacity-50"
              >
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
              </button>
            </div>
            {availability && (
              <div className={`mt-2 text-xs ${availability.available ? 'text-green-400' : 'text-red-400'}`}>
                {availability.available ? '✓ Available!' : '✗ Taken'}
                {availability.available && availability.totalPrice && (
                  <span className="ml-2 text-gray-400">${availability.totalPrice}/yr</span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreate}
            disabled={!domain.trim() || !availability?.available}
            className="w-full py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Register Domain
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function NovaConciergeWindow() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isThinking, setIsThinking] = useState(false);
  const [command, setCommand] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [novaStatus, setNovaStatus] = useState('idle');
  const [stats, setStats] = useState({ domains: 0, emails: 0, revenue: 0, tasks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  
  // Load real data on mount
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first (quick)
      const savedWidgets = localStorage.getItem('novaura-widgets');
      const savedActivities = localStorage.getItem('novaura-activities');
      const savedStats = localStorage.getItem('novaura-stats');
      
      if (savedWidgets) setWidgets(JSON.parse(savedWidgets));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      if (savedStats) setStats(JSON.parse(savedStats));
      
      // Try to fetch real domains
      // const domainList = await DomainAPI.listDomains();
      // setDomains(domainList);
      
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    localStorage.setItem('novaura-widgets', JSON.stringify(newWidgets));
  };
  
  const addActivity = (action, result, type) => {
    const newActivity = {
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      action,
      result,
      type
    };
    const updated = [newActivity, ...activities].slice(0, 20);
    setActivities(updated);
    localStorage.setItem('novaura-activities', JSON.stringify(updated));
  };
  
  const handleCommand = async () => {
    if (!command.trim()) return;
    
    setIsThinking(true);
    setNovaStatus('working');
    
    // Process command
    setTimeout(() => {
      const cmd = command.toLowerCase();
      
      if (cmd.includes('domain') || cmd.includes('create')) {
        setShowDomainModal(true);
        addActivity('Opened domain creator', 'Ready to register', 'info');
      } else if (cmd.includes('email') || cmd.includes('outreach')) {
        addActivity('Email campaign requested', 'Configure in BusinessOperator', 'task');
      } else if (cmd.includes('backup') || cmd.includes('save')) {
        addActivity('Backup requested', 'Use Database Manager', 'info');
      } else {
        addActivity(`Command: "${command}"`, 'Processed - awaiting action', 'info');
      }
      
      setIsThinking(false);
      setNovaStatus('completed');
      setCommand('');
      
      setTimeout(() => setNovaStatus('idle'), 3000);
    }, 1000);
  };
  
  const handleCreateWidget = (widget) => {
    const newWidget = { ...widget, id: Date.now() };
    saveWidgets([...widgets, newWidget]);
    addActivity(`Created ${widget.type}: ${widget.name || widget.title}`, 'Active', 'success');
    
    // Update stats
    const newStats = { ...stats, domains: stats.domains + 1 };
    setStats(newStats);
    localStorage.setItem('novaura-stats', JSON.stringify(newStats));
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <NovaAvatar mood="neutral" isThinking={isThinking} size="small" />
          <div>
            <h2 className="text-sm font-semibold text-gray-200">Nova Concierge</h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                novaStatus === 'working' ? 'bg-yellow-400 animate-pulse' :
                novaStatus === 'completed' ? 'bg-green-400' : 'bg-blue-400'
              }`} />
              <span className="text-[10px] text-gray-500 capitalize">{novaStatus}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={loadUserData}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Command Bar */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
              placeholder="Ask Nova to create a domain, check status, or help with tasks..."
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
            />
            <button 
              onClick={handleCommand}
              disabled={!command.trim() || isThinking}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 hover:bg-primary/30 rounded-lg disabled:opacity-30"
            >
              {isThinking ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Send className="w-4 h-4 text-primary" />}
            </button>
          </div>
          
          {/* Quick Commands */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowDomainModal(true)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-400 transition-colors">
              + Domain
            </button>
            <button onClick={() => addActivity('Server check requested', 'All systems operational', 'success')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-400 transition-colors">
              Check Status
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 p-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-gray-500 mb-1">Domains</div>
            <div className="text-lg font-semibold text-gray-200">{stats.domains}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-gray-500 mb-1">Services</div>
            <div className="text-lg font-semibold text-gray-200">{widgets.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-gray-500 mb-1">Tasks</div>
            <div className="text-lg font-semibold text-gray-200">{stats.tasks}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] text-gray-500 mb-1">Revenue</div>
            <div className="text-lg font-semibold text-gray-200">${stats.revenue}</div>
          </div>
        </div>
        
        {/* Ecosystem Grid */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-400">Your Ecosystem</h3>
            {widgets.length > 0 && (
              <button 
                onClick={() => setShowDomainModal(true)}
                className="text-[10px] text-primary hover:text-primary/80"
              >
                + Add
              </button>
            )}
          </div>
          
          {widgets.length === 0 ? (
            <EmptyState 
              icon={Rocket}
              title="No services yet"
              description="Create your first domain or service to get started with Nova"
              action="Create Domain"
              onAction={() => setShowDomainModal(true)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {widgets.map(widget => (
                <WidgetCard key={widget.id} {...widget} />
              ))}
              <WidgetCard 
                title="Add Service" 
                type="add" 
                isEmpty 
                onClick={() => setShowDomainModal(true)}
              />
            </div>
          )}
        </div>
        
        {/* Activity Feed */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-400">Recent Activity</h3>
            {activities.length > 0 && (
              <button 
                onClick={() => { setActivities([]); localStorage.removeItem('novaura-activities'); }}
                className="text-[10px] text-gray-600 hover:text-gray-400"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="rounded-xl border border-white/10 bg-white/5">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No activity yet</p>
                <p className="text-[10px] text-gray-600 mt-1">Your actions will appear here</p>
              </div>
            ) : (
              activities.map((activity, i) => (
                <ActivityItem key={i} {...activity} />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Domain Creator Modal */}
      <DomainCreatorModal 
        isOpen={showDomainModal} 
        onClose={() => setShowDomainModal(false)}
        onCreate={handleCreateWidget}
      />
    </div>
  );
}
