import React, { useState, useRef, useEffect } from 'react';
import {
  Zap, Play, Square, Check, Loader2, XCircle, Settings,
  Sparkles, Shield, Paintbrush, ArrowLeft, FileCode,
} from 'lucide-react';
import useRepoStore from './useRepoStore';
import { runPipeline, PIPELINE_PHASES } from '../builderbot/PipelineEngine';

// ── Enhancement modes ────────────────────────────────────────
const ENHANCE_MODES = [
  {
    id: 'full',
    name: 'Full Enhancement',
    desc: 'Analyze, fix issues, improve architecture, add features, rebrand',
    icon: Zap,
  },
  {
    id: 'fix',
    name: 'Fix & Harden',
    desc: 'Fix bugs, security issues, and code quality problems only',
    icon: Shield,
  },
  {
    id: 'rebrand',
    name: 'Rebrand Only',
    desc: 'Apply NovAura theme, rename, update UI — keep functionality as-is',
    icon: Paintbrush,
  },
];

// ── Phase status icon ────────────────────────────────────────
function PhaseIcon({ status }) {
  if (status === 'done') return <Check className="w-3 h-3 text-green-400" />;
  if (status === 'running') return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
  if (status === 'error') return <XCircle className="w-3 h-3 text-red-400" />;
  return <div className="w-3 h-3 rounded-full border border-white/20" />;
}

// ── Build enhancement prompt based on mode and app ───────────
function buildEnhancePrompt(app, mode, rebrandName, features) {
  const fileList = app.files.map(f => `- ${f.path} (${f.content?.length || 0} chars)`).join('\n');
  const codeContext = app.files
    .slice(0, 30) // limit context size
    .map(f => `### ${f.path}\n\`\`\`${f.path}\n${f.content}\n\`\`\``)
    .join('\n\n');

  const base = `You are enhancing an existing open-source project called "${app.originalName}".
${app.description ? `Original description: ${app.description}` : ''}
Language: ${app.language || 'Unknown'}

## Current Project Files
${fileList}

## Current Code
${codeContext}
`;

  if (mode === 'full') {
    return `${base}

## Enhancement Instructions
1. **Analyze** the codebase for bugs, security vulnerabilities, anti-patterns, and missing error handling.
2. **Fix** all identified issues — security holes, unhandled edge cases, broken logic.
3. **Improve** architecture — better separation of concerns, cleaner patterns, modern best practices.
4. **Add features** if applicable: ${features || 'improve UX, add loading states, error boundaries, responsive design'}.
5. **Rebrand** to "${rebrandName || 'NovAura ' + app.originalName}":
   - Update all UI text, titles, headers to use the new name
   - Apply NovAura design language: dark theme (#0a0a0f bg), RGB gradient accents (#00f0ff cyan, #8b5cf6 violet, #ff006e magenta)
   - Update any hardcoded brand names, logos, or references
   - Use modern font stack: system-ui, -apple-system, sans-serif

Output ALL files with their full content, even if unchanged. Wrap each in a code block with filename.`;
  }

  if (mode === 'fix') {
    return `${base}

## Fix & Harden Instructions
1. **Analyze** for bugs, security vulnerabilities, race conditions, unhandled errors.
2. **Fix** all issues found — do NOT change functionality or UI.
3. **Harden** — add input validation, error handling, safe defaults where missing.
4. **Do NOT** rename, rebrand, or change the look/feel.

Output ALL modified files with their full content. Wrap each in a code block with filename.`;
  }

  // rebrand only
  return `${base}

## Rebrand Instructions
1. **Do NOT** change any functionality or fix code — keep the app working exactly as-is.
2. **Rebrand** to "${rebrandName || 'NovAura ' + app.originalName}":
   - Update all UI text, titles, headers, meta tags to use the new name
   - Apply NovAura design: dark theme (#0a0a0f bg), gradients (#00f0ff → #8b5cf6 → #ff006e)
   - Replace any brand assets/references with NovAura branding
   - Use consistent font: system-ui, -apple-system, sans-serif
3. Keep all logic, routes, API calls, and behavior identical.

Output ALL modified files with their full content. Wrap each in a code block with filename.`;
}

// ── Main Component ───────────────────────────────────────────
export default function EnhancePanel({ app, onBack, onComplete }) {
  const [mode, setMode] = useState('full');
  const [rebrandName, setRebrandName] = useState('');
  const [features, setFeatures] = useState('');
  const [running, setRunning] = useState(false);
  const [phases, setPhases] = useState(PIPELINE_PHASES.map(p => ({ ...p, status: 'pending' })));
  const [logs, setLogs] = useState([]);
  const [confusion, setConfusion] = useState(null);
  const cancelledRef = useRef(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  const updatePhase = (id, status) => setPhases(prev => prev.map(p => p.id === id ? { ...p, status } : p));

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

  // ── Run enhancement pipeline ───────────────────────────────
  const handleStart = async () => {
    if (running || !app) return;
    setRunning(true);
    cancelledRef.current = false;
    setLogs([]);
    setConfusion(null);
    setPhases(PIPELINE_PHASES.map(p => ({ ...p, status: 'pending' })));

    const prompt = buildEnhancePrompt(app, mode, rebrandName, features);
    const projectFiles = app.files.map(f => ({ path: f.path, content: f.content || '' }));

    const config = {
      traits: { creativity: mode === 'rebrand' ? 0.6 : 0.5, verbosity: 0.4, strictness: mode === 'fix' ? 0.8 : 0.5, optimization: 0.5 },
      restrictions: { content: 'basic', security: mode === 'fix' ? 'hardened' : 'standard', codeQuality: 'strict' },
      reinforceProvider: 'claude',
      orchestratorProvider: 'claude',
    };

    try {
      await runPipeline(prompt, projectFiles, config, {
        onPhaseStart: (id) => updatePhase(id, 'running'),
        onPhaseComplete: (id) => updatePhase(id, 'done'),
        onPhaseError: (id, msg) => { if (id) updatePhase(id, 'error'); addLog(`ERROR: ${msg}`); },
        onLog: addLog,
        onCodeUpdate: () => {},
        onConfusion: handleConfusion,
        onComplete: (blocks) => {
          // Convert blocks back to file array format
          const enhancedFiles = Object.entries(blocks).map(([path, content]) => ({
            path,
            content,
            size: content.length,
          }));

          // Merge: keep unmodified originals, overlay enhanced files
          const originalPaths = new Set(app.files.map(f => f.path));
          const newPaths = new Set(Object.keys(blocks));
          const merged = [
            ...enhancedFiles,
            ...app.files.filter(f => !newPaths.has(f.path)),
          ];

          useRepoStore.getState().updateAppFiles(app.id, merged);
          useRepoStore.getState().updateApp(app.id, {
            rebrandedName: rebrandName || `NovAura ${app.originalName}`,
            status: 'enhanced',
          });

          addLog(`Enhancement complete. ${enhancedFiles.length} files modified, ${merged.length} total.`);
          if (onComplete) onComplete(app.id);
        },
        isCancelled: () => cancelledRef.current,
      });
    } catch (err) {
      if (err.message !== 'CANCELLED') addLog(`Enhancement failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    addLog('Cancelling enhancement...');
  };

  const doneCount = phases.filter(p => p.status === 'done').length;

  if (!app) return null;

  return (
    <div className="flex flex-col h-full bg-[#12121e] text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <button onClick={onBack} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold">Enhance: {app.originalName}</span>
        {running && (
          <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-auto">
            {doneCount}/{phases.length}
          </span>
        )}
      </div>

      {/* Config — hidden when running */}
      {!running && logs.length === 0 && (
        <div className="px-3 py-2 border-b border-white/10 space-y-3 overflow-y-auto scrollbar-thin">
          {/* Enhancement mode */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Enhancement Mode</div>
            {ENHANCE_MODES.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`w-full flex items-start gap-2 p-2 rounded-lg mb-1 border transition-all ${
                    mode === m.id
                      ? 'border-primary/30 bg-primary/10'
                      : 'border-white/5 bg-black/20 hover:border-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${mode === m.id ? 'text-primary' : 'text-gray-600'}`} />
                  <div className="text-left">
                    <div className={`text-[11px] font-medium ${mode === m.id ? 'text-gray-200' : 'text-gray-400'}`}>{m.name}</div>
                    <div className="text-[9px] text-gray-600">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rebrand name */}
          {(mode === 'full' || mode === 'rebrand') && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">New Name</div>
              <input
                value={rebrandName}
                onChange={e => setRebrandName(e.target.value)}
                placeholder={`NovAura ${app.originalName}`}
                className="w-full bg-black/30 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          )}

          {/* Additional features (full mode) */}
          {mode === 'full' && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Additional Features</div>
              <textarea
                value={features}
                onChange={e => setFeatures(e.target.value)}
                placeholder="e.g. add dark mode toggle, improve mobile responsiveness, add loading animations..."
                className="w-full bg-black/30 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 outline-none resize-none min-h-[48px] focus:border-primary/40 transition-colors"
              />
            </div>
          )}

          {/* App info */}
          <div className="text-[9px] text-gray-600 flex items-center gap-3">
            <span className="flex items-center gap-1"><FileCode className="w-3 h-3" /> {app.files.length} files</span>
            <span>{app.language}</span>
            <span>{app.license}</span>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[11px] font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Start Enhancement Pipeline
          </button>
        </div>
      )}

      {/* Cancel button when running */}
      {running && (
        <div className="px-3 py-2 border-b border-white/10">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-medium transition-colors"
          >
            <Square className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}

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

      {/* Scrollable: phases + log */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
        {(running || logs.length > 0) && (
          <>
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
              </div>
            ))}
          </>
        )}

        {logs.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Enhancement Log</div>
            <div
              ref={logRef}
              className="bg-black/30 rounded-lg border border-white/10 p-2 max-h-[200px] overflow-y-auto scrollbar-thin font-mono"
            >
              {logs.map((l, i) => (
                <div key={i} className="text-[10px] text-gray-400 py-0.5 leading-relaxed">
                  <span className="text-gray-600 mr-1.5">{l.time}</span>
                  <span className={l.msg.startsWith('ERROR') ? 'text-red-400' : l.msg.includes('complete') ? 'text-green-400' : ''}>
                    {l.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
