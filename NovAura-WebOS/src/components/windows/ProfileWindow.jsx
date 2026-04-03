import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Shield, Monitor, HardDrive, Cpu, LogOut, Edit3, Save, Zap, Server, RefreshCw, CheckCircle2, XCircle, Loader2, Settings2, Radio } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { kernelStorage } from '../../kernel/kernelStorage.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TASK CATEGORIES — what users assign AI providers to
// ═══════════════════════════════════════════════════════════════════════════════

const TASK_CATEGORIES = [
  { id: 'conversations', label: 'Conversations', desc: 'Chat, Q&A, general dialogue', icon: '💬' },
  { id: 'coding', label: 'Coding', desc: 'Code generation, debugging, IDE', icon: '💻' },
  { id: 'website-building', label: 'Website Building', desc: 'Site generation, templates', icon: '🌐' },
  { id: 'creative-writing', label: 'Creative Writing', desc: 'Stories, poems, scripts', icon: '✍️' },
  { id: 'image-generation', label: 'Image Generation', desc: 'AI art, backgrounds', icon: '🎨' },
  { id: 'general', label: 'General / Fallback', desc: 'Everything else', icon: '⚡' },
];

const PROVIDER_OPTIONS = [
  { id: 'auto', label: 'Auto (best available)' },
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'lmstudio', label: 'LM Studio (Local)' },
  { id: 'gemini', label: 'Gemini (Cloud)' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS TABS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'ai', label: 'AI Providers', icon: Cpu },
  { id: 'routing', label: 'Task Routing', icon: Radio },
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'storage', label: 'Storage', icon: HardDrive },
];

export default function ProfileWindow() {
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);

  // ── User data ──
  const storedUser = (() => {
    try { return JSON.parse(kernelStorage.getItem('user_data') || '{}'); } catch { return {}; }
  })();

  const [name, setName] = useState(storedUser.name || 'User');
  const [email] = useState(storedUser.email || 'user@novaura.life');
  
  // ── Subscription tier (1=Free, 2=Creator, 3=Studio, 4=Catalyst) ──
  const userTier = storedUser.membershipTier || 'free';
  const tierNumber = { free: 1, creator: 2, studio: 3, catalyst: 4 }[userTier] || 1;
  const canUseBYOK = tierNumber >= 3; // Tier 3+ only

  // ── LLM config ──
  const loadConfig = () => {
    try { return JSON.parse(kernelStorage.getItem('llm_config') || '{}'); } catch { return {}; }
  };

  const [llmConfig, setLlmConfig] = useState(loadConfig);

  // ── Provider endpoints ──
  const [ollamaUrl, setOllamaUrl] = useState(llmConfig.ollamaUrl || 'http://localhost:11434');
  const [lmstudioUrl, setLmstudioUrl] = useState(llmConfig.lmstudioUrl || 'http://localhost:1234');
  const [ollamaStatus, setOllamaStatus] = useState(null); // null | 'checking' | 'connected' | 'error'
  const [lmstudioStatus, setLmstudioStatus] = useState(null);
  const [ollamaModels, setOllamaModels] = useState(llmConfig.ollamaModels || []);
  const [lmstudioModels, setLmstudioModels] = useState(llmConfig.lmstudioModels || []);
  
  // ── BYOK (Bring Your Own Keys) - Tier 3+ only ──
  const [huggingfaceKey, setHuggingfaceKey] = useState(llmConfig.huggingfaceKey || '');
  const [kimiKey, setKimiKey] = useState(llmConfig.kimiKey || '');
  const [qwenConfigured, setQwenConfigured] = useState(llmConfig.qwenConfigured || false);

  // ── Task routing ──
  const defaultRouting = {};
  TASK_CATEGORIES.forEach(t => { defaultRouting[t.id] = { provider: 'auto', model: '' }; });
  const [taskRouting, setTaskRouting] = useState(llmConfig.taskRouting || defaultRouting);

  // ── System toggles ──
  const [webgpuEnabled, setWebgpuEnabled] = useState(llmConfig.webgpuEnabled !== false);
  const [webgpuAvailable] = useState(!!navigator.gpu);

  // ── Persist config on change ──
  const saveConfig = useCallback((overrides = {}) => {
    const config = {
      ...llmConfig,
      ollamaUrl,
      lmstudioUrl,
      ollamaModels,
      lmstudioModels,
      taskRouting,
      webgpuEnabled,
      // Keep legacy fields for backward compat
      useLocalLLM: ollamaStatus === 'connected' || lmstudioStatus === 'connected' || llmConfig.useLocalLLM,
      localLLMUrl: llmConfig.localLLMUrl || lmstudioUrl,
      directBrowserConnection: true,
      ...overrides,
    };
    kernelStorage.setItem('llm_config', JSON.stringify(config));
    setLlmConfig(config);
  }, [llmConfig, ollamaUrl, lmstudioUrl, ollamaModels, lmstudioModels, taskRouting, webgpuEnabled, ollamaStatus, lmstudioStatus]);

  // ── Test provider connection ──
  const testProvider = async (type) => {
    const url = (type === 'ollama' ? ollamaUrl : lmstudioUrl).replace(/\/$/, '');
    const setStatus = type === 'ollama' ? setOllamaStatus : setLmstudioStatus;
    const setModels = type === 'ollama' ? setOllamaModels : setLmstudioModels;

    setStatus('checking');

    try {
      const endpoint = type === 'ollama' ? `${url}/api/tags` : `${url}/v1/models`;
      const resp = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(6000) });

      if (resp.ok) {
        const data = await resp.json();
        let models = [];
        if (type === 'ollama') {
          models = (data.models || []).map(m => m.name || 'unknown');
        } else {
          models = (data.data || []).map(m => m.id || 'unknown');
        }
        setModels(models);
        setStatus('connected');

        // Save immediately
        const key = type === 'ollama' ? 'ollamaModels' : 'lmstudioModels';
        saveConfig({ [key]: models });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  // ── Save user profile ──
  const handleSave = () => {
    const updatedUser = { ...storedUser, name };
    kernelStorage.setItem('user_data', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleLogout = () => {
    kernelStorage.removeItem('auth_token');
    kernelStorage.removeItem('user_data');
    kernelStorage.removeItem('llm_config');
    window.location.reload();
  };

  // ── Update routing for a task ──
  const updateRouting = (taskId, field, value) => {
    setTaskRouting(prev => {
      const updated = { ...prev, [taskId]: { ...prev[taskId], [field]: value } };
      // Persist immediately
      const config = { ...llmConfig, taskRouting: updated };
      kernelStorage.setItem('llm_config', JSON.stringify(config));
      setLlmConfig(config);
      return updated;
    });
  };

  // ── Save BYOK keys to backend (secure storage) ──
  const saveBYOKKeys = async (keys) => {
    try {
      const token = kernelStorage.getItem('novaura-auth-token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/byok-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(keys),
      });
      if (!res.ok) throw new Error('Failed to save API keys');
      // Also save locally for UI state (keys are encrypted on backend)
      saveConfig(keys);
      return true;
    } catch (err) {
      console.error('Failed to save BYOK keys:', err);
      // Fallback: save to localStorage for now (will be migrated)
      saveConfig(keys);
      return false;
    }
  };

  // ── Toggle WebGPU ──
  const toggleWebGPU = () => {
    const next = !webgpuEnabled;
    setWebgpuEnabled(next);
    saveConfig({ webgpuEnabled: next });
  };

  // ── Get all available models for a provider ──
  const getModelsForProvider = (providerId) => {
    if (providerId === 'ollama') return ollamaModels;
    if (providerId === 'lmstudio') return lmstudioModels;
    return [];
  };

  // ── Status badge ──
  const StatusBadge = ({ status }) => {
    if (status === 'checking') return <Badge variant="outline" className="text-[10px]"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Testing...</Badge>;
    if (status === 'connected') return <Badge className="bg-success/20 text-success border-success/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>;
    if (status === 'error') return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">Not tested</Badge>;
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-window-bg to-window-header">
      {/* Sidebar Tabs */}
      <div className="w-40 border-r border-primary/10 bg-black/20 py-3 px-2 space-y-0.5 shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${activeTab === tab.id ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}

        {/* Logout at bottom */}
        <div className="pt-4 mt-4 border-t border-primary/10">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ════════════ ACCOUNT TAB ════════════ */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_30px_rgba(0,217,255,0.3)]">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 bg-window-bg border-primary/30 text-sm" />
                    <Button size="sm" onClick={handleSave} className="h-8 bg-primary hover:bg-primary/90">
                      <Save className="w-3 h-3 mr-1" />Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{name}</h2>
                    <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />{email}
                </p>
              </div>
            </div>

            <Card className="p-4 border-primary/15 bg-window-bg">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />Account
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Free</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-foreground text-xs">2025</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════ AI PROVIDERS TAB ════════════ */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-foreground">AI Provider Endpoints</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Connect multiple AI backends. Assign them to tasks in the Task Routing tab.</p>
            </div>

            {/* Gemini (Cloud) */}
            <Card className="p-4 border-primary/15 bg-window-bg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">☁️</div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Gemini AI (Cloud)</div>
                    <div className="text-[10px] text-muted-foreground">Google's Gemini via backend</div>
                  </div>
                </div>
                <Badge className={llmConfig.geminiConfigured ? 'bg-success/20 text-success border-success/30 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                  {llmConfig.geminiConfigured ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
            </Card>

            {/* Ollama */}
            <Card className="p-4 border-primary/15 bg-window-bg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">🦙</div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Ollama</div>
                    <div className="text-[10px] text-muted-foreground">Local LLM — great for conversations</div>
                  </div>
                </div>
                <StatusBadge status={ollamaStatus} />
              </div>
              <div className="flex gap-2">
                <Input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434" className="flex-1 h-8 bg-black/30 border-primary/20 text-xs" />
                <Button size="sm" onClick={() => testProvider('ollama')} disabled={ollamaStatus === 'checking'} className="h-8 bg-green-700/50 hover:bg-green-600/50 text-xs">
                  <RefreshCw className={`w-3 h-3 mr-1 ${ollamaStatus === 'checking' ? 'animate-spin' : ''}`} />Test
                </Button>
              </div>
              {ollamaModels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Models:</span>
                  {ollamaModels.slice(0, 6).map((m, i) => <Badge key={i} variant="secondary" className="text-[9px]">{m}</Badge>)}
                  {ollamaModels.length > 6 && <Badge variant="secondary" className="text-[9px]">+{ollamaModels.length - 6}</Badge>}
                </div>
              )}
            </Card>

            {/* LM Studio */}
            <Card className="p-4 border-primary/15 bg-window-bg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg">🧠</div>
                  <div>
                    <div className="text-sm font-medium text-foreground">LM Studio</div>
                    <div className="text-[10px] text-muted-foreground">Local LLM — great for coding & building</div>
                  </div>
                </div>
                <StatusBadge status={lmstudioStatus} />
              </div>
              <div className="flex gap-2">
                <Input value={lmstudioUrl} onChange={(e) => setLmstudioUrl(e.target.value)}
                  placeholder="http://localhost:1234" className="flex-1 h-8 bg-black/30 border-primary/20 text-xs" />
                <Button size="sm" onClick={() => testProvider('lmstudio')} disabled={lmstudioStatus === 'checking'} className="h-8 bg-purple-700/50 hover:bg-purple-600/50 text-xs">
                  <RefreshCw className={`w-3 h-3 mr-1 ${lmstudioStatus === 'checking' ? 'animate-spin' : ''}`} />Test
                </Button>
              </div>
              {lmstudioModels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Models:</span>
                  {lmstudioModels.slice(0, 6).map((m, i) => <Badge key={i} variant="secondary" className="text-[9px]">{m}</Badge>)}
                  {lmstudioModels.length > 6 && <Badge variant="secondary" className="text-[9px]">+{lmstudioModels.length - 6}</Badge>}
                </div>
              )}
            </Card>

            {/* BYOK Section - Tier 3+ only */}
            {canUseBYOK ? (
              <>
                <div className="pt-4 border-t border-primary/10">
                  <h4 className="text-xs font-semibold text-foreground mb-1">🎁 Premium BYOK Providers (Tier {tierNumber})</h4>
                  <p className="text-[10px] text-muted-foreground mb-3">Bring Your Own Keys - Use your own API keys for premium providers</p>
                </div>

                {/* Qwen 3.5 Flash */}
                <Card className="p-4 border-primary/15 bg-window-bg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-lg">⚡</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Qwen 3.5 Flash</div>
                        <div className="text-[10px] text-muted-foreground">Alibaba's fast inference model</div>
                      </div>
                    </div>
                    <Badge className={qwenConfigured ? 'bg-success/20 text-success border-success/30 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                      {qwenConfigured ? 'Enabled' : 'Not configured'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Use your own Qwen API key</span>
                    <Button size="sm" onClick={async () => { 
                      const newVal = !qwenConfigured; 
                      setQwenConfigured(newVal); 
                      await saveBYOKKeys({ qwenConfigured: newVal }); 
                    }} className="h-8 bg-orange-700/50 hover:bg-orange-600/50 text-xs">
                      {qwenConfigured ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </Card>

                {/* Hugging Face */}
                <Card className="p-4 border-primary/15 bg-window-bg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-lg">🤗</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Hugging Face</div>
                        <div className="text-[10px] text-muted-foreground">Community models hub</div>
                      </div>
                    </div>
                    <Badge className={huggingfaceKey ? 'bg-success/20 text-success border-success/30 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                      {huggingfaceKey ? 'Configured' : 'Not configured'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={huggingfaceKey} 
                      onChange={(e) => setHuggingfaceKey(e.target.value)}
                      type="password"
                      placeholder="hf_... API key" 
                      className="flex-1 h-8 bg-black/30 border-primary/20 text-xs" 
                    />
                    <Button size="sm" onClick={() => saveBYOKKeys({ huggingfaceKey })} className="h-8 bg-yellow-700/50 hover:bg-yellow-600/50 text-xs">
                      <Save className="w-3 h-3 mr-1" />Save
                    </Button>
                  </div>
                </Card>

                {/* Kimi */}
                <Card className="p-4 border-primary/15 bg-window-bg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-lg">🌙</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Kimi</div>
                        <div className="text-[10px] text-muted-foreground">Moonshot AI — long context specialist</div>
                      </div>
                    </div>
                    <Badge className={kimiKey ? 'bg-success/20 text-success border-success/30 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                      {kimiKey ? 'Configured' : 'Not configured'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={kimiKey} 
                      onChange={(e) => setKimiKey(e.target.value)}
                      type="password"
                      placeholder="Kimi API key" 
                      className="flex-1 h-8 bg-black/30 border-primary/20 text-xs" 
                    />
                    <Button size="sm" onClick={() => saveBYOKKeys({ kimiKey })} className="h-8 bg-red-700/50 hover:bg-red-600/50 text-xs">
                      <Save className="w-3 h-3 mr-1" />Save
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-4 border-primary/15 bg-window-bg/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">🔒</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Premium AI Providers</div>
                    <div className="text-[10px] text-muted-foreground">Qwen, Hugging Face, Kimi BYOK — Tier 3+ only</div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    Upgrade
                  </Button>
                </div>
              </Card>
            )}

            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-[10px] text-cyan-300/80">
                <strong>Direct Browser Connection:</strong> Your browser talks directly to local LLM servers — no cloud routing. Data stays on your machine.
              </p>
            </div>
          </div>
        )}

        {/* ════════════ TASK ROUTING TAB ════════════ */}
        {activeTab === 'routing' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-foreground">Task Routing</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Assign which AI provider handles each type of task. Run Ollama for conversations and LM Studio for coding — or however you like it.</p>
            </div>

            {TASK_CATEGORIES.map(task => {
              const routing = taskRouting[task.id] || { provider: 'auto', model: '' };
              const models = getModelsForProvider(routing.provider);

              return (
                <Card key={task.id} className="p-3 border-primary/15 bg-window-bg">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{task.label}</div>
                      <div className="text-[10px] text-muted-foreground mb-2">{task.desc}</div>

                      <div className="flex gap-2">
                        {/* Provider select */}
                        <select
                          value={routing.provider}
                          onChange={(e) => updateRouting(task.id, 'provider', e.target.value)}
                          className="flex-1 h-7 rounded bg-black/40 border border-primary/20 text-[11px] text-foreground px-2 focus:outline-none focus:border-primary/50"
                        >
                          {PROVIDER_OPTIONS.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>

                        {/* Model select (if provider has models) */}
                        {models.length > 0 && (
                          <select
                            value={routing.model || ''}
                            onChange={(e) => updateRouting(task.id, 'model', e.target.value)}
                            className="flex-1 h-7 rounded bg-black/40 border border-primary/20 text-[11px] text-foreground px-2 focus:outline-none focus:border-primary/50"
                          >
                            <option value="">Default model</option>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[10px] text-amber-300/80">
                <strong>Auto mode</strong> tries your local providers first, then falls back to Gemini. Set specific providers per task for full control.
              </p>
            </div>
          </div>
        )}

        {/* ════════════ SYSTEM TAB ════════════ */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-foreground">System Settings</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hardware acceleration, display, and platform info.</p>
            </div>

            {/* WebGPU Toggle */}
            <Card className="p-4 border-primary/15 bg-window-bg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">WebGPU Acceleration</div>
                    <div className="text-[10px] text-muted-foreground">
                      {webgpuAvailable ? 'Hardware GPU acceleration for AI inference & rendering' : 'Not supported on this browser/device'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleWebGPU}
                  disabled={!webgpuAvailable}
                  className={`relative w-11 h-6 rounded-full transition-all ${webgpuEnabled && webgpuAvailable ? 'bg-primary' : 'bg-muted/40'} ${!webgpuAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${webgpuEnabled && webgpuAvailable ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {webgpuEnabled && webgpuAvailable && (
                <div className="mt-3 p-2 rounded bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-amber-300/70">WebGPU enabled — local AI models can use your GPU for faster inference. Requires compatible models (GGUF w/ GPU layers).</p>
                </div>
              )}
            </Card>

            {/* Display Info */}
            <Card className="p-4 border-primary/15 bg-window-bg">
              <h4 className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-accent" />Display & Platform
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Resolution</span>
                  <span className="text-foreground text-xs">{window.innerWidth} x {window.innerHeight}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Device Pixel Ratio</span>
                  <span className="text-foreground text-xs">{window.devicePixelRatio}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Platform</span>
                  <span className="text-foreground text-xs">{navigator.platform}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Device Memory</span>
                  <span className="text-foreground text-xs">{navigator.deviceMemory || '?'} GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">CPU Cores</span>
                  <span className="text-foreground text-xs">{navigator.hardwareConcurrency || '?'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">WebGPU</span>
                  <Badge variant="outline" className="text-[10px]">{webgpuAvailable ? 'Available' : 'Not supported'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Network</span>
                  <Badge variant="outline" className={`text-[10px] ${navigator.onLine ? 'text-success' : 'text-destructive'}`}>
                    {navigator.onLine ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Version Info */}
            <Card className="p-4 border-primary/15 bg-window-bg">
              <h4 className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-primary" />About
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">novaura systems</span>
                  <span className="text-foreground text-xs">v0.1.0-alpha</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Runtime</span>
                  <span className="text-foreground text-xs">Vite + React</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════ STORAGE TAB ════════════ */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-foreground">Storage</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Local browser storage usage.</p>
            </div>

            <Card className="p-4 border-primary/15 bg-window-bg">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Local Storage</span>
                  <span className="text-foreground text-xs">
                    {(() => { try { return (new Blob(Object.values(localStorage)).size / 1024).toFixed(1); } catch { return '?'; } })()} KB used
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: '12%' }} />
                </div>

                {/* Storage breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-primary/10">
                  <div className="text-[10px] text-muted-foreground mb-1">BREAKDOWN</div>
                  {Object.keys(localStorage).sort().map(key => {
                    const size = new Blob([kernelStorage.getItem(key) || '']).size;
                    return (
                      <div key={key} className="flex justify-between items-center text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[180px]">{key}</span>
                        <span className="text-foreground">{size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`}</span>
                      </div>
                    );
                  })}
                </div>

                <Button variant="ghost" size="sm" className="w-full text-xs text-destructive/60 hover:text-destructive hover:bg-destructive/10 mt-2"
                  onClick={() => {
                    if (confirm('Clear all cached data? (You will NOT be logged out)')) {
                      const token = kernelStorage.getItem('auth_token');
                      const user = kernelStorage.getItem('user_data');
                      const config = kernelStorage.getItem('llm_config');
                      kernelStorage.clear();
                      if (token) kernelStorage.setItem('auth_token', token);
                      if (user) kernelStorage.setItem('user_data', user);
                      if (config) kernelStorage.setItem('llm_config', config);
                      window.location.reload();
                    }
                  }}>
                  Clear Cached Data
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
