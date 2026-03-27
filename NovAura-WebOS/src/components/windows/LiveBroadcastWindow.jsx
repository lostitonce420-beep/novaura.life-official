import React, { useState, useRef, useEffect } from 'react';
import { Radio, Mic, MicOff, Volume2, VolumeX, Play, Square, Settings, Users, Clock, Wifi, Music } from 'lucide-react';

const SHOW_TYPES = [
  { id: 'talkshow', label: 'Talk Show', icon: '🎙️', desc: 'Live discussions and interviews' },
  { id: 'podcast', label: 'Podcast', icon: '🎧', desc: 'Recorded audio episodes' },
  { id: 'music', label: 'Music Stream', icon: '🎵', desc: 'Live music and DJ sets' },
  { id: 'asmr', label: 'ASMR', icon: '🌙', desc: 'Relaxing audio content' },
  { id: 'news', label: 'News / Updates', icon: '📰', desc: 'Announcements and updates' },
  { id: 'gaming', label: 'Game Commentary', icon: '🎮', desc: 'Live gaming audio commentary' },
];

export default function LiveBroadcastWindow() {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showType, setShowType] = useState('talkshow');
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [listeners, setListeners] = useState(0);
  const [view, setView] = useState('setup'); // setup | live | episodes
  const [episodes, setEpisodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('broadcast_episodes') || '[]'); } catch { return []; }
  });
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatTime = (s) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const startBroadcast = async () => {
    if (!showTitle.trim()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Audio level visualization
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      setIsLive(true);
      setView('live');
      setElapsed(0);

      // Simulated listeners
      setListeners(Math.floor(Math.random() * 5) + 1);
      const listenerInterval = setInterval(() => {
        setListeners(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
      }, 10000);

      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

      // Store the listener interval for cleanup
      timerRef.current._listenerInterval = listenerInterval;
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopBroadcast = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (timerRef.current) {
      clearInterval(timerRef.current);
      if (timerRef.current._listenerInterval) clearInterval(timerRef.current._listenerInterval);
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (audioContextRef.current) audioContextRef.current.close();

    // Save episode
    const episode = {
      id: `ep-${Date.now()}`,
      title: showTitle,
      type: showType,
      description: showDescription,
      duration: elapsed,
      listeners: listeners,
      recordedAt: new Date().toISOString(),
    };
    const updated = [...episodes, episode];
    setEpisodes(updated);
    localStorage.setItem('broadcast_episodes', JSON.stringify(updated));

    setIsLive(false);
    setAudioLevel(0);
    setView('setup');
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  // Live view
  if (view === 'live') {
    const typeInfo = SHOW_TYPES.find(t => t.id === showType) || SHOW_TYPES[0];
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-900/40 to-slate-900 border-b border-red-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400">LIVE</span>
            <span className="text-xs text-slate-400">{showTitle}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" />{listeners}</span>
            <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(elapsed)}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          {/* Audio visualizer */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-red-600/30 flex items-center justify-center"
              style={{ boxShadow: `0 0 ${30 + audioLevel * 60}px rgba(239, 68, 68, ${0.2 + audioLevel * 0.4})` }}>
              <span className="text-5xl">{typeInfo.icon}</span>
            </div>
            {/* Level rings */}
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            {audioLevel > 0.3 && <div className="absolute -inset-3 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '3s' }} />}
          </div>

          {/* Audio level bar */}
          <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-75"
              style={{ width: `${audioLevel * 100}%`, background: audioLevel > 0.7 ? '#ef4444' : audioLevel > 0.4 ? '#eab308' : '#22c55e' }} />
          </div>

          <div className="text-center">
            <div className="text-lg font-bold">{showTitle}</div>
            <div className="text-xs text-slate-400">{typeInfo.label}</div>
            {showDescription && <div className="text-[10px] text-slate-500 mt-1 max-w-xs">{showDescription}</div>}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
          <button onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-amber-600/30 text-amber-400' : 'bg-slate-800 text-white'}`}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={stopBroadcast}
            className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white">
            <Square className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Episodes view
  if (view === 'episodes') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setView('setup')} className="text-[10px] text-slate-400 hover:text-white">← Back</button>
          <Music className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold">Past Episodes</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {episodes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No episodes recorded yet</div>
          ) : (
            <div className="space-y-2">
              {episodes.slice().reverse().map(ep => {
                const typeInfo = SHOW_TYPES.find(t => t.id === ep.type) || SHOW_TYPES[0];
                return (
                  <div key={ep.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{ep.title}</div>
                        <div className="text-[9px] text-slate-500">{typeInfo.label} · {formatTime(ep.duration)} · {ep.listeners} peak listeners</div>
                        <div className="text-[9px] text-slate-600">{new Date(ep.recordedAt).toLocaleString()}</div>
                      </div>
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

  // Setup view
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold">Live Broadcasting</span>
        </div>
        {episodes.length > 0 && (
          <button onClick={() => setView('episodes')} className="text-[10px] text-slate-400 hover:text-white">{episodes.length} episodes</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">SHOW TITLE</label>
          <input value={showTitle} onChange={e => setShowTitle(e.target.value)} placeholder="Name your broadcast..."
            className="w-full px-3 py-2 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50" />
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">SHOW TYPE</label>
          <div className="grid grid-cols-2 gap-1.5">
            {SHOW_TYPES.map(t => (
              <button key={t.id} onClick={() => setShowType(t.id)}
                className={`p-2 rounded-lg text-left transition-all ${showType === t.id ? 'bg-red-900/30 border-red-700' : 'bg-slate-900/40 border-slate-800'} border`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <div className="text-[10px] font-medium">{t.label}</div>
                    <div className="text-[8px] text-slate-500">{t.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">DESCRIPTION (optional)</label>
          <textarea value={showDescription} onChange={e => setShowDescription(e.target.value)}
            placeholder="What's your show about?"
            className="w-full px-3 py-2 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 resize-none focus:outline-none" rows={3} />
        </div>

        <button onClick={startBroadcast} disabled={!showTitle.trim()}
          className="w-full py-3 bg-red-600/60 hover:bg-red-500/60 border border-red-700 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 disabled:opacity-30">
          <Radio className="w-4 h-4" /> Go Live
        </button>

        <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800">
          <div className="text-[10px] text-slate-400 mb-1">Requirements</div>
          <ul className="text-[9px] text-slate-500 space-y-0.5">
            <li>• Microphone access (browser will ask permission)</li>
            <li>• Stable internet connection for live streaming</li>
            <li>• Currently: local recording only (server streaming coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
