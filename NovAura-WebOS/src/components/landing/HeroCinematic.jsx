import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Wand2, RefreshCw, Server, Cloud } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://us-central1-novaura-systems.cloudfunctions.net/api';

// Default atmospheric frames if user hasn't generated any
const DEFAULT_FRAMES = [
  'https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2076&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2011&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop',
];

const PROMPT_PRESETS = [
  {
    id: 'cyber-horizon',
    name: 'Cyber Horizon',
    prompt: 'Cinematic wide shot of a futuristic neon city at dusk, holographic billboards, flying vehicles, deep blue and cyan color palette, ultra detailed, 8k, sci-fi concept art, atmospheric fog, lens flare',
    negative: 'blurry, low quality, people, text, watermark, signature'
  },
  {
    id: 'neural-void',
    name: 'Neural Void',
    prompt: 'Abstract visualization of an artificial neural network in deep space, glowing synapses, purple and pink energy streams, dark background, ethereal, cinematic lighting, 8k render',
    negative: 'busy, cluttered, text, watermark, ugly, deformed'
  },
  {
    id: 'nova-core',
    name: 'Nova Core',
    prompt: 'Massive glowing energy core inside a high-tech facility, cyan and white light emanating from crystalline structures, steam, dramatic shadows, sci-fi industrial, 8k, cinematic',
    negative: 'humans, people, text, watermark, low quality, blurry'
  },
  {
    id: 'digital-garden',
    name: 'Digital Garden',
    prompt: 'Bioluminescent forest with trees made of circuit boards and fiber optics, fireflies as data particles, green and teal palette, dreamlike atmosphere, cinematic wide shot, 8k',
    negative: 'dark, gloomy, people, text, watermark, signature'
  }
];

const PROVIDERS = [
  { id: 'vertex', name: 'Vertex Cloud', icon: Cloud },
  { id: 'forge', name: 'Local Forge', icon: Server },
];

function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 60;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2
      });
    }

    let frame = 0;
    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const a = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);
        ctx.fillStyle = `rgba(0, 212, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (frame % 2 === 0) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

export default function HeroCinematic({
  className = '',
  autoPlay = true,
  interval = 6000,
  showControls = true
}) {
  const [frames, setFrames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('novaura_hero_frames') || 'null') || DEFAULT_FRAMES;
    } catch {
      return DEFAULT_FRAMES;
    }
  });
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(!autoPlay);
  const [generating, setGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PROMPT_PRESETS[0]);
  const [provider, setProvider] = useState(() => {
    try {
      return localStorage.getItem('novaura_hero_provider') || 'vertex';
    } catch {
      return 'vertex';
    }
  });
  const [localEndpoint, setLocalEndpoint] = useState(() => {
    try {
      return localStorage.getItem('novaura_hero_local_endpoint') || 'http://localhost:7860';
    } catch {
      return 'http://localhost:7860';
    }
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const timerRef = useRef(null);

  const nextFrame = useCallback(() => {
    setCurrent(c => (c + 1) % frames.length);
  }, [frames.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(nextFrame, interval);
    return () => clearInterval(timerRef.current);
  }, [paused, interval, nextFrame]);

  const checkForgeHealth = async () => {
    try {
      const res = await fetch(`${localEndpoint}/sdapi/v1/samplers`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  };

  const generateFrames = async () => {
    setGenerating(true);
    const newFrames = [];

    try {
      if (provider === 'vertex') {
        const variations = [
          selectedPreset.prompt,
          `${selectedPreset.prompt}, dawn atmosphere`,
          `${selectedPreset.prompt}, twilight atmosphere`,
          `${selectedPreset.prompt}, stormy atmosphere`
        ];
        for (const prompt of variations) {
          const res = await fetch(`${BACKEND_URL}/vertex/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, aspectRatio: '16:9' })
          });
          const data = await res.json();
          if (data.success && data.imageUrl) {
            newFrames.push(data.imageUrl);
          } else {
            throw new Error(data.error || 'Generation failed');
          }
        }
      } else if (provider === 'forge') {
        const healthy = await checkForgeHealth();
        if (!healthy) {
          throw new Error('Local Forge not reachable. Make sure it is running with --api --cors-allow-origins="*"');
        }
        const variations = [
          selectedPreset.prompt,
          `${selectedPreset.prompt}, dawn atmosphere`,
          `${selectedPreset.prompt}, twilight atmosphere`,
          `${selectedPreset.prompt}, stormy atmosphere`
        ];
        for (const prompt of variations) {
          const res = await fetch(`${localEndpoint}/sdapi/v1/txt2img`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              negative_prompt: selectedPreset.negative || '',
              steps: 25,
              cfg_scale: 7,
              width: 1024,
              height: 576,
              sampler_name: 'DPM++ 2M Karras',
              seed: -1,
              n_iter: 1,
              batch_size: 1
            })
          });
          const data = await res.json();
          const b64 = data.images?.[0];
          if (b64) {
            newFrames.push(`data:image/png;base64,${b64}`);
          } else {
            throw new Error('Local generation returned no image');
          }
        }
      }

      setFrames(newFrames);
      setCurrent(0);
      localStorage.setItem('novaura_hero_frames', JSON.stringify(newFrames));
      toast.success(`Generated ${newFrames.length} cinematic frames via ${provider === 'vertex' ? 'Vertex' : 'Local Forge'}`);
    } catch (err) {
      toast.error(err.message || 'Frame generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const resetToDefaults = () => {
    setFrames(DEFAULT_FRAMES);
    setCurrent(0);
    localStorage.removeItem('novaura_hero_frames');
    toast.success('Reset to default frames');
  };

  const activeProvider = PROVIDERS.find(p => p.id === provider);
  const ProviderIcon = activeProvider?.icon || Cloud;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 ${className}`}>
      {/* Image Stack with Parallax Crossfade */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          {frames.map((src, i) => (
            i === current && (
              <motion.div
                key={`${src}-${i}`}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <motion.img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  initial={{ x: '-2%' }}
                  animate={{ x: '2%' }}
                  transition={{ duration: interval / 1000, ease: 'linear' }}
                  style={{ scale: 1.15 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      <ParticleField />

      {/* Progress Dots */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {frames.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause */}
      {showControls && (
        <button
          onClick={() => setPaused(p => !p)}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors z-10"
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      )}

      {/* Generation Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="relative">
          <button
            disabled={generating}
            onClick={() => setPanelOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white/80 hover:bg-black/80 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ProviderIcon className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'Generate Frames'}
          </button>

          {panelOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 p-3 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md">
              {/* Provider Toggle */}
              <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wider">Provider</p>
              <div className="flex gap-1 mb-3 p-1 rounded-lg bg-white/5">
                {PROVIDERS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProvider(p.id);
                        localStorage.setItem('novaura_hero_provider', p.id);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium transition-colors ${
                        provider === p.id
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {p.name}
                    </button>
                  );
                })}
              </div>

              {provider === 'forge' && (
                <>
                  <p className="text-[10px] text-white/50 mb-1 uppercase tracking-wider">Local Endpoint</p>
                  <input
                    type="text"
                    value={localEndpoint}
                    onChange={(e) => {
                      setLocalEndpoint(e.target.value);
                      localStorage.setItem('novaura_hero_local_endpoint', e.target.value);
                    }}
                    className="w-full mb-3 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/30"
                    placeholder="http://localhost:7860"
                  />
                </>
              )}

              <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wider">Style Preset</p>
              <div className="space-y-1 mb-3 max-h-32 overflow-y-auto scrollbar-thin">
                {PROMPT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                      selectedPreset.id === preset.id
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <button
                onClick={generateFrames}
                disabled={generating}
                className="w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
              >
                {generating
                  ? `Generating 4 frames via ${provider === 'vertex' ? 'Vertex' : 'Forge'}...`
                  : `Generate via ${provider === 'vertex' ? 'Vertex' : 'Local Forge'}`}
              </button>
              <button
                onClick={resetToDefaults}
                className="w-full mt-2 py-1.5 rounded-lg text-white/40 text-xs hover:text-white/70 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Frame Counter / Info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] text-white/50 uppercase tracking-wider backdrop-blur-sm">
          Frame {current + 1} / {frames.length}
        </div>
      </div>
    </div>
  );
}
