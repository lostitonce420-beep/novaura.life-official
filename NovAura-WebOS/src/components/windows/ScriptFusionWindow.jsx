import React, { useState } from 'react';
import { GitMerge, Play, AlertTriangle, CheckCircle2, FileCode, Plus, Trash2, Copy, Download } from 'lucide-react';

const LANGUAGES = ['javascript','typescript','python','csharp','cpp','gdscript','html','css','json'];
const LANG_EXT = { javascript:'.js', typescript:'.ts', python:'.py', csharp:'.cs', cpp:'.cpp', gdscript:'.gd', html:'.html', css:'.css', json:'.json' };

function analyzeScript(code) {
  const lines = code.split('\n').length;
  const imports = (code.match(/^(import |from |require\(|using |#include)/gm) || []).length;
  const functions = (code.match(/(function |def |fn |func |void |int |string |public |private |static )\w+\s*\(/gm) || []).length;
  const classes = (code.match(/(class |struct |interface |enum )\w+/gm) || []).length;
  return { lines, imports, functions, classes };
}

function detectConflicts(scripts) {
  const conflicts = [];
  const allImports = {};
  const allFunctions = {};

  scripts.forEach((s, idx) => {
    const importMatches = s.code.match(/^(import .+|from .+ import .+|const .+ = require\(.+\)|using .+;|#include .+)/gm) || [];
    importMatches.forEach(imp => {
      const key = imp.trim();
      if (allImports[key]) { /* duplicate import — not a conflict, just dedup */ }
      else allImports[key] = idx;
    });

    const funcMatches = s.code.match(/(function |def |fn |func |void |int |string |public |private |static )(\w+)\s*\(/gm) || [];
    funcMatches.forEach(f => {
      const name = f.replace(/(function |def |fn |func |void |int |string |public |private |static )/, '').replace('(', '').trim();
      if (allFunctions[name] !== undefined && allFunctions[name] !== idx) {
        conflicts.push({ type: 'function', name, scripts: [allFunctions[name], idx] });
      } else {
        allFunctions[name] = idx;
      }
    });
  });

  return conflicts;
}

function mergeScripts(scripts) {
  const imports = new Set();
  const bodies = [];

  scripts.forEach(s => {
    const lines = s.code.split('\n');
    const importLines = [];
    const bodyLines = [];
    let pastImports = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!pastImports && (trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.startsWith('const ') && trimmed.includes('require(') || trimmed.startsWith('using ') || trimmed.startsWith('#include'))) {
        imports.add(trimmed);
      } else {
        if (trimmed.length > 0) pastImports = true;
        bodyLines.push(line);
      }
    });

    bodies.push(`// ── From: ${s.name} ──\n${bodyLines.join('\n')}`);
  });

  return `${[...imports].join('\n')}\n\n${bodies.join('\n\n')}`;
}

export default function ScriptFusionWindow() {
  const [scripts, setScripts] = useState([
    { id: 1, name: 'Script A', language: 'javascript', code: '// Paste your first script here\n' },
    { id: 2, name: 'Script B', language: 'javascript', code: '// Paste your second script here\n' },
  ]);
  const [merged, setMerged] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [activeScript, setActiveScript] = useState(0);
  const [showMerged, setShowMerged] = useState(false);

  const addScript = () => {
    const id = Date.now();
    setScripts([...scripts, { id, name: `Script ${scripts.length + 1}`, language: 'javascript', code: '' }]);
  };

  const removeScript = (idx) => {
    if (scripts.length <= 2) return;
    setScripts(scripts.filter((_, i) => i !== idx));
    if (activeScript >= scripts.length - 1) setActiveScript(Math.max(0, scripts.length - 2));
  };

  const updateScript = (idx, field, value) => {
    setScripts(scripts.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const doMerge = () => {
    const c = detectConflicts(scripts);
    setConflicts(c);
    const result = mergeScripts(scripts);
    setMerged(result);
    setShowMerged(true);
  };

  const copyMerged = () => navigator.clipboard.writeText(merged);

  const downloadMerged = () => {
    const lang = scripts[0]?.language || 'javascript';
    const ext = LANG_EXT[lang] || '.txt';
    const blob = new Blob([merged], { type: 'text/plain' });
    const link = document.createElement('a'); link.download = `merged${ext}`; link.href = URL.createObjectURL(blob); link.click();
  };

  const stats = scripts.map(s => analyzeScript(s.code));
  const totalLines = stats.reduce((sum, s) => sum + s.lines, 0);
  const totalFuncs = stats.reduce((sum, s) => sum + s.functions, 0);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold">Script Fusion</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500">{scripts.length} scripts · {totalLines} lines · {totalFuncs} funcs</span>
          <button onClick={addScript} className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"><Plus className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Script tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-800/50 shrink-0 overflow-x-auto">
        {scripts.map((s, i) => (
          <button key={s.id} onClick={() => { setActiveScript(i); setShowMerged(false); }}
            className={`px-2.5 py-1 rounded text-[10px] whitespace-nowrap flex items-center gap-1 ${activeScript === i && !showMerged ? 'bg-orange-600/30 text-orange-300' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileCode className="w-3 h-3" />{s.name}
            {scripts.length > 2 && <span onClick={(e) => { e.stopPropagation(); removeScript(i); }} className="ml-1 text-slate-600 hover:text-red-400">×</span>}
          </button>
        ))}
        <button onClick={() => setShowMerged(true)}
          className={`px-2.5 py-1 rounded text-[10px] whitespace-nowrap flex items-center gap-1 ${showMerged ? 'bg-green-600/30 text-green-300' : 'text-slate-400 hover:bg-slate-800'}`}>
          <GitMerge className="w-3 h-3" />Merged
        </button>
      </div>

      {!showMerged ? (
        /* Script editor */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 shrink-0">
            <input value={scripts[activeScript]?.name || ''} onChange={e => updateScript(activeScript, 'name', e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none w-32" />
            <select value={scripts[activeScript]?.language || 'javascript'} onChange={e => updateScript(activeScript, 'language', e.target.value)}
              className="bg-black/30 border border-slate-700 rounded text-[10px] text-white px-1.5 py-0.5 focus:outline-none">
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className="text-[9px] text-slate-500 ml-auto">{stats[activeScript]?.lines || 0} lines</span>
          </div>
          <textarea value={scripts[activeScript]?.code || ''} onChange={e => updateScript(activeScript, 'code', e.target.value)}
            className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none"
            spellCheck={false} />
        </div>
      ) : (
        /* Merged view */
        <div className="flex-1 flex flex-col overflow-hidden">
          {conflicts.length > 0 && (
            <div className="px-3 py-2 bg-amber-900/20 border-b border-amber-800/30 shrink-0">
              <div className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {conflicts.length} potential conflict(s)</div>
              {conflicts.map((c, i) => (
                <div key={i} className="text-[9px] text-amber-300/70 ml-4">Duplicate {c.type}: <span className="font-mono">{c.name}</span></div>
              ))}
            </div>
          )}
          {conflicts.length === 0 && merged && (
            <div className="px-3 py-1.5 bg-green-900/20 border-b border-green-800/30 shrink-0">
              <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Merge clean — no conflicts detected</div>
            </div>
          )}
          <textarea value={merged} onChange={e => setMerged(e.target.value)}
            className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none"
            spellCheck={false} placeholder="Click Merge to combine scripts..." />
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2 border-t border-slate-800 flex gap-2 shrink-0">
        <button onClick={doMerge} className="flex-1 py-1.5 bg-orange-600/50 hover:bg-orange-500/50 border border-orange-700 rounded text-[10px] text-orange-200 flex items-center justify-center gap-1">
          <GitMerge className="w-3 h-3" /> Merge All Scripts
        </button>
        {merged && (
          <>
            <button onClick={copyMerged} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
            <button onClick={downloadMerged} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1"><Download className="w-3 h-3" /> Save</button>
          </>
        )}
      </div>
    </div>
  );
}
