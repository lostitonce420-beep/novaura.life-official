import React, { useState } from 'react';
import { CreditCard, Download, Palette, Type, Eye, RotateCcw } from 'lucide-react';

const TEMPLATES = [
  { id: 'modern', name: 'Modern', bg: 'linear-gradient(135deg, #0a0020 0%, #1a0040 100%)', text: '#ffffff', accent: '#00f0ff' },
  { id: 'minimal', name: 'Minimal', bg: '#ffffff', text: '#1a1a2e', accent: '#333333' },
  { id: 'bold', name: 'Bold', bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', text: '#ffffff', accent: '#f1c40f' },
  { id: 'elegant', name: 'Elegant', bg: '#1a1a2e', text: '#d4a843', accent: '#d4a843' },
  { id: 'creative', name: 'Creative', bg: 'linear-gradient(135deg, #8e44ad 0%, #3498db 100%)', text: '#ffffff', accent: '#f39c12' },
  { id: 'nature', name: 'Nature', bg: 'linear-gradient(135deg, #27ae60 0%, #1a5276 100%)', text: '#ffffff', accent: '#f1c40f' },
  { id: 'tech', name: 'Tech', bg: '#0d1117', text: '#58a6ff', accent: '#00f0ff' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #e74c3c 0%, #f39c12 50%, #f1c40f 100%)', text: '#ffffff', accent: '#ffffff' },
  { id: 'ocean', name: 'Ocean', bg: 'linear-gradient(135deg, #1a5276 0%, #3498db 100%)', text: '#ffffff', accent: '#00f0ff' },
  { id: 'midnight', name: 'Midnight', bg: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 100%)', text: '#bdc3c7', accent: '#9b59b6' },
  { id: 'coral', name: 'Coral', bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', text: '#ffffff', accent: '#ffffff' },
  { id: 'forest', name: 'Forest', bg: '#1a2e1a', text: '#a8d8a8', accent: '#4caf50' },
  { id: 'gold', name: 'Gold Leaf', bg: '#1a1a1a', text: '#d4a843', accent: '#ffd700' },
  { id: 'glass', name: 'Glass', bg: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', text: '#ffffff', accent: '#00f0ff' },
];

const FONTS = ['Inter', 'Georgia', 'Courier New', 'Trebuchet MS', 'Arial Black'];

export default function BusinessCardWindow() {
  const [card, setCard] = useState({
    name: 'Your Name',
    title: 'Creative Director',
    company: 'NovAura',
    email: 'you@novaura.life',
    phone: '+1 (555) 000-0000',
    website: 'novaura.life',
    tagline: 'Building the future',
  });
  const [templateId, setTemplateId] = useState('modern');
  const [font, setFont] = useState('Inter');
  const [flipped, setFlipped] = useState(false);
  const [layout, setLayout] = useState('left'); // left | center | split

  const template = TEMPLATES.find(t => t.id === templateId);

  const update = (key, val) => setCard(prev => ({ ...prev, [key]: val }));

  const bgStyle = template.bg.startsWith('linear') || template.bg.startsWith('rgba')
    ? { backgroundImage: template.bg }
    : { backgroundColor: template.bg };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-sm">Business Card Maker</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFlipped(!flipped)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1 text-slate-300">
            <RotateCcw className="w-3 h-3" /> Flip
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-56 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
          {/* Fields */}
          <div className="space-y-2">
            {[['name','Name'],['title','Title'],['company','Company'],['email','Email'],['phone','Phone'],['website','Website'],['tagline','Tagline']].map(([key, label]) => (
              <div key={key}>
                <label className="text-[10px] text-slate-400 mb-0.5 block">{label}</label>
                <input value={card[key]} onChange={e => update(key, e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
              </div>
            ))}
          </div>

          {/* Font */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Font</label>
            <select value={font} onChange={e => setFont(e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Layout */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Layout</label>
            <div className="grid grid-cols-3 gap-1">
              {['left','center','split'].map(l => (
                <button key={l} onClick={() => setLayout(l)}
                  className={`px-2 py-1 rounded text-[10px] capitalize transition-all ${layout===l ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-slate-900/30">
          {/* Card front */}
          <div className="relative" style={{ perspective: '1000px' }}>
            <div className="transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}>
              {/* Front */}
              <div className="w-[360px] h-[210px] rounded-xl shadow-2xl p-6 flex" style={{ ...bgStyle, fontFamily: font, backfaceVisibility: 'hidden' }}>
                {layout === 'left' && (
                  <div className="flex flex-col justify-between w-full">
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: template.text }}>{card.name}</h2>
                      <p className="text-sm opacity-80" style={{ color: template.accent }}>{card.title}</p>
                      <p className="text-xs opacity-60 mt-0.5" style={{ color: template.text }}>{card.company}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px]" style={{ color: template.text, opacity: 0.7 }}>{card.email}</p>
                      <p className="text-[10px]" style={{ color: template.text, opacity: 0.7 }}>{card.phone}</p>
                      <p className="text-[10px]" style={{ color: template.accent, opacity: 0.8 }}>{card.website}</p>
                    </div>
                  </div>
                )}
                {layout === 'center' && (
                  <div className="flex flex-col items-center justify-center w-full text-center">
                    <h2 className="text-xl font-bold" style={{ color: template.text }}>{card.name}</h2>
                    <p className="text-sm" style={{ color: template.accent }}>{card.title}</p>
                    <p className="text-xs opacity-60 mt-0.5 mb-3" style={{ color: template.text }}>{card.company}</p>
                    <div className="space-y-0.5">
                      <p className="text-[10px]" style={{ color: template.text, opacity: 0.7 }}>{card.email} | {card.phone}</p>
                      <p className="text-[10px]" style={{ color: template.accent }}>{card.website}</p>
                    </div>
                  </div>
                )}
                {layout === 'split' && (
                  <div className="flex w-full">
                    <div className="flex-1 flex flex-col justify-center pr-4 border-r" style={{ borderColor: template.accent + '30' }}>
                      <h2 className="text-xl font-bold" style={{ color: template.text }}>{card.name}</h2>
                      <p className="text-sm" style={{ color: template.accent }}>{card.title}</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center pl-4 space-y-1">
                      <p className="text-[10px]" style={{ color: template.text }}>{card.company}</p>
                      <p className="text-[10px]" style={{ color: template.text, opacity: 0.7 }}>{card.email}</p>
                      <p className="text-[10px]" style={{ color: template.text, opacity: 0.7 }}>{card.phone}</p>
                      <p className="text-[10px]" style={{ color: template.accent }}>{card.website}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Back */}
              <div className="w-[360px] h-[210px] rounded-xl shadow-2xl flex items-center justify-center absolute top-0 left-0"
                style={{ ...bgStyle, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center" style={{ fontFamily: font }}>
                  <p className="text-2xl font-bold" style={{ color: template.accent }}>{card.company}</p>
                  {card.tagline && <p className="text-xs mt-1 opacity-60" style={{ color: template.text }}>{card.tagline}</p>}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">Click "Flip" to see the back • 3.5" × 2" standard size</p>
        </div>

        {/* Right: Templates */}
        <div className="w-36 border-l border-slate-800 p-2 overflow-y-auto shrink-0">
          <label className="text-[10px] text-slate-400 mb-2 block text-center font-medium">TEMPLATES</label>
          <div className="space-y-1.5">
            {TEMPLATES.map(t => {
              const bg = t.bg.startsWith('linear') || t.bg.startsWith('rgba')
                ? { backgroundImage: t.bg } : { backgroundColor: t.bg };
              return (
                <button key={t.id} onClick={() => setTemplateId(t.id)}
                  className={`w-full h-12 rounded-lg border transition-all ${templateId===t.id ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-700 hover:border-slate-600'}`}
                  style={bg}>
                  <span className="text-[9px] font-medium" style={{ color: t.text }}>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
