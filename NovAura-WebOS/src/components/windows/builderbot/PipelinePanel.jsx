import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Square, Check, Loader2, XCircle, Settings,
  Zap, Shield, Sparkles, FileCode, ChevronDown,
} from 'lucide-react';
import useBuilderStore from './useBuilderStore';
import { runPipeline, PIPELINE_PHASES } from './PipelineEngine';

// ── Default config ─────────────────────────────────────────

const DEFAULT_CONFIG = {
  traits: { creativity: 0.5, verbosity: 0.5, strictness: 0.5, optimization: 0.3 },
  restrictions: { content: 'basic', security: 'standard', codeQuality: 'standard' },
  reinforceProvider: 'claude',
  orchestratorProvider: 'claude',
};

// ── Phase status icon ──────────────────────────────────────

function PhaseIcon({ status }) {
  if (status === 'done') return <Check className="w-3 h-3 text-green-400" />;
  if (status === 'running') return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
  if (status === 'error') return <XCircle className="w-3 h-3 text-red-400" />;
  return <div className="w-3 h-3 rounded-full border border-white/20" />;
}

// ── Main Component ─────────────────────────────────────────

export default function PipelinePanel() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [phases, setPhases] = useState(PIPELINE_PHASES.map(p => ({ ...p, status: 'pending' })));
  const [logs, setLogs] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [confusion, setConfusion] = useState(null); // { message, resolve }
  const cancelledRef = useRef(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  const updatePhase = (id, status) => setPhases(prev => prev.map(p => p.id === id ? { ...p, status } : p));

  // ── Apply generated code to project ──────────────────────

  const applyToProject = (blocks) => {
    const store = useBuilderStore.getState();
    Object.entries(blocks).forEach(([filename, code]) => {
      const files = store.flattenFiles();
      const existing = files.find(f => f.name === filename || f.path?.endsWith(filename));
      if (existing) {
        store.updateFileContent(existing.id, code);
        store.saveFile(existing.id);
      } else {
        store.createFile('root', filename, 'file');
        const updated = store.flattenFiles();
        const newFile = updated.find(f => f.name === filename);
        if (newFile) {
          store.updateFileContent(newFile.id, code);
          store.saveFile(newFile.id);
        }
      }
    });
  };

  // ── Confusion handler (returns Promise) ──────────────────

  const handleConfusion = (message) => {
    return new Promise((resolve) => {
      setConfusion({ message, resolve });
    });
  };

  const submitGuidance = (text) => {
    if (confusion?.resolve) {
      confusion.resolve(text);
      setConfusion(null);
    }
  };

  // ── Pipeline execution ───────────────────────────────────

  const handleStart = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    cancelledRef.current = false;
    setLogs([]);
    setConfusion(null);
    setPhases(PIPELINE_PHASES.map(p => ({ ...p, status: 'pending' })));

    const projectFiles = useBuilderStore.getState().flattenFiles()
      .map(f => ({ path: f.path || f.name, content: f.content || '' }));

    try {
      await runPipeline(prompt, projectFiles, config, {
        onPhaseStart: (id) => updatePhase(id, 'running'),
        onPhaseComplete: (id) => updatePhase(id, 'done'),
        onPhaseError: (id, msg) => { if (id) updatePhase(id, 'error'); addLog(`ERROR: ${msg}`); },
        onLog: addLog,
        onCodeUpdate: (blocks) => setFileCount(Object.keys(blocks).length),
        onConfusion: handleConfusion,
        onComplete: (blocks) => {
          applyToProject(blocks);
          const store = useBuilderStore.getState();
          if (!store.showPreview) store.togglePreview();
          addLog(`Pipeline complete. ${Object.keys(blocks).length} files applied to project.`);
        },
        isCancelled: () => cancelledRef.current,
      });
    } catch (err) {
      if (err.message !== 'CANCELLED') addLog(`Pipeline failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    addLog('Cancelling pipeline...');
  };

  // ── Config setters ───────────────────────────────────────

  const setTrait = (key, val) => setConfig(c => ({ ...c, traits: { ...c.traits, [key]: val } }));
  const setRestriction = (key, val) => setConfig(c => ({ ...c, restrictions: { ...c.restrictions, [key]: val } }));

  // ── Computed ─────────────────────────────────────────────

  const doneCount = phases.filter(p => p.status === 'done').length;
  const currentPhase = phases.find(p => p.status === 'running');

  return (
    <div className="flex flex-col h-full bg-[#12121e] text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold">Cascading Pipeline</span>
          {running && (
            <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {doneCount}/{phases.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1 rounded hover:bg-white/10 transition-colors ${showConfig ? 'text-primary' : 'text-gray-500'}`}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="px-3 py-2 border-b border-white/10 space-y-3 bg-black/20 max-h-[300px] overflow-y-auto scrollbar-thin">
          {/* Personality traits */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Personality Traits
            </div>
            {[
              { key: 'creativity', label: 'Creativity', icon: '🎨' },
              { key: 'verbosity', label: 'Verbosity', icon: '📝' },
              { key: 'strictness', label: 'Strictness', icon: '📏' },
              { key: 'optimization', label: 'Optimization', icon: '⚡' },
            ].map(t => (
              <div key={t.key} className="flex items-center gap-2 mb-1">
                <span className="text-[10px] w-20 text-gray-400">{t.icon} {t.label}</span>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={config.traits[t.key]}
                  onChange={e => setTrait(t.key, parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-primary"
                />
                <span className="text-[10px] text-primary w-6 text-right">{config.traits[t.key]}</span>
              </div>
            ))}
          </div>

          {/* Restriction levels */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Restriction Levels
            </div>
            {[
              { key: 'content', label: 'Content Filter', options: ['none', 'basic', 'moderate', 'strict'] },
              { key: 'security', label: 'Security', options: ['standard', 'hardened', 'paranoid'] },
              { key: 'codeQuality', label: 'Code Quality', options: ['relaxed', 'standard', 'strict'] },
            ].map(r => (
              <div key={r.key} className="flex items-center gap-2 mb-1">
                <span className="text-[10px] w-24 text-gray-400">{r.label}</span>
                <select
                  value={config.restrictions[r.key]}
                  onChange={e => setRestriction(r.key, e.target.value)}
                  className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
                >
                  {r.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* AI Role Assignment */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">AI Role Assignment</div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] w-24 text-gray-400">Orchestrator</span>
              <select
                value={config.orchestratorProvider}
                onChange={e => setConfig(c => ({ ...c, orchestratorProvider: e.target.value }))}
                className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
              >
                <option value="claude">Claude (recommended)</option>
                <option value="openai">GPT / Codex</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] w-24 text-gray-400">Reinforcement</span>
              <select
                value={config.reinforceProvider}
                onChange={e => setConfig(c => ({ ...c, reinforceProvider: e.target.value }))}
                className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
              >
                <option value="claude">Claude (recommended)</option>
                <option value="openai">GPT / Codex (lower tier)</option>
              </select>
            </div>

            <p className="text-[9px] text-gray-600 mt-1">
              Orchestrator supervises all passes and can REDIRECT or TAKEOVER.
              Gemini handles generation passes 1-4. Kimi handles QA inspection.
            </p>
          </div>
        </div>
      )}

      {/* Prompt input */}
      <div className="px-3 py-2 border-b border-white/10">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe what you want to build in detail. The pipeline will handle architecture, functionality, branching logic, validation, and QA across multiple AI passes..."
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-200 placeholder-gray-500 outline-none resize-none min-h-[60px] focus:border-primary/40 transition-colors"
          disabled={running}
        />
        <div className="flex items-center gap-2 mt-2">
          {!running ? (
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start Pipeline
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          {fileCount > 0 && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <FileCode className="w-3 h-3" /> {fileCount} files
            </span>
          )}
          {currentPhase && (
            <span className="text-[10px] text-primary/70 truncate">{currentPhase.name}</span>
          )}
        </div>
      </div>

      {/* Confusion pause */}
      {confusion && (
        <div className="mx-3 mt-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="text-[11px] text-yellow-300 font-medium mb-1">Pipeline paused — AI needs guidance:</div>
          <div className="text-[10px] text-yellow-200/80 whitespace-pre-wrap mb-2">{confusion.message}</div>
          <input
            type="text"
            placeholder="Type your guidance and press Enter..."
            className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 outline-none focus:border-yellow-500/40"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                submitGuidance(e.target.value.trim());
              }
            }}
          />
        </div>
      )}

      {/* Scrollable content: phases + log */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
        {/* Phase progress */}
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Pipeline Phases</div>
        {phases.map(phase => (
          <div
            key={phase.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors ${
              phase.status === 'running' ? 'bg-primary/10 text-gray-200' :
              phase.status === 'done' ? 'text-gray-400' :
              phase.status === 'error' ? 'text-red-400 bg-red-500/5' :
              'text-gray-500'
            }`}
          >
            <PhaseIcon status={phase.status} />
            <span className="flex-1 truncate">{phase.name}</span>
            {phase.provider && <span className="text-[9px] text-gray-600 shrink-0">{phase.provider}</span>}
            {phase.conditional && phase.status === 'pending' && (
              <span className="text-[9px] text-gray-600 italic">if needed</span>
            )}
          </div>
        ))}

        {/* Log output */}
        {logs.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Pipeline Log</div>
            <div
              ref={logRef}
              className="bg-black/30 rounded-lg border border-white/10 p-2 max-h-[200px] overflow-y-auto scrollbar-thin font-mono"
            >
              {logs.map((l, i) => (
                <div key={i} className="text-[10px] text-gray-400 py-0.5 leading-relaxed">
                  <span className="text-gray-600 mr-1.5">{l.time}</span>
                  <span className={l.msg.startsWith('ERROR') ? 'text-red-400' : l.msg.includes('APPROVED') ? 'text-green-400' : ''}>
                    {l.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!running && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <Zap className="w-8 h-8 text-amber-400/30" />
            <div>
              <p className="text-xs text-gray-400">Multi-AI Cascading Pipeline</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[280px]">
                Gemini builds foundation → depth → branching logic.
                An Orchestrator AI supervises each pass — can redirect or take over.
                Cap logic validation → Kimi QA inspection → Claude/GPT reinforcement → Preview.
                ~9 total passes per prompt.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
