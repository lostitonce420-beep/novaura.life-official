import { useState, useRef, useCallback, useEffect } from 'react';
import { Music, Plus, Play, Square, Trash2, Zap, Volume2, VolumeX, Cloud, Check, Loader2 } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { kernelStorage } from '../../kernel/kernelStorage.js';

// ─── Static Data ─────────────────────────────────────────────────────────────

const INSTRUMENTS = [
  { id: 'piano',   name: 'Piano',   wave: 'triangle',  emoji: '🎹' },
  { id: 'synth',   name: 'Synth',   wave: 'sawtooth',  emoji: '🎛️' },
  { id: 'bass',    name: 'Bass',    wave: 'sine',       emoji: '🎸' },
  { id: 'pad',     name: 'Pad',     wave: 'sine',       emoji: '🌊' },
  { id: 'lead',    name: 'Lead',    wave: 'square',     emoji: '⚡' },
  { id: 'strings', name: 'Strings', wave: 'sawtooth',   emoji: '🎻' },
  { id: 'organ',   name: 'Organ',   wave: 'sine',       emoji: '🎵' },
  { id: 'pluck',   name: 'Pluck',   wave: 'triangle',  emoji: '🪕' },
  { id: 'bells',   name: 'Bells',   wave: 'sine',       emoji: '🔔' },
  { id: 'drums',   name: 'Drums',   wave: 'square',     emoji: '🥁' },
  { id: 'flute',   name: 'Flute',   wave: 'sine',       emoji: '🪈' },
  { id: 'brass',   name: 'Brass',   wave: 'sawtooth',   emoji: '🎺' },
];

const GENRES = ['Electronic','Lo-Fi','Ambient','Hip-Hop','Classical','Jazz','Rock','Pop','Cinematic','Chillwave'];
const MOODS = [
  { name: 'Peaceful',   emoji: '🌿' }, { name: 'Energetic',  emoji: '⚡' },
  { name: 'Melancholic',emoji: '🌧️' }, { name: 'Dark',       emoji: '🌑' },
  { name: 'Uplifting',  emoji: '☀️' }, { name: 'Mysterious', emoji: '🔮' },
];
const SCALES = [
  { name: 'C Major',      notes: ['C','D','E','F','G','A','B'],     desc: 'Happy, bright' },
  { name: 'A Minor',      notes: ['A','B','C','D','E','F','G'],     desc: 'Sad, emotional' },
  { name: 'D Dorian',     notes: ['D','E','F','G','A','B','C'],     desc: 'Jazzy, groovy' },
  { name: 'E Phrygian',   notes: ['E','F','G','A','B','C','D'],     desc: 'Spanish, exotic' },
  { name: 'G Mixolydian', notes: ['G','A','B','C','D','E','F'],     desc: 'Bluesy, rock' },
  { name: 'C Pentatonic', notes: ['C','D','E','G','A'],             desc: 'Simple, universal' },
  { name: 'A Blues',      notes: ['A','C','D','D#','E','G'],        desc: 'Soulful, expressive' },
];

const NOTE_FREQ = {
  'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'B3':246.94,
  'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
  'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
};
const PIANO_NOTES = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5'];
const GRID_STEPS = 16;

// ─── Audio Engine ─────────────────────────────────────────────────────────────

let _audioCtx = null;
let _reverbBuffer = null;

function getCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function ensureReverb() {
  if (_reverbBuffer) return;
  const ctx = getCtx();
  const duration = 2.5, decay = 2.2;
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  _reverbBuffer = buf;
}

function makeDistortionCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Play a note with a full Web Audio effects chain.
 * Reverb  = ConvolverNode (synthetic impulse response)
 * Delay   = DelayNode + feedback GainNode
 * Chorus  = short DelayNode modulated by LFO oscillator
 * Distort = WaveShaperNode (wave-folding curve)
 */
function playNote(freq, wave = 'triangle', durationSec = 0.3, volume = 0.3, effects = {}, panVal = 0) {
  const ctx  = getCtx();
  const osc  = ctx.createOscillator();
  const env  = ctx.createGain();
  const pan  = ctx.createStereoPanner();

  osc.type = wave;
  osc.frequency.value = freq;
  pan.pan.value = Math.max(-1, Math.min(1, panVal / 100));
  env.gain.setValueAtTime(volume, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

  osc.connect(env);
  let src = env;
  const tail = durationSec + 1.2;

  // ── Distortion (WaveShaperNode) ──────────────────────────────────────────
  if ((effects.distortion || 0) > 0) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(effects.distortion * 3.5);
    shaper.oversample = '2x';
    src.connect(shaper);
    src = shaper;
  }

  // Dry path
  src.connect(pan);

  // ── Delay (DelayNode + feedback) ─────────────────────────────────────────
  if ((effects.delay || 0) > 0) {
    const delayNode = ctx.createDelay(1.0);
    const feedback  = ctx.createGain();
    const wetGain   = ctx.createGain();
    delayNode.delayTime.value = 0.28;
    feedback.gain.value       = Math.min(0.55, effects.delay / 160);
    wetGain.gain.value        = effects.delay / 140;
    src.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(pan);
  }

  // ── Reverb (ConvolverNode, synthetic impulse response) ───────────────────
  if ((effects.reverb || 0) > 0) {
    ensureReverb();
    const convolver = ctx.createConvolver();
    convolver.buffer = _reverbBuffer;
    const wetGain   = ctx.createGain();
    wetGain.gain.value = effects.reverb / 110;
    src.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(pan);
  }

  // ── Chorus (DelayNode modulated by LFO oscillator) ───────────────────────
  if ((effects.chorus || 0) > 0) {
    const chorusDelay = ctx.createDelay(0.05);
    chorusDelay.delayTime.value = 0.022;
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 1.8;
    lfoGain.gain.value  = 0.004 * (effects.chorus / 100);
    lfo.connect(lfoGain);
    lfoGain.connect(chorusDelay.delayTime);
    const wetGain = ctx.createGain();
    wetGain.gain.value = effects.chorus / 180;
    src.connect(chorusDelay);
    chorusDelay.connect(wetGain);
    wetGain.connect(pan);
    lfo.start();
    lfo.stop(ctx.currentTime + tail);
  }

  pan.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + tail);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createTrack(name, instrument = 'piano') {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, instrument, volume: 80, pan: 0, muted: false,
    effects: { reverb: 0, delay: 0, chorus: 0, distortion: 0 },
    notes: {},
  };
}

const DEFAULT_TRACKS = () => [createTrack('Piano Lead', 'piano'), createTrack('Bass Line', 'bass')];
const COMP_DOC = (uid) => `users/${uid}/music/main`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MusicComposerWindow() {
  const [title,      setTitle]      = useState('Untitled');
  const [bpm,        setBpm]        = useState(120);
  const [genre,      setGenre]      = useState('Electronic');
  const [mood,       setMood]       = useState('Peaceful');
  const [tracks,     setTracks]     = useState(DEFAULT_TRACKS);
  const [selectedId, setSelectedId] = useState(null);
  const [playing,    setPlaying]    = useState(false);
  const [step,       setStep]       = useState(-1);
  const [tab,        setTab]        = useState('mixer');
  const [saveStatus, setSaveStatus] = useState('saved');

  const intervalRef = useRef(null);
  const saveTimer   = useRef(null);
  const mounted     = useRef(false);

  const selected = tracks.find(t => t.id === selectedId) || null;

  // ── Load from Firestore on mount ──────────────────────────────────────────
  useEffect(() => {
    const uid = auth?.currentUser?.uid;

    const applyData = (d) => {
      if (d.tracks?.length) setTracks(d.tracks);
      if (d.title) setTitle(d.title);
      if (d.bpm)   setBpm(d.bpm);
      if (d.genre) setGenre(d.genre);
      if (d.mood)  setMood(d.mood);
    };

    const loadLocal = () => {
      try {
        const raw = kernelStorage.getItem('music_compositions');
        if (raw) applyData(JSON.parse(raw));
      } catch {}
    };

    if (!isFirebaseConfigured || !db || !uid) {
      loadLocal();
      setSaveStatus('local');
      mounted.current = true;
      return;
    }

    getDoc(doc(db, COMP_DOC(uid))).then(snap => {
      if (snap.exists()) applyData(snap.data());
      else loadLocal();
    }).catch(() => { loadLocal(); setSaveStatus('local'); })
      .finally(() => { mounted.current = true; });
  }, []);

  // ── Persist on every state change (debounced 1.2s) ───────────────────────
  const persist = useCallback((t, ti, b, g, m) => {
    const payload = { tracks: t, title: ti, bpm: b, genre: g, mood: m };
    kernelStorage.setItem('music_compositions', JSON.stringify(payload));

    const uid = auth?.currentUser?.uid;
    if (!isFirebaseConfigured || !db || !uid) { setSaveStatus('local'); return; }

    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, COMP_DOC(uid)), { ...payload, updatedAt: serverTimestamp(), uid }, { merge: true });
        setSaveStatus('saved');
      } catch { setSaveStatus('local'); }
    }, 1200);
  }, []);

  useEffect(() => {
    if (!mounted.current) return;
    persist(tracks, title, bpm, genre, mood);
  }, [tracks, title, bpm, genre, mood, persist]);

  // ── Sequencer playback engine ─────────────────────────────────────────────
  useEffect(() => {
    if (!playing) { clearInterval(intervalRef.current); setStep(-1); return; }
    const msPerStep = (60000 / bpm) / 4;
    let s = 0;
    setStep(0);
    intervalRef.current = setInterval(() => {
      setStep(s);
      for (const track of tracks) {
        if (track.muted) continue;
        const inst = INSTRUMENTS.find(i => i.id === track.instrument);
        for (const note of PIANO_NOTES) {
          if (track.notes[`${note}-${s}`]) {
            playNote(
              NOTE_FREQ[note],
              inst?.wave || 'triangle',
              (msPerStep / 1000) * 1.8,
              track.volume / 200,
              track.effects,
              track.pan
            );
          }
        }
      }
      s = (s + 1) % GRID_STEPS;
    }, msPerStep);
    return () => clearInterval(intervalRef.current);
  }, [playing, bpm, tracks]);

  // ── Track operations ──────────────────────────────────────────────────────
  const updateTracks = (fn) => setTracks(prev => typeof fn === 'function' ? fn(prev) : fn);

  const toggleNote = useCallback((trackId, note, si) => {
    updateTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;
      const key = `${note}-${si}`;
      const notes = { ...t.notes };
      if (notes[key]) delete notes[key]; else notes[key] = true;
      return { ...t, notes };
    }));
  }, []);

  const addTrack    = () => { const t = createTrack(`Track ${tracks.length + 1}`, 'synth'); updateTracks(prev => [...prev, t]); setSelectedId(t.id); };
  const deleteTrack = (id) => { updateTracks(prev => prev.filter(t => t.id !== id)); if (selectedId === id) setSelectedId(null); };
  const updateTrack  = (id, patch) => updateTracks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  const updateEffect = (id, fx, val) => updateTracks(prev => prev.map(t => t.id === id ? { ...t, effects: { ...t.effects, [fx]: val } } : t));

  const SaveBadge = () => (
    <span className={`flex items-center gap-1 text-[9px] font-mono ml-2 ${saveStatus === 'saved' ? 'text-green-400/60' : saveStatus === 'saving' ? 'text-yellow-400/60' : 'text-slate-500'}`}>
      {saveStatus === 'saving' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-2.5 h-2.5" /> : <Cloud className="w-2.5 h-2.5" />}
      {saveStatus === 'saving' ? 'saving...' : saveStatus === 'saved' ? 'saved' : 'local only'}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-900/60 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-400" />
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="bg-transparent border-none text-white font-semibold text-sm focus:outline-none w-40" />
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">{bpm} BPM</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">{genre}</span>
          <SaveBadge />
        </div>
        <button onClick={() => setPlaying(!playing)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${playing ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
          {playing ? <><Square className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Play</>}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800 shrink-0">
        {[['mixer','Mixer'],['roll','Piano Roll'],['effects','Effects'],['scales','Scales']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${tab===k ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── MIXER ── */}
        {tab === 'mixer' && (
          <div className="flex-1 flex">
            <div className="w-52 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">BPM: {bpm}</label>
                <input type="range" min="40" max="300" value={bpm} onChange={e => setBpm(+e.target.value)} className="w-full accent-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Genre</label>
                <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white">
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Mood</label>
                <div className="flex flex-wrap gap-1">
                  {MOODS.map(m => (
                    <button key={m.name} onClick={() => setMood(m.name)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${mood===m.name ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      {m.emoji} {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 space-y-1">
                <p>Tracks: {tracks.length}</p>
                <p>Instruments: {new Set(tracks.map(t => t.instrument)).size}</p>
                <p>Notes: {tracks.reduce((a, t) => a + Object.keys(t.notes).length, 0)}</p>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">TRACKS</span>
                <button onClick={addTrack} className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {tracks.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12">No tracks. Click Add to start.</p>
              ) : (
                <div className="space-y-2">
                  {tracks.map(track => (
                    <div key={track.id} onClick={() => setSelectedId(track.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedId===track.id ? 'bg-purple-900/40 border-purple-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{INSTRUMENTS.find(i => i.id === track.instrument)?.emoji || '🎵'}</span>
                          <input value={track.name} onClick={e => e.stopPropagation()} onChange={e => updateTrack(track.id, { name: e.target.value })}
                            className="bg-transparent text-sm font-medium text-white focus:outline-none w-28" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                            className={`p-1 rounded transition-all ${track.muted ? 'text-red-400' : 'text-slate-400 hover:text-white'}`}>
                            {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteTrack(track.id); }}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={track.instrument} onClick={e => e.stopPropagation()} onChange={e => updateTrack(track.id, { instrument: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300">
                          {INSTRUMENTS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input type="range" min="0" max="100" value={track.volume} onClick={e => e.stopPropagation()}
                          onChange={e => updateTrack(track.id, { volume: +e.target.value })} className="flex-1 accent-purple-500" />
                        <span className="text-[10px] text-slate-500 w-7 text-right">{track.volume}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PIANO ROLL ── */}
        {tab === 'roll' && (
          <div className="flex-1 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Select a track from Mixer to edit notes
              </div>
            ) : (
              <>
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">Editing:</span>
                  <span className="text-xs font-medium text-purple-300">{selected.name}</span>
                  <span className="text-[10px] text-slate-500">({selected.instrument})</span>
                  {playing && <span className="text-[10px] text-green-400 animate-pulse ml-auto">● Playing</span>}
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="inline-flex flex-col min-w-full">
                    <div className="flex sticky top-0 z-10 bg-slate-950">
                      <div className="w-12 shrink-0" />
                      {Array.from({ length: GRID_STEPS }, (_, i) => (
                        <div key={i} className={`w-8 h-5 flex items-center justify-center text-[9px] border-r border-slate-800 ${step===i ? 'bg-purple-600/40 text-white' : i%4===0 ? 'text-slate-400' : 'text-slate-600'}`}>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    {[...PIANO_NOTES].reverse().map(note => (
                      <div key={note} className="flex">
                        <div className={`w-12 shrink-0 text-[9px] px-1 flex items-center border-r border-b border-slate-800 ${note.startsWith('C') ? 'text-cyan-400 bg-slate-900/50' : 'text-slate-500'}`}>
                          {note}
                        </div>
                        {Array.from({ length: GRID_STEPS }, (_, si) => {
                          const active = selected.notes[`${note}-${si}`];
                          const inst = INSTRUMENTS.find(i => i.id === selected.instrument);
                          return (
                            <button key={si}
                              onClick={() => {
                                toggleNote(selected.id, note, si);
                                if (!active) playNote(NOTE_FREQ[note], inst?.wave || 'triangle', 0.25, 0.25, selected.effects, selected.pan);
                              }}
                              className={`w-8 h-5 border-r border-b transition-all ${
                                active      ? 'bg-purple-500 hover:bg-purple-400' :
                                step === si ? 'bg-purple-900/30 border-slate-700 hover:bg-purple-800/40' :
                                si % 4 === 0 ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' :
                                              'bg-slate-950 border-slate-800/50 hover:bg-slate-900'
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── EFFECTS ── */}
        {tab === 'effects' && (
          <div className="flex-1 p-4 overflow-y-auto">
            {!selected ? (
              <p className="text-slate-500 text-sm text-center py-12">Select a track to adjust effects</p>
            ) : (
              <div className="max-w-md mx-auto space-y-5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" /> Effects — {selected.name}
                </h3>

                {[
                  { key: 'reverb',     label: 'Reverb',     desc: 'ConvolverNode — room simulation' },
                  { key: 'delay',      label: 'Delay',      desc: 'DelayNode + feedback — echo' },
                  { key: 'chorus',     label: 'Chorus',     desc: 'LFO-modulated delay — shimmer' },
                  { key: 'distortion', label: 'Distortion', desc: 'WaveShaperNode — saturation' },
                ].map(({ key, label, desc }) => (
                  <div key={key}>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="text-xs text-slate-300 font-medium">{label}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-600">{desc}</span>
                        <span className="text-xs text-purple-400 w-8 text-right">{selected.effects[key]}%</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={selected.effects[key]}
                      onChange={e => updateEffect(selected.id, key, +e.target.value)}
                      className="w-full accent-purple-500" />
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="text-xs text-slate-300 font-medium">Pan</label>
                    <span className="text-xs text-purple-400">
                      {selected.pan > 0 ? `R${selected.pan}` : selected.pan < 0 ? `L${Math.abs(selected.pan)}` : 'Center'}
                    </span>
                  </div>
                  <input type="range" min="-100" max="100" value={selected.pan}
                    onChange={e => updateTrack(selected.id, { pan: +e.target.value })}
                    className="w-full accent-purple-500" />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>Left</span><span>Center</span><span>Right</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCALES ── */}
        {tab === 'scales' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-semibold text-sm mb-3">Scales & Theory</h3>
              {SCALES.map(s => (
                <button key={s.name}
                  onClick={() => {
                    s.notes.forEach((n, i) => {
                      const freq = NOTE_FREQ[`${n}4`] || NOTE_FREQ[`${n}3`];
                      if (freq) setTimeout(() => playNote(freq, 'triangle', 0.4, 0.2), i * 250);
                    });
                  }}
                  className="w-full text-left p-3 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all">
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.desc}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{s.notes.join(' — ')}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
