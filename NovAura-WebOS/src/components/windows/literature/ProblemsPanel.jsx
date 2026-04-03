import React, { useState } from 'react';
import {
  AlertTriangle, AlertCircle, Info, CheckCircle, Search, Loader2, Trash2,
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../../services/aiService';
import { kernelStorage } from '../../../kernel/kernelStorage.js';

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
};

export default function ProblemsPanel({ content = '', storyBible = null }) {
  const [problems, setProblems] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');

  const analyze = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);

    const plainText = content.replace(/<[^>]+>/g, '').trim();
    let bibleCtx = '';
    if (storyBible) {
      const names = storyBible.characters?.map((c) => c.name).join(', ') || '';
      const places = storyBible.settings?.map((s) => s.name).join(', ') || '';
      if (names) bibleCtx += `\nCharacter names: ${names}`;
      if (places) bibleCtx += `\nSetting names: ${places}`;
    }

    try {
      const token = kernelStorage.getItem('auth_token');
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: `You are a manuscript editor. Analyze this text and return a JSON array of issues found. Each issue should have: "severity" (error, warning, info), "category" (spelling, grammar, continuity, pacing, style, plot), "message" (short description), "suggestion" (how to fix).${bibleCtx}

Return ONLY the JSON array, no other text. Find real issues — spelling errors, grammar problems, passive voice, pacing issues, unclear references, inconsistencies.

Text to analyze:
"${plainText.slice(0, 3000)}"`,
        maxTokens: 2048,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      try {
        const text = res.data.content || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '[]');
        setProblems(parsed.map((p, i) => ({ ...p, id: i })));
      } catch {
        setProblems([{ id: 0, severity: 'info', category: 'analysis', message: 'Analysis complete — no structured issues found.', suggestion: res.data.content?.slice(0, 200) || '' }]);
      }
    } catch (err) {
      setProblems([{ id: 0, severity: 'error', category: 'system', message: 'Analysis failed', suggestion: err.message }]);
    }
    setAnalyzing(false);
  };

  const filtered = filter === 'all' ? problems : problems.filter((p) => p.severity === filter || p.category === filter);

  const counts = {
    error: problems.filter((p) => p.severity === 'error').length,
    warning: problems.filter((p) => p.severity === 'warning').length,
    info: problems.filter((p) => p.severity === 'info').length,
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Problems</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-red-400">{counts.error} errors</span>
            <span className="text-yellow-400">{counts.warning} warnings</span>
            <span className="text-blue-400">{counts.info} info</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#2a2a4a] text-[10px] rounded px-1.5 py-0.5 border border-gray-700 outline-none"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="spelling">Spelling</option>
            <option value="grammar">Grammar</option>
            <option value="continuity">Continuity</option>
            <option value="pacing">Pacing</option>
            <option value="style">Style</option>
          </select>
          <button
            onClick={() => setProblems([])}
            className="text-gray-500 hover:text-white"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={analyze}
            disabled={analyzing}
            className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] rounded disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Analyze
          </button>
        </div>
      </div>

      {/* Problems list */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-[11px]">
            {analyzing ? 'Analyzing manuscript...' : 'Click "Analyze" to check your writing'}
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a4a]">
            {filtered.map((problem) => {
              const cfg = SEVERITY_CONFIG[problem.severity] || SEVERITY_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div key={problem.id} className="px-3 py-2 hover:bg-white/3 flex gap-2">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                        {problem.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-200 mt-0.5">{problem.message}</p>
                    {problem.suggestion && (
                      <p className="text-[10px] text-gray-500 mt-0.5">Fix: {problem.suggestion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
