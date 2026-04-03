import React, { useState, useRef, useCallback } from 'react';
import { User, Palette, Save, Download, Shuffle, Shirt, Smile, Scissors, Grid, Trash2 } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const SKIN_TONES = ['#FFDBB4','#EDB98A','#D08B5B','#AE5D29','#694D3D','#3B2219'];
const HAIR_COLORS = ['#090806','#2C222B','#71635A','#B7A69E','#D6C4C2','#DEBC99','#B55239','#8D4A43','#CF3476','#4B0082','#00D9FF'];
const EYE_COLORS = ['#634E34','#2E536F','#3D671D','#1C7847','#497665','#9B59B6','#E74C3C','#00D9FF'];

const FACE_SHAPES = ['round','oval','square','heart','long'];
const BODY_TYPES = ['slim','average','athletic','curvy','muscular'];
const HAIR_STYLES = ['short','medium','long','buzz','curly','wavy','mohawk','braids','bald','ponytail'];
const EXPRESSIONS = ['neutral','happy','confident','mysterious','fierce','playful','serene','determined'];
const ACCESSORIES = ['none','glasses','sunglasses','earrings','necklace','headband','mask','crown','horns','halo'];
const OUTFITS = ['casual','formal','athletic','fantasy','cyberpunk','gothic','steampunk','minimal'];

const EMOJI_MAP = {
  face: { round:'🟡', oval:'🥚', square:'⬜', heart:'❤️', long:'📏' },
  body: { slim:'🧍', average:'🧍', athletic:'🏃', curvy:'💃', muscular:'💪' },
  hair: { short:'✂️', medium:'💇', long:'👩‍🦰', buzz:'👨‍🦲', curly:'🌀', wavy:'🌊', mohawk:'🦔', braids:'🪢', bald:'👨‍🦲', ponytail:'🎀' },
  expression: { neutral:'😐', happy:'😊', confident:'😏', mysterious:'🤔', fierce:'😤', playful:'😜', serene:'😌', determined:'💪' },
};

export default function AvatarBuilderWindow() {
  const [avatar, setAvatar] = useState({
    skinTone: '#EDB98A', hairColor: '#090806', eyeColor: '#634E34',
    faceShape: 'oval', bodyType: 'average', hairStyle: 'medium',
    expression: 'neutral', accessory: 'none', outfit: 'casual',
    name: 'My Avatar',
  });
  const [tab, setTab] = useState('face');
  const [savedAvatars, setSavedAvatars] = useState(() => JSON.parse(kernelStorage.getItem('saved_avatars') || '[]'));
  const previewRef = useRef(null);

  const update = (field, value) => setAvatar(prev => ({ ...prev, [field]: value }));

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setAvatar({
      skinTone: pick(SKIN_TONES), hairColor: pick(HAIR_COLORS), eyeColor: pick(EYE_COLORS),
      faceShape: pick(FACE_SHAPES), bodyType: pick(BODY_TYPES), hairStyle: pick(HAIR_STYLES),
      expression: pick(EXPRESSIONS), accessory: pick(ACCESSORIES), outfit: pick(OUTFITS),
      name: avatar.name,
    });
  };

  const saveAvatar = () => {
    const saved = JSON.parse(kernelStorage.getItem('saved_avatars') || '[]');
    saved.push({ ...avatar, id: `avatar-${Date.now()}`, createdAt: new Date().toISOString() });
    kernelStorage.setItem('saved_avatars', JSON.stringify(saved));
    setSavedAvatars(saved);
  };

  const loadAvatar = (saved) => {
    const { id, createdAt, ...rest } = saved;
    setAvatar(rest);
    setTab('face');
  };

  const deleteAvatar = (id) => {
    const updated = savedAvatars.filter(a => a.id !== id);
    kernelStorage.setItem('saved_avatars', JSON.stringify(updated));
    setSavedAvatars(updated);
  };

  const exportAsImage = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = el.offsetWidth * scale;
    canvas.height = el.offsetHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, avatar.skinTone + '40');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fill();

    const cx = w / 2;
    ctx.fillStyle = avatar.hairColor;
    ctx.beginPath();
    ctx.ellipse(cx, 28, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = avatar.skinTone;
    ctx.strokeStyle = avatar.skinTone + '80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, 40, 32, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = avatar.eyeColor;
    ctx.beginPath();
    ctx.arc(cx - 10, 40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 10, 40, 5, 0, Math.PI * 2);
    ctx.fill();

    const expr = EMOJI_MAP.expression[avatar.expression] || '😐';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText(expr, cx, 62);

    ctx.fillStyle = avatar.skinTone + '60';
    ctx.beginPath();
    ctx.roundRect(cx - 40, h - 64, 80, 64, [16, 16, 0, 0]);
    ctx.fill();

    if (avatar.accessory !== 'none') {
      const accEmoji = avatar.accessory === 'glasses' ? '👓' : avatar.accessory === 'sunglasses' ? '🕶️' : avatar.accessory === 'crown' ? '👑' : avatar.accessory === 'mask' ? '🎭' : avatar.accessory === 'horns' ? '😈' : avatar.accessory === 'halo' ? '😇' : '✨';
      ctx.font = '14px serif';
      ctx.textAlign = 'right';
      ctx.fillText(accEmoji, w - 4, 16);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(avatar.name, cx, h - 4);

    const link = document.createElement('a');
    link.download = `${avatar.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [avatar]);

  const TABS = [
    { id: 'face', label: 'Face', icon: Smile },
    { id: 'body', label: 'Body', icon: User },
    { id: 'hair', label: 'Hair', icon: Scissors },
    { id: 'style', label: 'Style', icon: Shirt },
    { id: 'gallery', label: 'Gallery', icon: Grid },
  ];

  // Avatar visual preview
  const AvatarPreview = () => (
    <div className="flex flex-col items-center gap-2">
      <div ref={previewRef} className="relative w-32 h-40 rounded-2xl border-2 border-slate-700 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${avatar.skinTone}40, #1a1a2e)` }}>
        {/* Head */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-18 rounded-full border-2"
          style={{ backgroundColor: avatar.skinTone, borderColor: `${avatar.skinTone}80` }}>
          {/* Eyes */}
          <div className="flex justify-center gap-3 mt-5">
            <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: avatar.eyeColor, borderColor: '#00000040' }} />
            <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: avatar.eyeColor, borderColor: '#00000040' }} />
          </div>
          {/* Expression */}
          <div className="text-center mt-1 text-[10px]">{EMOJI_MAP.expression[avatar.expression] || '😐'}</div>
          {/* Hair indicator */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-t-full" style={{ backgroundColor: avatar.hairColor }} />
        </div>
        {/* Body silhouette */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-16 rounded-t-2xl"
          style={{ backgroundColor: `${avatar.skinTone}60` }} />
        {/* Accessory badge */}
        {avatar.accessory !== 'none' && (
          <div className="absolute top-1 right-1 text-sm">
            {avatar.accessory === 'glasses' ? '👓' : avatar.accessory === 'sunglasses' ? '🕶️' : avatar.accessory === 'crown' ? '👑' : avatar.accessory === 'mask' ? '🎭' : avatar.accessory === 'horns' ? '😈' : avatar.accessory === 'halo' ? '😇' : '✨'}
          </div>
        )}
      </div>
      <input value={avatar.name} onChange={e => update('name', e.target.value)}
        className="text-center text-xs bg-transparent text-white border-none focus:outline-none w-32" />
      <div className="text-[9px] text-slate-500 capitalize">{avatar.bodyType} · {avatar.outfit} · {avatar.expression}</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-rose-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold">Avatar Builder</span>
        </div>
        <div className="flex gap-1">
          <button onClick={randomize} title="Randomize" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Shuffle className="w-3.5 h-3.5" /></button>
          <button onClick={saveAvatar} title="Save" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Save className="w-3.5 h-3.5" /></button>
          <button onClick={exportAsImage} title="Export PNG" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="w-44 flex items-center justify-center border-r border-slate-800 shrink-0">
          <AvatarPreview />
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 px-3 py-1.5 border-b border-slate-800/50 shrink-0">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] ${tab === t.id ? 'bg-rose-600/30 text-rose-300' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Icon className="w-3 h-3" />{t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {tab === 'face' && (
              <>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">SKIN TONE</label>
                  <div className="flex gap-1.5">
                    {SKIN_TONES.map(c => (
                      <button key={c} onClick={() => update('skinTone', c)}
                        className={`w-7 h-7 rounded-full border-2 ${avatar.skinTone === c ? 'border-white scale-110' : 'border-slate-700'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">EYE COLOR</label>
                  <div className="flex gap-1.5">
                    {EYE_COLORS.map(c => (
                      <button key={c} onClick={() => update('eyeColor', c)}
                        className={`w-6 h-6 rounded-full border-2 ${avatar.eyeColor === c ? 'border-white scale-110' : 'border-slate-700'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">FACE SHAPE</label>
                  <div className="flex flex-wrap gap-1">
                    {FACE_SHAPES.map(f => (
                      <button key={f} onClick={() => update('faceShape', f)}
                        className={`px-2 py-1 rounded text-[10px] capitalize ${avatar.faceShape === f ? 'bg-rose-600/30 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">EXPRESSION</label>
                  <div className="flex flex-wrap gap-1">
                    {EXPRESSIONS.map(e => (
                      <button key={e} onClick={() => update('expression', e)}
                        className={`px-2 py-1 rounded text-[10px] capitalize ${avatar.expression === e ? 'bg-rose-600/30 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>
                        {EMOJI_MAP.expression[e]} {e}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'body' && (
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">BODY TYPE</label>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_TYPES.map(b => (
                    <button key={b} onClick={() => update('bodyType', b)}
                      className={`px-3 py-2 rounded-lg text-xs capitalize ${avatar.bodyType === b ? 'bg-rose-600/30 text-rose-300 border border-rose-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{b}</button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'hair' && (
              <>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">HAIR COLOR</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {HAIR_COLORS.map(c => (
                      <button key={c} onClick={() => update('hairColor', c)}
                        className={`w-6 h-6 rounded-full border-2 ${avatar.hairColor === c ? 'border-white scale-110' : 'border-slate-700'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">HAIR STYLE</label>
                  <div className="flex flex-wrap gap-1">
                    {HAIR_STYLES.map(h => (
                      <button key={h} onClick={() => update('hairStyle', h)}
                        className={`px-2 py-1 rounded text-[10px] capitalize ${avatar.hairStyle === h ? 'bg-rose-600/30 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>{h}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'style' && (
              <>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">OUTFIT</label>
                  <div className="flex flex-wrap gap-1.5">
                    {OUTFITS.map(o => (
                      <button key={o} onClick={() => update('outfit', o)}
                        className={`px-3 py-2 rounded-lg text-xs capitalize ${avatar.outfit === o ? 'bg-rose-600/30 text-rose-300 border border-rose-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{o}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">ACCESSORY</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESSORIES.map(a => (
                      <button key={a} onClick={() => update('accessory', a)}
                        className={`px-3 py-2 rounded-lg text-xs capitalize ${avatar.accessory === a ? 'bg-rose-600/30 text-rose-300 border border-rose-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{a}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'gallery' && (
              <div>
                {savedAvatars.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">No saved avatars yet</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {savedAvatars.map(s => (
                      <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center gap-1.5">
                        <div className="relative w-16 h-20 rounded-xl border border-slate-700 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${s.skinTone}40, #1a1a2e)` }}>
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-9 rounded-full"
                            style={{ backgroundColor: s.skinTone }}>
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-2 rounded-t-full" style={{ backgroundColor: s.hairColor }} />
                            <div className="flex justify-center gap-1.5 mt-2.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.eyeColor }} />
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.eyeColor }} />
                            </div>
                            <div className="text-center text-[8px]">{EMOJI_MAP.expression[s.expression] || '😐'}</div>
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-8 rounded-t-xl"
                            style={{ backgroundColor: `${s.skinTone}60` }} />
                        </div>
                        <span className="text-[10px] text-slate-300 truncate w-full text-center">{s.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => loadAvatar(s)}
                            className="px-2 py-0.5 rounded text-[9px] bg-rose-600/30 text-rose-300 hover:bg-rose-600/50">Load</button>
                          <button onClick={() => deleteAvatar(s.id)}
                            className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
