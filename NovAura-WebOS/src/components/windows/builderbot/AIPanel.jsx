import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, Trash2, Settings, ChevronDown, ChevronRight,
  Plus, X, Check, User, Bot, Sparkles, Shield, BookOpen,
  Wand2, Code2, Copy, CheckCheck, FileCode, Cloud, Cpu,
  Globe, Zap, RefreshCw, SlidersHorizontal,
} from 'lucide-react';
import useBuilderStore from './useBuilderStore';
import { chatCloud, chatLocal, generateCode, resolveProvider, probeOllama, getProviderStatus } from '../../../services/aiService';
import PipelinePanel from './PipelinePanel';
import AIAdjusters from './AIAdjusters';

// ── Code block renderer with copy + apply ───────────────────
function CodeBlock({ code, filename, language, onApply }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 text-[10px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <FileCode className="w-3 h-3" />
          {filename || language || 'code'}
        </span>
        <div className="flex items-center gap-1">
          {filename && (
            <button onClick={() => onApply(filename, code)} className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
              <Wand2 className="w-3 h-3" /> Apply
            </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
            {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <pre className="p-3 text-[11px] leading-relaxed overflow-x-auto bg-black/30 text-gray-300 font-mono">
        {code}
      </pre>
    </div>
  );
}

// ── Message renderer ────────────────────────────────────────
function MessageContent({ text, onApplyCode }) {
  // Parse text for code blocks
  const parts = [];
  let lastIndex = 0;
  const regex = /```(\S*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const label = match[1];
    const code = match[2].trim();

    // Determine if label is a filename or language
    const hasExtension = /\.\w+$/.test(label);
    parts.push({
      type: 'code',
      filename: hasExtension ? label : null,
      language: hasExtension ? null : label,
      code,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return (
    <div className="text-xs leading-relaxed">
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <CodeBlock key={i} code={part.code} filename={part.filename} language={part.language} onApply={onApplyCode} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">{part.content}</span>
        )
      )}
    </div>
  );
}

// ── Mode definitions for display ─────────────────────────────
const MODES = [
  { id: 'architect', name: 'Architect', icon: '🏗️', color: 'text-amber-400' },
  { id: 'coder', name: 'Full-Stack', icon: '⚡', color: 'text-primary', default: true },
  { id: 'creative', name: 'Creative', icon: '🎨', color: 'text-pink-400' },
  { id: 'debugger', name: 'Debugger', icon: '🔍', color: 'text-red-400' },
  { id: 'rapid', name: 'Rapid', icon: '🚀', color: 'text-green-400' },
];

const RESTRICTION_LABELS = {
  strict: { label: 'Strict', color: 'text-green-400' },
  moderate: { label: 'Moderate', color: 'text-yellow-400' },
  lenient: { label: 'Lenient', color: 'text-orange-400' },
  unrestricted: { label: 'Off', color: 'text-red-400' },
};

// ── Rules panel ─────────────────────────────────────────────
function RulesPanel({ onClose }) {
  const { rules, toggleRule, addRule, removeRule } = useBuilderStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRule, setNewRule] = useState('');

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1a1a2e] border border-white/10 rounded-lg max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Cascading Rules
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-[10px] text-gray-500">Enabled rules are injected into every AI generation as constraints.</p>

      {rules.map((r) => (
        <div key={r.id} className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
          r.enabled ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/5 opacity-60'
        }`}>
          <button onClick={() => toggleRule(r.id)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            r.enabled ? 'border-primary bg-primary/30 text-primary' : 'border-white/20'
          }`}>
            {r.enabled && <Check className="w-2.5 h-2.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-gray-200">{r.name}</span>
            <p className="text-[10px] text-gray-400 mt-0.5">{r.rule}</p>
          </div>
          <button onClick={() => removeRule(r.id)} className="text-gray-500 hover:text-red-400 shrink-0"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 p-2 border border-white/10 rounded-lg bg-white/5">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rule name" className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-gray-300 outline-none" />
          <textarea value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Rule description..." className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-gray-300 outline-none min-h-[40px] resize-y" />
          <div className="flex gap-1">
            <button onClick={() => {
              if (newName.trim() && newRule.trim()) {
                addRule({ name: newName, rule: newRule, enabled: true });
                setNewName(''); setNewRule(''); setAdding(false);
              }
            }} className="flex-1 text-[10px] bg-primary/20 text-primary rounded py-1 hover:bg-primary/30">Add</button>
            <button onClick={() => setAdding(false)} className="flex-1 text-[10px] bg-white/5 text-gray-400 rounded py-1 hover:bg-white/10">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary py-1.5 px-2 rounded hover:bg-white/5">
          <Plus className="w-3 h-3" /> Add Rule
        </button>
      )}
    </div>
  );
}

// ── Preprompt editor ────────────────────────────────────────
function PrepromptEditor({ onClose }) {
  const { preprompt, setPreprompt } = useBuilderStore();

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1a1a2e] border border-white/10 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Preprompt
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-[10px] text-gray-500">Additional context injected before every message. Project files are automatically included.</p>
      <textarea
        value={preprompt}
        onChange={(e) => setPreprompt(e.target.value)}
        placeholder="e.g. 'This project uses Tailwind CSS. All components should be accessible. Use TypeScript types...'"
        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[11px] text-gray-300 outline-none min-h-[80px] resize-y"
      />
    </div>
  );
}

// ── Provider selector ───────────────────────────────────────
const CLOUD_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', color: 'text-blue-400', desc: 'Google Gemini (via backend)' },
  { id: 'claude', name: 'Claude', color: 'text-orange-400', desc: 'Anthropic Claude (via backend)' },
  { id: 'openai', name: 'OpenAI', color: 'text-green-400', desc: 'GPT models (via backend)' },
  { id: 'kimi', name: 'Kimi', color: 'text-purple-400', desc: 'Moonshot Kimi (via backend)' },
];

const LOCAL_PROVIDERS = [
  { id: 'ollama', name: 'Ollama', color: 'text-cyan-400', desc: 'Local Ollama server', defaultUrl: 'http://localhost:11434' },
  { id: 'lmstudio', name: 'LM Studio', color: 'text-yellow-400', desc: 'Local LM Studio', defaultUrl: 'http://localhost:1234' },
];

function ProviderSelector({ selectedProvider, onSelect, onClose }) {
  const [cloudStatus, setCloudStatus] = useState({});
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [localUrl, setLocalUrl] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('');
  const [probing, setProbing] = useState(false);

  // Probe cloud providers on mount
  useEffect(() => {
    getProviderStatus().then(setCloudStatus).catch(() => {});
  }, []);

  // Probe Ollama on mount
  useEffect(() => {
    handleProbeOllama();
  }, []);

  const handleProbeOllama = async () => {
    setProbing(true);
    try {
      const result = await probeOllama(localUrl);
      setOllamaConnected(result.connected);
      setOllamaModels(result.models || []);
      if (result.models?.length > 0 && !selectedModel) {
        setSelectedModel(result.models[0]);
      }
    } catch {
      setOllamaConnected(false);
      setOllamaModels([]);
    }
    setProbing(false);
  };

  const handleSelect = (type, providerId, model, url) => {
    onSelect({ type, provider: providerId, model: model || '', url: url || '' });
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1a1a2e] border border-white/10 rounded-lg max-h-[450px] overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> AI Provider
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Auto mode */}
      <button
        onClick={() => handleSelect('auto', 'auto', '', '')}
        className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          selectedProvider?.type === 'auto' ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5 hover:border-white/15'
        }`}
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <div>
          <div className="text-[11px] font-medium text-gray-200">Auto (Smart Routing)</div>
          <div className="text-[10px] text-gray-500">Uses your LLM config — tries local first, falls back to cloud</div>
        </div>
        {selectedProvider?.type === 'auto' && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
      </button>

      {/* Cloud providers */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2 flex items-center gap-1.5">
        <Cloud className="w-3 h-3" /> Cloud Providers
      </div>
      {CLOUD_PROVIDERS.map((p) => {
        const available = cloudStatus[p.id];
        const isSelected = selectedProvider?.type === 'cloud' && selectedProvider?.provider === p.id;
        return (
          <button
            key={p.id}
            onClick={() => handleSelect('cloud', p.id, '', '')}
            className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
              isSelected ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5 hover:border-white/15'
            }`}
          >
            <Globe className={`w-4 h-4 ${p.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-200 flex items-center gap-1.5">
                {p.name}
                {available !== undefined && (
                  <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-400' : 'bg-red-400'}`} />
                )}
              </div>
              <div className="text-[10px] text-gray-500">{p.desc}</div>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </button>
        );
      })}

      {/* Local providers */}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2 flex items-center gap-1.5">
        <Cpu className="w-3 h-3" /> Local Providers
      </div>

      {/* Ollama */}
      <div className={`p-2 rounded-lg border transition-all ${
        selectedProvider?.type === 'local' && selectedProvider?.provider === 'ollama'
          ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5'
      }`}>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] font-medium text-gray-200 flex items-center gap-1.5">
              Ollama
              <span className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {ollamaConnected && <span className="text-[9px] text-gray-500">{ollamaModels.length} models</span>}
            </div>
          </div>
          <button onClick={handleProbeOllama} className="text-gray-500 hover:text-primary p-0.5" title="Refresh">
            <RefreshCw className={`w-3 h-3 ${probing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <input
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 outline-none"
          />
          <button onClick={handleProbeOllama} className="text-[10px] px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30">
            Connect
          </button>
        </div>

        {ollamaModels.length > 0 && (
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
            {ollamaModels.map((model) => (
              <button
                key={model}
                onClick={() => {
                  setSelectedModel(model);
                  handleSelect('local', 'ollama', model, localUrl);
                }}
                className={`w-full text-left text-[10px] px-2 py-1 rounded transition-colors ${
                  selectedProvider?.model === model && selectedProvider?.provider === 'ollama'
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        )}

        {!ollamaConnected && (
          <p className="text-[10px] text-gray-500 mt-1.5">Not connected. Start Ollama and click Connect.</p>
        )}
      </div>

      {/* LM Studio */}
      <button
        onClick={() => handleSelect('local', 'lmstudio', 'local-model', 'http://localhost:1234')}
        className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
          selectedProvider?.type === 'local' && selectedProvider?.provider === 'lmstudio'
            ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5 hover:border-white/15'
        }`}
      >
        <Cpu className="w-4 h-4 text-yellow-400 shrink-0" />
        <div className="flex-1">
          <div className="text-[11px] font-medium text-gray-200">LM Studio</div>
          <div className="text-[10px] text-gray-500">OpenAI-compatible local server on :1234</div>
        </div>
        {selectedProvider?.type === 'local' && selectedProvider?.provider === 'lmstudio' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
      </button>
    </div>
  );
}

// ── Main AI Panel ───────────────────────────────────────────
export default function AIPanel() {
  const {
    chatHistory, addChatMessage, clearChat, aiLoading, setAiLoading,
    aiConfig, buildSystemPrompt, parseCodeBlocks, applyCodeBlocks,
    flattenFiles, findNode, updateFileContent, saveFile, openFile,
  } = useBuilderStore();

  const [mode, setMode] = useState('chat'); // 'chat' | 'pipeline'
  const [input, setInput] = useState('');
  const [showAdjusters, setShowAdjusters] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showPreprompt, setShowPreprompt] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState({ type: 'auto', provider: 'auto', model: '', url: '' });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory]);

  const currentMode = MODES.find(m => m.id === (aiConfig?.mode || 'coder'));
  const restrictionInfo = RESTRICTION_LABELS[aiConfig?.restrictionLevel || 'moderate'];

  // Build conversation array for the API
  const buildConversation = () => {
    return chatHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
  };

  // Apply a single code block to the project
  const handleApplyCode = (filename, code) => {
    const files = flattenFiles();
    const existing = files.find((f) => f.name === filename || f.path?.endsWith(filename));
    if (existing) {
      updateFileContent(existing.id, code);
      saveFile(existing.id);
      openFile(existing.id);
    } else {
      // Create the file and fill it
      const { createFile, tree } = useBuilderStore.getState();
      createFile('root', filename, 'file');
      // Grab the newly created file
      const updated = useBuilderStore.getState().flattenFiles();
      const newFile = updated.find((f) => f.name === filename);
      if (newFile) {
        updateFileContent(newFile.id, code);
        saveFile(newFile.id);
        openFile(newFile.id);
      }
    }
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || aiLoading) return;

    setInput('');
    addChatMessage({ role: 'user', text: msg, timestamp: Date.now() });
    setAiLoading(true);

    try {
      const systemPrompt = buildSystemPrompt();
      const conversation = buildConversation();

      // Resolve provider — use explicit selection or fall back to smart routing
      let resolved;
      if (selectedProvider.type === 'auto') {
        const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}');
        resolved = resolveProvider('coding', llmConfig);
      } else if (selectedProvider.type === 'cloud') {
        resolved = { type: 'cloud', provider: selectedProvider.provider, model: selectedProvider.model };
      } else {
        resolved = {
          type: 'local',
          localType: selectedProvider.provider,
          url: selectedProvider.url,
          model: selectedProvider.model,
        };
      }

      let result;
      const temperature = aiConfig?.temperature ?? 0.5;

      // Check if user is asking to generate/build something → use builder endpoint
      const isBuildRequest = /^(build|create|generate|make|write|scaffold|implement|code)\b/i.test(msg);

      if (isBuildRequest && resolved.type === 'cloud') {
        const files = flattenFiles();
        result = await generateCode(msg, {
          provider: resolved.provider,
          model: resolved.model,
          files: files.map((f) => ({ path: f.path, content: f.content })),
          maxTokens: 4096,
        });
        result.response = result.code || result.html || 'No code generated.';
      } else if (resolved.type === 'local') {
        result = await chatLocal(msg, {
          url: resolved.url,
          type: resolved.localType,
          model: resolved.model,
          systemPrompt,
          conversation,
          temperature,
          maxTokens: 4096,
        });
      } else {
        result = await chatCloud(msg, {
          provider: resolved.provider,
          model: resolved.model,
          maxTokens: 4096,
          temperature,
          conversation: [
            { role: 'system', content: systemPrompt },
            ...conversation,
          ],
        });
      }

      const responseText = result.response || result.code || 'No response.';
      addChatMessage({
        role: 'assistant',
        text: responseText,
        timestamp: Date.now(),
        source: result.source || result.model || `${resolved.provider || 'ai'}${resolved.model ? ` (${resolved.model})` : ''}`,
      });
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        text: `Error: ${err.message}\n\nMake sure you have an AI provider configured — select one from the Provider panel above, or set up Ollama/LM Studio locally.`,
        timestamp: Date.now(),
        error: true,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Pipeline mode — render the pipeline panel instead of chat
  if (mode === 'pipeline') {
    return (
      <div className="flex flex-col h-full bg-[#12121e]">
        {/* Mode tabs */}
        <div className="flex items-center border-b border-white/10">
          <button onClick={() => setMode('chat')} className="flex-1 text-[10px] py-1.5 text-gray-500 hover:text-gray-300 transition-colors border-b-2 border-transparent">
            Chat
          </button>
          <button onClick={() => setMode('pipeline')} className="flex-1 text-[10px] py-1.5 text-amber-400 font-medium border-b-2 border-amber-400">
            Pipeline
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <PipelinePanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#12121e]">
      {/* Mode tabs */}
      <div className="flex items-center border-b border-white/10">
        <button onClick={() => setMode('chat')} className="flex-1 text-[10px] py-1.5 text-primary font-medium border-b-2 border-primary">
          Chat
        </button>
        <button onClick={() => setMode('pipeline')} className="flex-1 text-[10px] py-1.5 text-gray-500 hover:text-gray-300 transition-colors border-b-2 border-transparent">
          Pipeline
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 cybeni-toolbar">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-300">Cybeni AI</span>
          {currentMode && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${currentMode.color}`}>
              {currentMode.icon} {currentMode.name}
            </span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
            {(aiConfig?.temperature * 100).toFixed(0)}%
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${restrictionInfo.color}`}>
            {restrictionInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300" title="Clear chat">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Config toggles */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/10 overflow-x-auto scrollbar-none">
        <button
          onClick={() => { setShowProviders(!showProviders); setShowAdjusters(false); setShowRules(false); setShowPreprompt(false); }}
          className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors shrink-0 ${showProviders ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400 hover:text-gray-200'}`}
        >
          <Zap className="w-3 h-3" />
          {selectedProvider.type === 'auto' ? 'Auto' : selectedProvider.provider === 'ollama' || selectedProvider.provider === 'lmstudio' ? `${selectedProvider.provider}${selectedProvider.model ? `: ${selectedProvider.model.split(':')[0]}` : ''}` : selectedProvider.provider}
        </button>
        <button
          onClick={() => { setShowAdjusters(!showAdjusters); setShowProviders(false); setShowRules(false); setShowPreprompt(false); }}
          className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors shrink-0 ${showAdjusters ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400 hover:text-gray-200'}`}
        >
          <SlidersHorizontal className="w-3 h-3" /> Adjusters
        </button>
        <button
          onClick={() => { setShowRules(!showRules); setShowProviders(false); setShowAdjusters(false); setShowPreprompt(false); }}
          className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors shrink-0 ${showRules ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400 hover:text-gray-200'}`}
        >
          <Shield className="w-3 h-3" /> Rules
        </button>
        <button
          onClick={() => { setShowPreprompt(!showPreprompt); setShowProviders(false); setShowAdjusters(false); setShowRules(false); }}
          className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors shrink-0 ${showPreprompt ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400 hover:text-gray-200'}`}
        >
          <BookOpen className="w-3 h-3" /> Preprompt
        </button>
      </div>

      {/* Config panels */}
      {showProviders && <ProviderSelector selectedProvider={selectedProvider} onSelect={(p) => { setSelectedProvider(p); setShowProviders(false); }} onClose={() => setShowProviders(false)} />}
      {showAdjusters && <AIAdjusters onClose={() => setShowAdjusters(false)} />}
      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}
      {showPreprompt && <PrepromptEditor onClose={() => setShowPreprompt(false)} />}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <Sparkles className="w-8 h-8 text-primary/40" />
            <div>
              <p className="text-xs text-gray-400">Ask Cybeni to build, edit, or explain code.</p>
              <p className="text-[10px] text-gray-500 mt-1">Your project files and active rules are automatically included as context.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {['Build a login form', 'Add dark mode toggle', 'Create an API endpoint', 'Explain this code'].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 border border-white/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-primary/15 text-gray-200'
                : msg.error
                  ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                  : 'bg-white/5 text-gray-300'
            }`}>
              <MessageContent text={msg.text} onApplyCode={handleApplyCode} />
              {msg.source && (
                <div className="text-[9px] text-gray-500 mt-1">{msg.source}</div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {aiLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-[11px] text-gray-400">Generating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="cybeni-statusbar p-2">
        <div className="flex items-end gap-2 bg-white/5 rounded-lg border border-white/10 focus-within:border-primary/40 transition-colors cybeni-input">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Cybeni... (Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-500 px-3 py-2.5 outline-none resize-none max-h-[120px] scrollbar-thin"
            style={{ minHeight: '36px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || aiLoading}
            className="p-2 text-primary hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
