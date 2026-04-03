import React, { useState, useRef } from 'react';
import { BookOpen, Sparkles, Save, Trash2, Eye, Feather, PenTool } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const STYLES = [
  { id: 'free-verse', name: 'Free Verse', desc: 'No fixed structure', icon: '✨' },
  { id: 'haiku', name: 'Haiku', desc: '5-7-5 syllables', icon: '🌸' },
  { id: 'sonnet', name: 'Sonnet', desc: '14 lines, iambic pentameter', icon: '🎭' },
  { id: 'limerick', name: 'Limerick', desc: '5 lines, AABBA rhyme', icon: '😄' },
  { id: 'ballad', name: 'Ballad', desc: '4-line stanzas, ABAB rhyme', icon: '🎶' },
  { id: 'acrostic', name: 'Acrostic', desc: 'First letters spell a word', icon: '🔤' },
  { id: 'tanka', name: 'Tanka', desc: '5-7-5-7-7 syllables', icon: '🍃' },
  { id: 'villanelle', name: 'Villanelle', desc: '19 lines, repeating refrains', icon: '🔁' },
  { id: 'concrete', name: 'Concrete', desc: 'Shape poetry', icon: '🖼️' },
  { id: 'spoken-word', name: 'Spoken Word', desc: 'Performance poetry', icon: '🎤' },
];

const THEMES = [
  { id: 'nature', name: 'Nature', emoji: '🌿' },
  { id: 'love', name: 'Love', emoji: '❤️' },
  { id: 'loss', name: 'Loss', emoji: '🥀' },
  { id: 'time', name: 'Time', emoji: '⏳' },
  { id: 'identity', name: 'Identity', emoji: '🪞' },
  { id: 'dreams', name: 'Dreams', emoji: '💭' },
  { id: 'cosmos', name: 'Cosmos', emoji: '🌌' },
  { id: 'war', name: 'War & Peace', emoji: '☮️' },
];

const MOODS = ['Peaceful', 'Melancholic', 'Joyful', 'Dark', 'Hopeful', 'Nostalgic', 'Fierce', 'Contemplative'];

const PROMPTS = [
  { id: 'dawn', title: 'First Light', style: 'haiku', theme: 'nature', starter: 'Morning dew glistens\n', hint: 'Capture the first moments of dawn in exactly 3 lines' },
  { id: 'mirror', title: 'The Mirror', style: 'free-verse', theme: 'identity', starter: 'I looked into the glass\nand saw not my face, but\n', hint: 'Explore who you really are beyond reflection' },
  { id: 'letters', title: 'Unsent Letter', style: 'free-verse', theme: 'love', starter: 'Dear you,\nI never said—\n', hint: 'Write to someone you wish you could speak to' },
  { id: 'stars', title: 'Starfall', style: 'tanka', theme: 'cosmos', starter: 'Across the void sky\n', hint: 'Contemplate your place among the stars' },
  { id: 'rain', title: 'After the Rain', style: 'sonnet', theme: 'nature', starter: '', hint: 'What grows after the storm passes' },
  { id: 'clock', title: 'The Last Hour', style: 'villanelle', theme: 'time', starter: '', hint: 'If you had one hour left, what would you say?' },
];

function createPoem(title = 'Untitled', style = 'free-verse', theme = 'nature', mood = 'Peaceful') {
  return { id: Date.now().toString(36), title, content: '', style, theme, mood, createdAt: new Date().toISOString() };
}

export default function PoemsCreatorWindow() {
  const [tab, setTab] = useState('create');
  const [poem, setPoem] = useState(createPoem());
  const [library, setLibrary] = useState(() => {
    try {
      const stored = kernelStorage.getItem('poems_library');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [preview, setPreview] = useState(false);
  const textRef = useRef(null);

  const saveLibrary = (updated) => {
    setLibrary(updated);
    kernelStorage.setItem('poems_library', JSON.stringify(updated));
  };

  const wordCount = poem.content.trim() ? poem.content.trim().split(/\s+/).length : 0;
  const lineCount = poem.content ? poem.content.split('\n').filter(l => l.trim()).length : 0;

  const save = () => {
    if (!poem.content.trim()) return;
    saveLibrary([...library, { ...poem, id: Date.now().toString(36) }]);
    setPoem(createPoem());
  };

  const loadPoem = (p) => { setPoem({ ...p }); setTab('create'); };
  const deletePoem = (id) => saveLibrary(library.filter(p => p.id !== id));

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-rose-900/40 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Feather className="w-5 h-5 text-rose-400" />
          <span className="font-semibold text-sm">Poems Creator</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>{wordCount} words</span>
          <span>|</span>
          <span>{lineCount} lines</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0">
        {[['create','Create'],['library','Library'],['prompts','Prompts']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${tab===k ? 'border-rose-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {tab === 'create' && (
          <>
            {/* Left: settings */}
            <div className="w-48 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Title</label>
                <input value={poem.title} onChange={e => setPoem({...poem, title: e.target.value})}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Style</label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setPoem({...poem, style: s.id})}
                      className={`w-full text-left px-2 py-1 rounded text-[10px] transition-all ${poem.style===s.id ? 'bg-rose-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
                      {s.icon} {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Theme</label>
                <div className="flex flex-wrap gap-1">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setPoem({...poem, theme: t.id})}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${poem.theme===t.id ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      {t.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Mood</label>
                <select value={poem.mood} onChange={e => setPoem({...poem, mood: e.target.value})}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-white">
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button onClick={save} disabled={!poem.content.trim()}
                className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all">
                <Save className="w-3 h-3" /> Save to Library
              </button>
            </div>

            {/* Center: editor / preview */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border-b border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {STYLES.find(s => s.id === poem.style)?.icon} {STYLES.find(s => s.id === poem.style)?.name} — {THEMES.find(t => t.id === poem.theme)?.name}
                </span>
                <button onClick={() => setPreview(!preview)} className={`p-1 rounded text-xs transition-all ${preview ? 'text-rose-400' : 'text-slate-400 hover:text-white'}`}>
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
              {preview ? (
                <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                  <div className="max-w-lg w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-8 border border-slate-800">
                    <h2 className="text-xl font-serif font-semibold text-center mb-1">{poem.title}</h2>
                    <p className="text-xs text-slate-500 text-center mb-6">{poem.mood} | {THEMES.find(t=>t.id===poem.theme)?.name}</p>
                    <div className="font-serif text-slate-200 leading-relaxed whitespace-pre-wrap text-center italic">
                      {poem.content || 'Your poem will appear here...'}
                    </div>
                  </div>
                </div>
              ) : (
                <textarea ref={textRef} value={poem.content} onChange={e => setPoem({...poem, content: e.target.value})}
                  placeholder="Begin writing your poem here..."
                  className="flex-1 w-full bg-transparent text-slate-200 font-serif leading-relaxed p-6 resize-none focus:outline-none placeholder-slate-600 text-sm" />
              )}
            </div>
          </>
        )}

        {tab === 'library' && (
          <div className="flex-1 p-4 overflow-y-auto">
            {library.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No poems saved yet</p>
                <p className="text-xs mt-1">Create and save your first poem</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {library.map(p => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{p.title}</h4>
                        <p className="text-[10px] text-slate-500">{STYLES.find(s=>s.id===p.style)?.name} | {p.mood}</p>
                      </div>
                      <button onClick={() => deletePoem(p.id)} className="text-slate-500 hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <p className="text-xs text-slate-400 font-serif italic line-clamp-3 mb-2">{p.content}</p>
                    <button onClick={() => loadPoem(p)} className="text-[10px] text-rose-400 hover:text-rose-300">Edit</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'prompts' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-xl mx-auto space-y-3">
              <p className="text-xs text-slate-400 mb-4">Writing prompts to spark inspiration. Click to load into the editor.</p>
              {PROMPTS.map(pr => (
                <button key={pr.id} onClick={() => { setPoem({...createPoem(pr.title, pr.style, pr.theme), content: pr.starter}); setTab('create'); }}
                  className="w-full text-left bg-slate-900 border border-slate-800 hover:border-rose-500/30 rounded-lg p-4 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-medium text-sm">{pr.title}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{STYLES.find(s=>s.id===pr.style)?.name}</span>
                  </div>
                  <p className="text-xs text-slate-400">{pr.hint}</p>
                  {pr.starter && <p className="text-xs text-slate-500 font-serif italic mt-2">"{pr.starter.trim()}..."</p>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
