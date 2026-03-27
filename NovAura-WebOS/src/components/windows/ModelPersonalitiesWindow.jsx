import React, { useState, useMemo } from 'react';
import { Sparkles, TrendingUp, Brain, Star, Zap, Clock, Heart, BarChart3, ArrowRight } from 'lucide-react';

const MODELS = [
  { id: 'nova', name: 'Nova', emoji: '✨', tagline: 'Creative powerhouse', tier: 'S', latency: 'fast', strengths: ['Creative writing', 'Brainstorming', 'Art direction'], bestFor: 'Creative tasks, storytelling, ideation', personality: 'Warm, imaginative, playful' },
  { id: 'atlas', name: 'Atlas', emoji: '🗺️', tagline: 'Analytical architect', tier: 'S', latency: 'medium', strengths: ['Data analysis', 'Research', 'Strategy'], bestFor: 'Complex analysis, planning, research', personality: 'Precise, methodical, thorough' },
  { id: 'sage', name: 'Sage', emoji: '📚', tagline: 'Knowledge keeper', tier: 'A', latency: 'fast', strengths: ['Q&A', 'Education', 'Explanations'], bestFor: 'Learning, tutoring, factual queries', personality: 'Patient, wise, encouraging' },
  { id: 'forge', name: 'Forge', emoji: '⚒️', tagline: 'Code craftsman', tier: 'S', latency: 'medium', strengths: ['Code generation', 'Debugging', 'Architecture'], bestFor: 'Software development, code review', personality: 'Direct, efficient, detail-oriented' },
  { id: 'echo', name: 'Echo', emoji: '🎭', tagline: 'Conversationalist', tier: 'A', latency: 'fast', strengths: ['Chat', 'Roleplay', 'Emotional support'], bestFor: 'Natural conversation, companionship', personality: 'Empathetic, engaging, adaptive' },
  { id: 'prism', name: 'Prism', emoji: '🔮', tagline: 'Visual thinker', tier: 'A', latency: 'slow', strengths: ['Image analysis', 'Design', 'UI/UX'], bestFor: 'Visual tasks, design feedback', personality: 'Aesthetic, perceptive, creative' },
  { id: 'bolt', name: 'Bolt', emoji: '⚡', tagline: 'Speed demon', tier: 'B', latency: 'ultra-fast', strengths: ['Quick answers', 'Summaries', 'Translations'], bestFor: 'Fast tasks, simple queries', personality: 'Snappy, concise, efficient' },
  { id: 'aegis', name: 'Aegis', emoji: '🛡️', tagline: 'Security sentinel', tier: 'A', latency: 'medium', strengths: ['Code review', 'Security audit', 'Best practices'], bestFor: 'Security, compliance, code quality', personality: 'Cautious, thorough, protective' },
  { id: 'muse', name: 'Muse', emoji: '🎨', tagline: 'Artistic soul', tier: 'A', latency: 'medium', strengths: ['Music', 'Poetry', 'Art concepts'], bestFor: 'Artistic creation, aesthetic tasks', personality: 'Dreamy, inspired, poetic' },
  { id: 'nexus', name: 'Nexus', emoji: '🌐', tagline: 'Integration master', tier: 'B', latency: 'fast', strengths: ['APIs', 'Automation', 'Workflows'], bestFor: 'System integration, automation', personality: 'Systematic, practical, connected' },
];

const TIER_COLORS = { S: 'text-amber-400 bg-amber-500/20', A: 'text-purple-400 bg-purple-500/20', B: 'text-cyan-400 bg-cyan-500/20' };
const LATENCY_ORDER = { 'ultra-fast': 4, 'fast': 3, 'medium': 2, 'slow': 1 };

export default function ModelPersonalitiesWindow() {
  const [tab, setTab] = useState('gallery');
  const [selectedId, setSelectedId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('model_favorites') || '[]'); } catch { return []; }
  });
  // Recommend state
  const [taskType, setTaskType] = useState('creative');
  const [complexity, setComplexity] = useState('medium');
  const [urgency, setUrgency] = useState('normal');
  const [budget, setBudget] = useState('any');
  // Compare state
  const [compare1, setCompare1] = useState('nova');
  const [compare2, setCompare2] = useState('forge');

  const toggleFav = (id) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('model_favorites', JSON.stringify(next));
  };

  const selected = MODELS.find(m => m.id === selectedId);

  const recommendations = useMemo(() => {
    const scores = MODELS.map(m => {
      let score = 0;
      const typeMap = { creative: ['Creative writing', 'Brainstorming', 'Art direction', 'Music', 'Poetry', 'Art concepts'], analytical: ['Data analysis', 'Research', 'Strategy', 'Code review', 'Security audit'], coding: ['Code generation', 'Debugging', 'Architecture', 'APIs', 'Automation'], conversation: ['Chat', 'Roleplay', 'Emotional support', 'Q&A', 'Education'] };
      const relevant = typeMap[taskType] || [];
      score += m.strengths.filter(s => relevant.includes(s)).length * 30;
      if (complexity === 'high' && m.tier === 'S') score += 25;
      if (complexity === 'low' && m.tier === 'B') score += 15;
      if (urgency === 'urgent') score += LATENCY_ORDER[m.latency] * 10;
      if (budget === 'free' && m.tier === 'B') score += 20;
      if (budget === 'pro' && m.tier === 'S') score += 10;
      return { ...m, score };
    });
    return scores.sort((a, b) => b.score - a.score);
  }, [taskType, complexity, urgency, budget]);

  // Detail view
  if (selected) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setSelectedId(null)} className="text-[10px] text-slate-400 hover:text-white">← Back</button>
          <span className="text-lg">{selected.emoji}</span>
          <span className="text-sm font-semibold">{selected.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${TIER_COLORS[selected.tier]}`}>Tier {selected.tier}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">{selected.emoji}</div>
            <div className="text-lg font-bold">{selected.name}</div>
            <div className="text-xs text-slate-400 italic">{selected.tagline}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-[9px] text-slate-500 uppercase">Personality</div>
              <div className="text-xs text-slate-300 mt-1">{selected.personality}</div>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-[9px] text-slate-500 uppercase">Latency</div>
              <div className="text-xs text-slate-300 mt-1 capitalize">{selected.latency}</div>
            </div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase mb-1.5">Strengths</div>
            <div className="flex flex-wrap gap-1">{selected.strengths.map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">{s}</span>)}</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div className="text-[9px] text-slate-500 uppercase mb-1">Best For</div>
            <div className="text-xs text-slate-300">{selected.bestFor}</div>
          </div>
          <button onClick={() => toggleFav(selected.id)}
            className={`w-full py-2 rounded-lg text-xs font-medium border transition-all ${favorites.includes(selected.id) ? 'bg-pink-500/20 border-pink-600/50 text-pink-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}>
            <Heart className="w-3 h-3 inline mr-1" />{favorites.includes(selected.id) ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold">AI Models</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0">
        {[['gallery', 'Gallery', Sparkles], ['recommend', 'Recommend', TrendingUp], ['compare', 'Compare', BarChart3]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium border-b-2 transition-all ${tab === id ? 'border-purple-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Gallery */}
        {tab === 'gallery' && (
          <div className="grid grid-cols-2 gap-2">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => setSelectedId(m.id)}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-600/50 transition-all text-left group">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">{m.name}</div>
                    <div className="text-[9px] text-slate-500">{m.tagline}</div>
                  </div>
                  <span className={`text-[8px] px-1 py-0.5 rounded ${TIER_COLORS[m.tier]}`}>{m.tier}</span>
                </div>
                <div className="flex flex-wrap gap-0.5">{m.strengths.slice(0, 2).map(s => <span key={s} className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">{s}</span>)}</div>
                {favorites.includes(m.id) && <Heart className="w-2.5 h-2.5 text-pink-400 mt-1" />}
              </button>
            ))}
          </div>
        )}

        {/* Recommend */}
        {tab === 'recommend' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1">Task Type</div>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white">
                  {['creative', 'analytical', 'coding', 'conversation'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1">Complexity</div>
                <select value={complexity} onChange={e => setComplexity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white">
                  {['low', 'medium', 'high'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1">Urgency</div>
                <select value={urgency} onChange={e => setUrgency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white">
                  {['relaxed', 'normal', 'urgent'].map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase mb-1">Budget</div>
                <select value={budget} onChange={e => setBudget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white">
                  {['any', 'free', 'pro'].map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="text-[9px] text-slate-500 uppercase">Top Recommendations</div>
            {recommendations.slice(0, 5).map((m, i) => (
              <button key={m.id} onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left ${i === 0 ? 'bg-purple-900/20 border-purple-600/30' : 'bg-slate-900/30 border-slate-800 hover:border-slate-600'}`}>
                <span className="text-[10px] font-bold text-slate-500 w-4">#{i + 1}</span>
                <span className="text-lg">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium">{m.name}</div>
                  <div className="text-[9px] text-slate-500">{m.bestFor}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[8px] px-1 py-0.5 rounded ${TIER_COLORS[m.tier]}`}>{m.tier}</div>
                  <div className="text-[8px] text-slate-600 mt-0.5">Score: {m.score}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Compare */}
        {tab === 'compare' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[['Left', compare1, setCompare1], ['Right', compare2, setCompare2]].map(([label, val, setter]) => (
                <div key={label}>
                  <div className="text-[9px] text-slate-500 uppercase mb-1">{label}</div>
                  <select value={val} onChange={e => setter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-white">
                    {MODELS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {(() => {
              const m1 = MODELS.find(m => m.id === compare1);
              const m2 = MODELS.find(m => m.id === compare2);
              if (!m1 || !m2) return null;
              const rows = [
                ['Tier', m1.tier, m2.tier],
                ['Latency', m1.latency, m2.latency],
                ['Personality', m1.personality, m2.personality],
                ['Best For', m1.bestFor, m2.bestFor],
              ];
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-center py-3">
                    {[m1, m2].map(m => (
                      <div key={m.id}>
                        <div className="text-3xl mb-1">{m.emoji}</div>
                        <div className="text-xs font-bold">{m.name}</div>
                        <div className="text-[9px] text-slate-500 italic">{m.tagline}</div>
                      </div>
                    ))}
                  </div>
                  {rows.map(([label, v1, v2]) => (
                    <div key={label} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <div className="text-[10px] text-right text-slate-300">{v1}</div>
                      <div className="text-[8px] text-slate-600 px-2 uppercase">{label}</div>
                      <div className="text-[10px] text-slate-300">{v2}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[m1, m2].map(m => (
                      <div key={m.id} className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg">
                        <div className="text-[8px] text-slate-500 uppercase mb-1">Strengths</div>
                        <div className="flex flex-wrap gap-0.5">{m.strengths.map(s => <span key={s} className="text-[8px] px-1.5 py-0.5 bg-purple-500/15 text-purple-300 rounded">{s}</span>)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
