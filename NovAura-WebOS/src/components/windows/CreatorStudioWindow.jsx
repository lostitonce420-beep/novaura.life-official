import React, { useState } from 'react';
import { Wand2, Play, Copy, Download, AlertCircle, CheckCircle2, Zap, Code, FileCode, Sparkles } from 'lucide-react';

const INSTRUCTION_STYLES = [
  { id: 'direct', label: 'Direct', desc: 'Concise implementation', icon: '⚡' },
  { id: 'detailed', label: 'Detailed', desc: 'Step-by-step with comments', icon: '📝' },
  { id: 'teaching', label: 'Teaching', desc: 'Explains as it builds', icon: '🎓' },
  { id: 'minimal', label: 'Minimal', desc: 'Shortest possible code', icon: '🎯' },
];

const LANGUAGES = ['javascript','typescript','python','csharp','cpp','gdscript','rust','go','html/css'];

const ERROR_PATTERNS = [
  { pattern: /console\.log\(/g, severity: 'info', message: 'Debug log found — remove before production' },
  { pattern: /var /g, severity: 'warn', message: 'Using var — prefer const/let' },
  { pattern: /TODO|FIXME|HACK/g, severity: 'warn', message: 'Unresolved TODO/FIXME found' },
  { pattern: /eval\(/g, severity: 'error', message: 'eval() is a security risk' },
  { pattern: /document\.write/g, severity: 'error', message: 'document.write is deprecated' },
  { pattern: /innerHTML\s*=/g, severity: 'warn', message: 'innerHTML — risk of XSS injection' },
  { pattern: /==(?!=)/g, severity: 'info', message: 'Loose equality — consider ===' },
  { pattern: /catch\s*\(\s*\)\s*\{/g, severity: 'warn', message: 'Empty catch block — errors swallowed silently' },
];

export default function CreatorStudioWindow({ onAIChat }) {
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState('direct');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState([]);
  const [view, setView] = useState('generate'); // generate | scan

  const generateCode = async () => {
    if (!instruction.trim()) return;
    if (onAIChat) {
      setCode('// Generating...');
      try {
        const prompt = `Generate ${language} code (${style} style): ${instruction}. Only output code with comments, no explanations.`;
        const result = await onAIChat(prompt, 'coding');
        const generated = result?.response || '// AI returned no response';
        setCode(generated);
        scanCode(generated);
        return;
      } catch (e) {
        console.warn('AI generation failed:', e);
      }
    }
    const stub = `// Generated from: "${instruction}"\n// Style: ${style} | Language: ${language}\n// Connect an AI provider in Settings to enable generation\n\n// Placeholder\nfunction placeholder() {\n  // Your ${instruction} implementation will appear here\n}\n`;
    setCode(stub);
    scanCode(stub);
  };

  const scanCode = (codeToScan) => {
    const target = codeToScan || code;
    if (!target.trim()) { setErrors([]); return; }
    const found = [];
    ERROR_PATTERNS.forEach(({ pattern, severity, message }) => {
      const matches = target.match(pattern);
      if (matches) {
        found.push({ severity, message, count: matches.length });
      }
    });
    setErrors(found);
  };

  const copyCode = () => navigator.clipboard.writeText(code);
  const downloadCode = () => {
    const ext = { javascript:'.js', typescript:'.ts', python:'.py', csharp:'.cs', cpp:'.cpp', gdscript:'.gd', rust:'.rs', go:'.go', 'html/css':'.html' }[language] || '.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a'); link.download = `generated${ext}`; link.href = URL.createObjectURL(blob); link.click();
  };

  const severityColor = { error: 'text-red-400 bg-red-900/20', warn: 'text-amber-400 bg-amber-900/20', info: 'text-blue-400 bg-blue-900/20' };
  const severityIcon = { error: '🔴', warn: '🟡', info: '🔵' };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-violet-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold">Creator Studio</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('generate')} className={`px-2 py-0.5 rounded text-[10px] ${view === 'generate' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400'}`}>Generate</button>
          <button onClick={() => { setView('scan'); scanCode(); }} className={`px-2 py-0.5 rounded text-[10px] ${view === 'scan' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400'}`}>Scan</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Controls */}
        <div className="w-48 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
          {view === 'generate' ? (
            <>
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">INSTRUCTION</label>
                <textarea value={instruction} onChange={e => setInstruction(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 resize-none focus:outline-none" rows={4} />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">STYLE</label>
                {INSTRUCTION_STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-[10px] flex items-center gap-2 mb-0.5 ${style === s.id ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <span>{s.icon}</span><div><div>{s.label}</div><div className="text-[8px] text-slate-500">{s.desc}</div></div>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">LANGUAGE</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button onClick={generateCode} disabled={!instruction.trim()}
                className="w-full py-2 bg-violet-600/50 hover:bg-violet-500/50 border border-violet-700 rounded text-xs text-violet-200 flex items-center justify-center gap-1 disabled:opacity-30">
                <Sparkles className="w-3 h-3" /> Generate Code
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-300 mb-2">Code Scanner</div>
              <div className="text-[10px] text-slate-500 mb-3">Paste or write code, then scan for common issues, security risks, and best practice violations.</div>
              <button onClick={() => scanCode()}
                className="w-full py-2 bg-violet-600/50 hover:bg-violet-500/50 border border-violet-700 rounded text-xs text-violet-200 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Scan Code
              </button>
              {errors.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <div className="text-[9px] text-slate-500">{errors.length} issue(s) found</div>
                  {errors.map((e, i) => (
                    <div key={i} className={`p-2 rounded text-[10px] ${severityColor[e.severity]}`}>
                      <span className="mr-1">{severityIcon[e.severity]}</span>
                      {e.message} {e.count > 1 && `(×${e.count})`}
                    </div>
                  ))}
                </div>
              )}
              {errors.length === 0 && code && (
                <div className="p-2 rounded bg-green-900/20 text-green-400 text-[10px] flex items-center gap-1 mt-3">
                  <CheckCircle2 className="w-3 h-3" /> No issues found
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-black/20 border-b border-slate-800/50 shrink-0 flex items-center gap-2">
            <FileCode className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-400">Output</span>
            <span className="text-[9px] text-slate-600 ml-auto">{code.split('\n').length} lines</span>
            <button onClick={copyCode} className="p-1 hover:bg-slate-800 rounded text-slate-500"><Copy className="w-3 h-3" /></button>
            <button onClick={downloadCode} className="p-1 hover:bg-slate-800 rounded text-slate-500"><Download className="w-3 h-3" /></button>
          </div>
          <textarea value={code} onChange={e => setCode(e.target.value)}
            className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
            spellCheck={false} placeholder="Generated code will appear here..." />
        </div>
      </div>
    </div>
  );
}
