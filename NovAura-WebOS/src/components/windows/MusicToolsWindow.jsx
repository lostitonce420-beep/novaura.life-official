import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Music, 
  Mic, 
  Guitar, 
  AudioLines,
  Activity,
  Settings,
  Volume2,
  Play,
  Pause,
  Plus,
  Minus,
  RotateCcw,
  Target,
  ChevronRight,
  ChevronDown,
  Wand2,
  Headphones,
  Settings2,
  Timer,
  Drum,
  Bell,
  Zap,
  Waves,
  BarChart3,
  Save,
  Share2,
  Copy,
  CheckCircle2,
  X,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

const NOTE_FREQUENCIES: Record<string, number> = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
  'C8': 4186.01
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES = {
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Minor': [0, 2, 3, 5, 7, 8, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
};

const METRONOME_SOUNDS = {
  'Click': 'sine',
  'Woodblock': 'square',
  'Hi-hat': 'triangle',
  'Beep': 'sawtooth',
};

// =============================================================================
// AUDIO UTILITIES
// =============================================================================

class AudioContextManager {
  ctx: AudioContext | null = null;
  
  init() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }
  
  getContext() {
    return this.ctx || this.init();
  }
}

const audioManager = new AudioContextManager();

// =============================================================================
// TUNER COMPONENT
// =============================================================================

function TunerPanel() {
  const [isListening, setIsListening] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState(0);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [cents, setCents] = useState(0);
  const [volume, setVolume] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState<'voice' | 'guitar' | 'piano' | 'bass'>('voice');
  const [referencePitch, setReferencePitch] = useState(440);
  const [highlightScale, setHighlightScale] = useState<string>('Chromatic');
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-correlation pitch detection
  const autoCorrelate = useCallback((buf: Float32Array, sampleRate: number) => {
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }, []);

  const getNoteFromFrequency = useCallback((freq: number) => {
    const noteNum = 12 * (Math.log(freq / referencePitch) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const octave = Math.floor(noteIndex / 12) - 1;
    const noteName = NOTE_NAMES[noteIndex % 12];
    return { note: `${noteName}${octave}`, cents: (noteNum - Math.round(noteNum)) * 100, noteIndex };
  }, [referencePitch]);

  const startTuner = async () => {
    try {
      const ctx = audioManager.init();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }});
      
      mediaStreamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      setIsListening(true);
      toast.success('Tuner activated! Play a note.');
      
      const detectPitch = () => {
        if (!analyserRef.current) return;
        
        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);
        
        const freq = autoCorrelate(buffer, ctx.sampleRate);
        
        if (freq !== -1 && freq > 50 && freq < 2000) {
          setDetectedFreq(freq);
          const { note, cents, noteIndex } = getNoteFromFrequency(freq);
          setDetectedNote(note);
          setCents(cents);
          
          // Calculate volume
          const sum = buffer.reduce((a, b) => a + Math.abs(b), 0);
          setVolume(Math.min(100, (sum / buffer.length) * 500));
        }
        
        rafRef.current = requestAnimationFrame(detectPitch);
      };
      
      detectPitch();
      
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopTuner = () => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    analyserRef.current = null;
    setIsListening(false);
    setDetectedFreq(0);
    setDetectedNote('');
    setVolume(0);
  };

  // Draw tuner visualization
  useEffect(() => {
    if (!canvasRef.current || !isListening) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvasRef.current!.width;
      const h = canvasRef.current!.height;
      
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);
      
      // Draw center line
      ctx.strokeStyle = '#ffffff20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, 20);
      ctx.lineTo(w / 2, h - 20);
      ctx.stroke();
      
      // Draw tick marks
      for (let i = -50; i <= 50; i += 10) {
        const x = w / 2 + (i / 50) * (w / 2 - 40);
        ctx.strokeStyle = i === 0 ? '#00f0ff' : '#ffffff40';
        ctx.lineWidth = i === 0 ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(x, h / 2 - 10);
        ctx.lineTo(x, h / 2 + 10);
        ctx.stroke();
      }
      
      // Draw needle
      if (detectedNote) {
        const needleX = w / 2 + (cents / 50) * (w / 2 - 40);
        const color = Math.abs(cents) < 5 ? '#00ff88' : Math.abs(cents) < 20 ? '#ffaa00' : '#ff4444';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(needleX, 30);
        ctx.lineTo(needleX, h - 30);
        ctx.stroke();
        
        // Draw glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(needleX, h / 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }, [isListening, cents, detectedNote]);

  const playReferenceTone = (note: string) => {
    const ctx = audioManager.init();
    const freq = NOTE_FREQUENCIES[note];
    if (!freq) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.value = freq;
    osc.type = selectedInstrument === 'guitar' ? 'sawtooth' : 'sine';
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2);
  };

  const isInScale = (noteIndex: number) => {
    const rootNote = 69; // A4
    const scaleIntervals = SCALES[highlightScale as keyof typeof SCALES] || SCALES.Chromatic;
    const relativeIndex = ((noteIndex - rootNote) % 12 + 12) % 12;
    return scaleIntervals.includes(relativeIndex);
  };

  return (
    <div className="space-y-6">
      {/* Instrument Selection */}
      <div className="flex justify-center gap-2">
        {(['voice', 'guitar', 'piano', 'bass'] as const).map(inst => (
          <Button
            key={inst}
            variant={selectedInstrument === inst ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInstrument(inst)}
            className={selectedInstrument === inst ? 'bg-neon-cyan text-void' : ''}
          >
            {inst === 'voice' && <Mic className="w-4 h-4 mr-2" />}
            {inst === 'guitar' && <Guitar className="w-4 h-4 mr-2" />}
            {inst === 'piano' && <Music className="w-4 h-4 mr-2" />}
            {inst === 'bass' && <AudioLines className="w-4 h-4 mr-2" />}
            {inst.charAt(0).toUpperCase() + inst.slice(1)}
          </Button>
        ))}
      </div>

      {/* Main Tuner Display */}
      <Card className="bg-void border-white/10 p-6">
        <div className="flex flex-col items-center">
          {/* Note Display */}
          <div className="relative mb-6">
            <div className={`text-8xl font-bold transition-all duration-200 ${
              detectedNote 
                ? Math.abs(cents) < 5 
                  ? 'text-neon-green scale-110' 
                  : Math.abs(cents) < 20 
                    ? 'text-neon-yellow' 
                    : 'text-neon-red'
                : 'text-text-tertiary'
            }`}>
              {detectedNote || '--'}
            </div>
            
            {detectedNote && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  Math.abs(cents) < 5 ? 'bg-neon-green' : 'bg-transparent'
                }`}
              >
                {Math.abs(cents) < 5 && <CheckCircle2 className="w-4 h-4 text-void" />}
              </motion.div>
            )}
          </div>

          {/* Frequency Display */}
          <div className="text-2xl font-mono text-text-secondary mb-2">
            {detectedFreq > 0 ? `${detectedFreq.toFixed(1)} Hz` : 'Listening...'}
          </div>

          {/* Cents Display */}
          {detectedNote && (
            <div className={`text-lg font-medium ${
              Math.abs(cents) < 5 ? 'text-neon-green' : 'text-text-secondary'
            }`}>
              {cents > 0 ? '+' : ''}{cents.toFixed(0)} cents
            </div>
          )}

          {/* Volume Meter */}
          <div className="w-full max-w-xs mt-4">
            <div className="h-2 bg-void-light rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink"
                animate={{ width: `${volume}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>

        {/* Tuner Gauge */}
        <div className="mt-6">
          <canvas 
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full rounded-lg"
          />
        </div>

        {/* Control Button */}
        <div className="flex justify-center mt-6">
          <Button
            size="lg"
            onClick={isListening ? stopTuner : startTuner}
            className={isListening 
              ? 'bg-neon-red hover:bg-neon-red/90 text-white px-8' 
              : 'bg-neon-cyan hover:bg-neon-cyan/90 text-void px-8'
            }
          >
            {isListening ? (
              <><Pause className="w-5 h-5 mr-2" /> Stop Tuner</>
            ) : (
              <><Mic className="w-5 h-5 mr-2" /> Start Tuner</>
            )}
          </Button>
        </div>
      </Card>

      {/* Reference Pitch */}
      <Card className="bg-void-light/30 border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-neon-pink" />
            <span className="font-medium">Reference Pitch: {referencePitch} Hz</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setReferencePitch(p => Math.max(420, p - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <Slider 
              value={[referencePitch]}
              onValueChange={([v]) => setReferencePitch(v)}
              min={420}
              max={460}
              step={1}
              className="w-32"
            />
            <Button variant="ghost" size="icon" onClick={() => setReferencePitch(p => Math.min(460, p + 1))}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReferencePitch(440)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scale Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-text-secondary">Highlight Scale:</span>
          {Object.keys(SCALES).map(scale => (
            <Badge 
              key={scale}
              variant={highlightScale === scale ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setHighlightScale(scale)}
            >
              {scale}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Note Reference Grid */}
      <Card className="bg-void-light/30 border-white/5 p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-neon-cyan" />
          Reference Tones
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1">
          {Object.entries(NOTE_FREQUENCIES)
            .filter(([note]) => {
              const octave = parseInt(note.slice(-1));
              return octave >= 3 && octave <= 5;
            })
            .map(([note, freq]) => {
              const noteIndex = NOTE_NAMES.indexOf(note.slice(0, -1)) + (parseInt(note.slice(-1)) + 1) * 12;
              const inScale = isInScale(noteIndex);
              
              return (
                <button
                  key={note}
                  onClick={() => playReferenceTone(note)}
                  className={`p-2 rounded text-xs font-mono transition-all ${
                    detectedNote === note
                      ? 'bg-neon-cyan text-void font-bold'
                      : inScale
                        ? 'bg-white/10 hover:bg-white/20 text-text-primary'
                        : 'bg-white/5 text-text-tertiary hover:bg-white/10'
                  }`}
                >
                  {note}
                  <div className="text-[10px] opacity-60">{freq.toFixed(0)}</div>
                </button>
              );
            })}
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// METRONOME COMPONENT
// =============================================================================

function MetronomePanel() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [soundType, setSoundType] = useState<keyof typeof METRONOME_SOUNDS>('Click');
  const [volume, setVolume] = useState(80);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeats, setCountInBeats] = useState(4);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countInRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playClick = (isAccent: boolean) => {
    const ctx = audioManager.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = METRONOME_SOUNDS[soundType] as OscillatorType;
    osc.frequency.value = isAccent ? 1000 : 800;
    
    gain.gain.setValueAtTime(volume / 100 * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const startMetronome = () => {
    if (isCountingIn) {
      // Count in
      let count = 0;
      const countInterval = (60 / bpm) * 1000;
      
      const doCountIn = () => {
        playClick(count === 0);
        setCurrentBeat(count);
        count++;
        
        if (count < countInBeats) {
          countInRef.current = setTimeout(doCountIn, countInterval);
        } else {
          setIsCountingIn(false);
          startMainMetronome();
        }
      };
      
      doCountIn();
    } else {
      startMainMetronome();
    }
  };

  const startMainMetronome = () => {
    setIsPlaying(true);
    setCurrentBeat(0);
    playClick(true);
    
    const interval = (60 / bpm) * 1000;
    let beat = 1;
    
    intervalRef.current = setInterval(() => {
      setCurrentBeat(beat);
      playClick(beat === 0);
      beat = (beat + 1) % beatsPerMeasure;
    }, interval);
  };

  const stopMetronome = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countInRef.current) clearTimeout(countInRef.current);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentBeat(0);
  };

  const toggleMetronome = () => {
    if (isPlaying || isCountingIn) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const newTimes = [...tapTimes, now].slice(-5);
    setTapTimes(newTimes);
    
    if (newTimes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < newTimes.length; i++) {
        intervals.push(newTimes[i] - newTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      setBpm(Math.min(300, Math.max(20, newBpm)));
    }
  };

  // Preset tempos
  const presets = [
    { name: 'Largo', bpm: 40 },
    { name: 'Adagio', bpm: 70 },
    { name: 'Moderato', bpm: 100 },
    { name: 'Allegro', bpm: 140 },
    { name: 'Presto', bpm: 180 },
  ];

  return (
    <div className="space-y-6">
      {/* Main BPM Display */}
      <Card className="bg-void border-white/10 p-8">
        <div className="flex flex-col items-center">
          {/* Beat Visualizer */}
          <div className="flex gap-3 mb-8">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  currentBeat === i && isPlaying
                    ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.5)]'
                    : 'border-white/20 bg-transparent'
                }`}
                animate={currentBeat === i && isPlaying ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.1 }}
              >
                {i === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-current opacity-50">
                    1
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* BPM Display */}
          <div className="text-7xl font-bold text-gradient-rgb mb-2">
            {bpm}
          </div>
          <div className="text-text-secondary mb-6">BPM</div>

          {/* BPM Controls */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => setBpm(p => Math.max(20, p - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <Slider 
              value={[bpm]}
              onValueChange={([v]) => setBpm(v)}
              min={20}
              max={300}
              step={1}
              className="w-64"
            />
            <Button variant="outline" size="icon" onClick={() => setBpm(p => Math.min(300, p + 1))}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Tap Tempo */}
          <Button 
            variant="ghost" 
            onClick={handleTap}
            className="mb-6"
          >
            <Zap className="w-4 h-4 mr-2" />
            Tap Tempo
            {tapTimes.length > 0 && (
              <span className="ml-2 text-xs text-text-secondary">
                ({tapTimes.length} taps)
              </span>
            )}
          </Button>

          {/* Play Button */}
          <Button
            size="lg"
            onClick={toggleMetronome}
            className={`px-12 py-6 text-lg ${
              isPlaying 
                ? 'bg-neon-red hover:bg-neon-red/90' 
                : 'bg-neon-cyan hover:bg-neon-cyan/90 text-void'
            }`}
          >
            {isPlaying ? (
              <><Pause className="w-6 h-6 mr-3" /> Stop</>
            ) : (
              <><Play className="w-6 h-6 mr-3" /> Start</>
            )}
          </Button>
        </div>
      </Card>

      {/* Settings */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Time Signature */}
        <Card className="bg-void-light/30 border-white/5 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-neon-pink" />
            Time Signature
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-2xl font-bold w-8 text-center">{beatsPerMeasure}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBeatsPerMeasure(Math.min(16, beatsPerMeasure + 1))}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <span className="text-xl text-text-secondary">/</span>
            <span className="text-2xl font-bold text-text-secondary">4</span>
          </div>
        </Card>

        {/* Sound Selection */}
        <Card className="bg-void-light/30 border-white/5 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Waves className="w-4 h-4 text-neon-green" />
            Sound
          </h3>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(METRONOME_SOUNDS).map(sound => (
              <Button
                key={sound}
                variant={soundType === sound ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSoundType(sound as keyof typeof METRONOME_SOUNDS)}
                className={soundType === sound ? 'bg-neon-cyan text-void' : ''}
              >
                {sound}
              </Button>
            ))}
          </div>
        </Card>

        {/* Volume */}
        <Card className="bg-void-light/30 border-white/5 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-neon-yellow" />
            Volume
          </h3>
          <div className="flex items-center gap-3">
            <Slider 
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              max={100}
              className="flex-1"
            />
            <span className="text-sm w-10 text-right">{volume}%</span>
          </div>
        </Card>

        {/* Count In */}
        <Card className="bg-void-light/30 border-white/5 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Timer className="w-4 h-4 text-neon-cyan" />
            Count In
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={isCountingIn}
                onChange={(e) => setIsCountingIn(e.target.checked)}
                className="w-4 h-4 rounded border-white/20"
              />
              <span className="text-sm">Enable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Beats:</span>
              <select 
                value={countInBeats}
                onChange={(e) => setCountInBeats(parseInt(e.target.value))}
                className="bg-void border border-white/20 rounded px-2 py-1 text-sm"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Preset Tempos */}
      <Card className="bg-void-light/30 border-white/5 p-4">
        <h3 className="text-sm font-semibold mb-3">Preset Tempos</h3>
        <div className="grid grid-cols-5 gap-2">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => setBpm(preset.bpm)}
              className={`p-3 rounded-lg text-center transition-all ${
                bpm === preset.bpm 
                  ? 'bg-neon-cyan/20 border border-neon-cyan' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-lg font-bold">{preset.bpm}</div>
              <div className="text-xs text-text-secondary">{preset.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Practice Tips */}
      <Card className="bg-void-light/30 border-white/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold mb-1">Practice Tips</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Start slow (60-80 BPM) when learning new pieces</li>
              <li>• Use Tap Tempo to match the feel of a song</li>
              <li>• Enable Count In for recording sessions</li>
              <li>• Gradually increase speed as you improve</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MusicToolsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-void pt-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-rgb mb-4">
            Practice Tools
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Professional tuner and metronome for musicians. Perfect your pitch, 
            tighten your rhythm, and prepare for the studio.
          </p>
        </motion.div>

        {/* Tool Tabs */}
        <Tabs defaultValue="tuner" className="space-y-6">
          <TabsList className="w-full justify-center bg-void-light/30 border border-white/5 p-1">
            <TabsTrigger 
              value="tuner" 
              className="data-[state=active]:bg-neon-cyan/10 data-[state=active]:text-neon-cyan px-6"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Tuner
            </TabsTrigger>
            <TabsTrigger 
              value="metronome"
              className="data-[state=active]:bg-neon-pink/10 data-[state=active]:text-neon-pink px-6"
            >
              <Timer className="w-4 h-4 mr-2" />
              Metronome
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="tuner" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <TunerPanel />
              </motion.div>
            </TabsContent>

            <TabsContent value="metronome" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MetronomePanel />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Connection to Music Studio */}
        <Card className="mt-12 bg-gradient-to-r from-neon-cyan/10 via-neon-pink/10 to-neon-purple/10 border-white/10 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Ready to record?
              </h3>
              <p className="text-text-secondary">
                Take your practice into the Music Studio and start creating.
              </p>
            </div>
            <Button
              className="bg-gradient-rgb text-void font-semibold hover:opacity-90"
              onClick={() => navigate('/music-studio')}
            >
              <Music className="w-4 h-4 mr-2" />
              Open Music Studio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
