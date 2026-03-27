import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Globe, Mail, DollarSign, Search, Calendar, 
  TrendingUp, Server, CreditCard, Users, Briefcase,
  Send, Plus, X, Check, Clock, AlertCircle, Play, 
  Pause, RefreshCw, Settings, Shield, StickyNote,
  ExternalLink, ChevronRight, Sparkles, Target,
  Zap, BarChart3, Package, MessageSquare, Trash2,
  Edit3, Save, Copy, CheckCircle2, XCircle, Loader2,
  Brain, Cloud, Database, Monitor, Lock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// ── Post-It Note Component ───────────────────────────────────────────────────
function PostItNote({ note, onUpdate, onDelete, onApprove, onDismiss }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  
  const colors = {
    lead: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200',
    task: 'bg-blue-500/20 border-blue-500/30 text-blue-200',
    grant: 'bg-green-500/20 border-green-500/30 text-green-200',
    expense: 'bg-red-500/20 border-red-500/30 text-red-200',
    strategy: 'bg-purple-500/20 border-purple-500/30 text-purple-200',
    alert: 'bg-orange-500/20 border-orange-500/30 text-orange-200',
  };
  
  const icons = {
    lead: Target, task: Check, grant: DollarSign, expense: TrendingUp,
    strategy: Brain, alert: AlertCircle
  };
  
  const Icon = icons[note.type] || StickyNote;
  
  return (
    <div className={`p-3 rounded-lg border ${colors[note.type] || colors.task} relative group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider font-medium">{note.type}</span>
        </div>
        <button onClick={() => onDelete(note.id)} className="opacity-0 group-hover:opacity-100 text-current/50 hover:text-current">
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={() => { onUpdate(note.id, editText); setIsEditing(false); }}
          className="w-full bg-black/30 border border-white/10 rounded p-2 text-[11px] resize-none"
          autoFocus
        />
      ) : (
        <p 
          onClick={() => setIsEditing(true)}
          className="text-[11px] leading-relaxed cursor-pointer"
        >
          {note.text}
        </p>
      )}
      
      {note.requiresApproval && (
        <div className="flex gap-1 mt-2">
          <button 
            onClick={() => onApprove(note.id)}
            className="flex-1 py-1 rounded bg-green-500/20 text-green-400 text-[9px] hover:bg-green-500/30"
          >
            Approve
          </button>
          <button 
            onClick={() => onDismiss(note.id)}
            className="flex-1 py-1 rounded bg-red-500/20 text-red-400 text-[9px] hover:bg-red-500/30"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="text-[8px] opacity-50 mt-2">
        {new Date(note.timestamp).toLocaleDateString()}
      </div>
    </div>
  );
}

// ── Mini Browser View ────────────────────────────────────────────────────────
function MiniBrowser({ url, isActive, onAction }) {
  const iframeRef = useRef(null);
  
  return (
    <div className={`flex flex-col h-full bg-black/40 rounded-lg border border-white/10 overflow-hidden ${isActive ? 'ring-1 ring-primary/50' : ''}`}>
      <div className="flex items-center justify-between px-2 py-1 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-gray-400" />
          <span className="text-[9px] text-gray-300 truncate max-w-[120px]">{url || 'No URL'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onAction('refresh')} className="p-0.5 hover:bg-white/10 rounded">
            <RefreshCw className="w-3 h-3 text-gray-400" />
          </button>
          <button onClick={() => onAction('close')} className="p-0.5 hover:bg-white/10 rounded">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        {url ? (
          <iframe 
            ref={iframeRef}
            src={url} 
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Globe className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-[10px]">No site loaded</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Queue Item ──────────────────────────────────────────────────────────
function TaskQueueItem({ task, onRun, onCancel }) {
  const statusColors = {
    pending: 'text-gray-400',
    running: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400'
  };
  
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10">
      <div className={`w-2 h-2 rounded-full ${task.status === 'running' ? 'bg-blue-400 animate-pulse' : task.status === 'completed' ? 'bg-green-400' : task.status === 'failed' ? 'bg-red-400' : 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-300 truncate">{task.description}</p>
        <p className="text-[8px] text-gray-500">{task.schedule || 'Manual'}</p>
      </div>
      {task.status === 'pending' ? (
        <button onClick={() => onRun(task.id)} className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30">
          <Play className="w-3 h-3" />
        </button>
      ) : task.status === 'running' ? (
        <button onClick={() => onCancel(task.id)} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
          <Pause className="w-3 h-3" />
        </button>
      ) : (
        <Check className={`w-3 h-3 ${statusColors[task.status]}`} />
      )}
    </div>
  );
}

// ── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, onClick, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/20 text-primary hover:bg-primary/30',
    success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg ${colors[color]} transition-all`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[8px] text-center leading-tight">{label}</span>
    </button>
  );
}

// ── Secrets Panel ────────────────────────────────────────────────────────────
function SecretsPanel({ secrets, onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newSecret, setNewSecret] = useState({ name: '', value: '', type: 'password' });
  const [showValues, setShowValues] = useState({});
  
  return (
    <div className="p-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Stored Credentials</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="text-[9px] text-primary hover:text-primary/80">
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>
      
      {showAdd && (
        <div className="space-y-2 mb-3 p-2 rounded bg-white/5">
          <input
            value={newSecret.name}
            onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
            placeholder="Site name (e.g. Shopify)"
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[10px]"
          />
          <input
            type={showValues['new'] ? 'text' : 'password'}
            value={newSecret.value}
            onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
            placeholder="API Key / Password"
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded text-[10px]"
          />
          <div className="flex gap-1">
            <button 
              onClick={() => { onAdd(newSecret); setShowAdd(false); setNewSecret({ name: '', value: '', type: 'password' }); }}
              className="flex-1 py-1 bg-primary/20 text-primary rounded text-[9px]"
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-1">
        {secrets.map(secret => (
          <div key={secret.id} className="flex items-center justify-between p-1.5 rounded bg-white/5">
            <span className="text-[9px] text-gray-300">{secret.name}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowValues({...showValues, [secret.id]: !showValues[secret.id]})}
                className="p-0.5 text-gray-400 hover:text-gray-300"
              >
                {showValues[secret.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button onClick={() => onDelete(secret.id)} className="p-0.5 text-gray-400 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function BusinessOperatorWindow() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserTabs, setBrowserTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [notes, setNotes] = useState([
    { id: 1, type: 'lead', text: 'Contact Alibaba Cloud rep about startup credits ($5K-15K available)', requiresApproval: true, timestamp: Date.now() },
    { id: 2, type: 'task', text: 'Send cold outreach emails to 50 potential partners', requiresApproval: false, timestamp: Date.now() - 86400000 },
    { id: 3, type: 'expense', text: 'Monthly Shopify: $79, Google Cloud: $45, Total: $124', requiresApproval: false, timestamp: Date.now() },
    { id: 4, type: 'grant', text: 'SBIR Phase I deadline approaching - auto-fill application?', requiresApproval: true, timestamp: Date.now() },
  ]);
  const [taskQueue, setTaskQueue] = useState([
    { id: 1, description: 'Check store analytics and optimize low performers', schedule: 'Daily 9 AM', status: 'pending' },
    { id: 2, description: 'Research new suppliers for trending products', schedule: 'Daily 2 PM', status: 'pending' },
    { id: 3, description: 'Send abandoned cart emails', schedule: 'Every 4 hours', status: 'pending' },
    { id: 4, description: 'Apply for startup credits (AWS, Azure, GCP)', schedule: 'Weekly Monday', status: 'pending' },
  ]);
  const [secrets, setSecrets] = useState([
    { id: 1, name: 'Shopify API', type: 'api_key' },
    { id: 2, name: 'Google Cloud', type: 'oauth' },
    { id: 3, name: 'Alibaba Cloud', type: 'api_key' },
  ]);
  const [businessMetrics, setBusinessMetrics] = useState({
    monthlyRevenue: 2847,
    monthlyExpenses: 124,
    profitMargin: 95.6,
    storeHealth: 87,
    pendingOrders: 12,
    abandonedCarts: 34
  });
  const [aiStatus, setAiStatus] = useState('idle');
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), message: 'Business Operator initialized', type: 'system' },
    { time: new Date().toLocaleTimeString(), message: 'Connected to AI providers', type: 'success' },
  ]);
  
  // ── Refs ───────────────────────────────────────────────────────────────────
  const commandInputRef = useRef(null);
  
  // ── Actions ────────────────────────────────────────────────────────────────
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { time: new Date().toLocaleTimeString(), message, type }]);
  };
  
  const handleCommand = async () => {
    if (!command.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setAiStatus('thinking');
    addLog(`User: ${command}`, 'user');
    
    // Simulate AI processing
    setTimeout(() => {
      setAiStatus('acting');
      
      // Parse command and act
      const cmd = command.toLowerCase();
      
      if (cmd.includes('shopify') || cmd.includes('store')) {
        addLog('Opening Shopify dashboard...', 'action');
        openBrowserTab('https://admin.shopify.com', 'Shopify');
      } else if (cmd.includes('google cloud') || cmd.includes('gcp')) {
        addLog('Opening Google Cloud Console...', 'action');
        openBrowserTab('https://console.cloud.google.com', 'Google Cloud');
      } else if (cmd.includes('alibaba')) {
        addLog('Opening Alibaba Cloud...', 'action');
        openBrowserTab('https://www.alibabacloud.com', 'Alibaba Cloud');
      } else if (cmd.includes('email') || cmd.includes('outreach')) {
        addLog('Preparing cold outreach campaign...', 'action');
        addNote('task', 'Draft 50 cold outreach emails for approval', true);
      } else if (cmd.includes('grant') || cmd.includes('sbir')) {
        addLog('Researching grant opportunities...', 'action');
        addNote('grant', 'SBIR Phase I auto-application ready for review', true);
      } else if (cmd.includes('product') || cmd.includes('find')) {
        addLog('Scanning for trending products...', 'action');
        addNote('strategy', 'AI found 3 trending products with 40%+ margin', true);
      } else {
        addLog(`Processing: ${command}`, 'info');
        addNote('task', `AI task: ${command}`, false);
      }
      
      setIsProcessing(false);
      setAiStatus('idle');
      setCommand('');
    }, 1500);
  };
  
  const openBrowserTab = (url, title) => {
    const newTab = { id: Date.now(), url, title, status: 'loading' };
    setBrowserTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    addLog(`Opened ${title}`, 'success');
  };
  
  const addNote = (type, text, requiresApproval = false) => {
    setNotes(prev => [{
      id: Date.now(),
      type,
      text,
      requiresApproval,
      timestamp: Date.now()
    }, ...prev]);
  };
  
  const updateNote = (id, text) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  };
  
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };
  
  const approveNote = (id) => {
    addLog(`Approved: ${notes.find(n => n.id === id)?.text.substring(0, 50)}...`, 'success');
    setNotes(prev => prev.map(n => n.id === id ? { ...n, requiresApproval: false, approved: true } : n));
  };
  
  const dismissNote = (id) => {
    deleteNote(id);
  };
  
  const runTask = (taskId) => {
    setTaskQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));
    addLog(`Started task: ${taskQueue.find(t => t.id === taskId)?.description}`, 'action');
    
    // Simulate task completion
    setTimeout(() => {
      setTaskQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      addLog(`Completed task: ${taskQueue.find(t => t.id === taskId)?.description}`, 'success');
    }, 3000);
  };
  
  const cancelTask = (taskId) => {
    setTaskQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t));
    addLog(`Cancelled task`, 'warning');
  };
  
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-gray-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0d0d1a]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Business Operator</h3>
            <p className="text-[9px] text-gray-500">AI-Powered Business Automation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] ${
            aiStatus === 'idle' ? 'bg-gray-500/20 text-gray-400' :
            aiStatus === 'thinking' ? 'bg-yellow-500/20 text-yellow-400' :
            aiStatus === 'acting' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
            'bg-green-500/20 text-green-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              aiStatus === 'idle' ? 'bg-gray-400' :
              aiStatus === 'thinking' ? 'bg-yellow-400' :
              aiStatus === 'acting' ? 'bg-blue-400' :
              'bg-green-400'
            }`} />
            {aiStatus === 'idle' ? 'Ready' : aiStatus === 'thinking' ? 'Thinking...' : aiStatus === 'acting' ? 'Acting...' : 'Active'}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Browser Tabs */}
        <div className="w-1/3 flex flex-col border-r border-white/10 p-2 gap-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active Sessions</div>
          {browserTabs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
              <Globe className="w-8 h-8 mb-2 opacity-20" />
              <span className="text-[9px]">No active sessions</span>
            </div>
          ) : (
            browserTabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-2 rounded cursor-pointer transition-all ${
                  activeTab === tab.id ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-300 truncate">{tab.title}</span>
                </div>
                <span className="text-[8px] text-gray-500 truncate">{tab.url}</span>
              </div>
            ))
          )}
          
          {/* Quick Open Buttons */}
          <div className="mt-auto grid grid-cols-2 gap-1">
            <QuickAction icon={Globe} label="Shopify" onClick={() => openBrowserTab('https://admin.shopify.com', 'Shopify')} color="success" />
            <QuickAction icon={Cloud} label="Google Cloud" onClick={() => openBrowserTab('https://console.cloud.google.com', 'Google Cloud')} />
            <QuickAction icon={Server} label="Alibaba" onClick={() => openBrowserTab('https://www.alibabacloud.com', 'Alibaba')} />
            <QuickAction icon={Database} label="Supabase" onClick={() => openBrowserTab('https://app.supabase.com', 'Supabase')} />
            <QuickAction icon={Mail} label="Gmail" onClick={() => openBrowserTab('https://gmail.com', 'Gmail')} color="warning" />
            <QuickAction icon={Calendar} label="Calendar" onClick={() => openBrowserTab('https://calendar.google.com', 'Calendar')} color="warning" />
          </div>
        </div>
        
        {/* Center: Post-It Notes */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
              <div className="text-[9px] text-green-400">Revenue</div>
              <div className="text-lg font-bold text-green-300">${businessMetrics.monthlyRevenue}</div>
              <div className="text-[8px] text-green-500/60">+12% this month</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <div className="text-[9px] text-blue-400">Store Health</div>
              <div className="text-lg font-bold text-blue-300">{businessMetrics.storeHealth}%</div>
              <div className="text-[8px] text-blue-500/60">Good standing</div>
            </div>
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
              <div className="text-[9px] text-purple-400">Pending</div>
              <div className="text-lg font-bold text-purple-300">{businessMetrics.pendingOrders}</div>
              <div className="text-[8px] text-purple-500/60">Orders to fulfill</div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Memo Board</span>
            <div className="flex gap-1">
              <button onClick={() => addNote('lead', 'New lead: ', true)} className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">+ Lead</button>
              <button onClick={() => addNote('task', 'New task: ', false)} className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">+ Task</button>
              <button onClick={() => addNote('grant', 'New grant: ', true)} className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">+ Grant</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {notes.map(note => (
              <PostItNote
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onApprove={approveNote}
                onDismiss={dismissNote}
              />
            ))}
          </div>
        </div>
        
        {/* Right: Task Queue & Logs */}
        <div className="w-64 flex flex-col border-l border-white/10 p-2">
          {/* Task Queue */}
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Task Queue</div>
          <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto scrollbar-thin">
            {taskQueue.map(task => (
              <TaskQueueItem
                key={task.id}
                task={task}
                onRun={runTask}
                onCancel={cancelTask}
              />
            ))}
          </div>
          
          {/* Pre-set Actions */}
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quick Actions</div>
          <div className="grid grid-cols-2 gap-1 mb-3">
            <button onClick={() => handleCommand({ preventDefault: () => {} }, 'Send mass email campaign')} className="p-1.5 rounded bg-primary/20 text-primary text-[8px] hover:bg-primary/30">
              Mass Email
            </button>
            <button onClick={() => handleCommand({ preventDefault: () => {} }, 'Post to social media')} className="p-1.5 rounded bg-blue-500/20 text-blue-400 text-[8px] hover:bg-blue-500/30">
              Social Post
            </button>
            <button onClick={() => handleCommand({ preventDefault: () => {} }, 'Apply for startup credits')} className="p-1.5 rounded bg-green-500/20 text-green-400 text-[8px] hover:bg-green-500/30">
              Get Credits
            </button>
            <button onClick={() => handleCommand({ preventDefault: () => {} }, 'Find trending products')} className="p-1.5 rounded bg-purple-500/20 text-purple-400 text-[8px] hover:bg-purple-500/30">
              Find Products
            </button>
          </div>
          
          {/* Secrets */}
          <SecretsPanel 
            secrets={secrets}
            onAdd={(s) => setSecrets([...secrets, { ...s, id: Date.now() }])}
            onDelete={(id) => setSecrets(secrets.filter(s => s.id !== id))}
          />
          
          {/* Logs */}
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-3 mb-1">Activity Log</div>
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin text-[8px] font-mono">
            {logs.map((log, i) => (
              <div key={i} className={`${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'action' ? 'text-blue-400' :
                log.type === 'user' ? 'text-primary' :
                'text-gray-500'
              }`}>
                <span className="opacity-50">{log.time}</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Command Bar */}
      <div className="p-3 border-t border-white/10 bg-[#0d0d1a]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400">
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </div>
          <div className="flex-1 relative">
            <input
              ref={commandInputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
              placeholder="Tell AI what to do: 'Open Shopify', 'Find trending products', 'Send outreach emails'..."
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
            />
            {isProcessing && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
          </div>
          <button 
            onClick={handleCommand}
            disabled={!command.trim() || isProcessing}
            className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[9px] text-gray-500">
          <span>Try:</span>
          <button onClick={() => setCommand('Check store analytics')} className="hover:text-primary">Check analytics</button>
          <span>•</span>
          <button onClick={() => setCommand('Apply for SBIR grant')} className="hover:text-primary">Apply for grant</button>
          <span>•</span>
          <button onClick={() => setCommand('Find partnership leads')} className="hover:text-primary">Find partners</button>
          <span>•</span>
          <button onClick={() => setCommand('Optimize product listings')} className="hover:text-primary">Optimize listings</button>
        </div>
      </div>
    </div>
  );
}
