import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
  Volume2, Send, Loader2, Waves, Camera, Eye,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import GeminiLiveClient from '../../utils/GeminiLiveClient';
import { BACKEND_URL } from '../../services/aiService';

export default function VoiceChatWindow() {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [textInput, setTextInput] = useState('');

  const clientRef = useRef(null);
  const videoRef = useRef(null);
  const scrollEndRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const addTranscript = useCallback((role, text) => {
    setTranscript((prev) => {
      // Append to last message if same role (streaming text)
      const last = prev[prev.length - 1];
      if (last && last.role === role && Date.now() - last.ts < 3000) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text, ts: Date.now() }];
      }
      return [...prev, { role, text, ts: Date.now() }];
    });
  }, []);

  // ── Get API key ──────────────────────────────────
  // SECURE: Only gets key from backend, never from frontend env

  const getApiKey = async () => {
    try {
      // Get Firebase Auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      
      if (!auth.currentUser) {
        throw new Error('Please sign in to use voice chat');
      }
      
      const token = await auth.currentUser.getIdToken();
      
      // Get key from backend (secure)
      const res = await fetch(`${BACKEND_URL}/ai/live-key`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get API key');
      }
      
      const data = await res.json();
      return data.key;
    } catch (e) {
      console.error('Could not fetch API key from backend:', e);
      toast.error('Authentication required', {
        description: e.message || 'Please sign in to use voice chat',
      });
      return null;
    }
  };

  // ── Connect ──────────────────────────────────────

  const connect = async () => {
    setStatus('connecting');

    const apiKey = await getApiKey();
    if (!apiKey) {
      toast.error('No Gemini API Key', {
        description: 'Please sign in to use voice chat features',
      });
      setStatus('error');
      return;
    }

    const client = new GeminiLiveClient();
    clientRef.current = client;

    client.on('connected', () => {
      setStatus('connected');
      toast.success('Connected to Gemini Live');
    });

    client.on('transcript', (role, text) => {
      addTranscript(role, text);
    });

    client.on('speaking', (val) => setSpeaking(val));

    client.on('turnComplete', () => setSpeaking(false));

    client.on('error', () => {
      toast.error('Connection error');
      setStatus('error');
    });

    client.on('disconnected', () => {
      setStatus('idle');
      setMicOn(false);
      setCamOn(false);
      setSpeaking(false);
    });

    try {
      await client.connect(apiKey);
      // Auto-start mic after connection
      await client.startMic();
      setMicOn(true);
    } catch (err) {
      console.error('Live connect failed:', err);
      toast.error('Failed to connect', { description: err.message || 'Check your API key' });
      setStatus('error');
    }
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    setStatus('idle');
    setMicOn(false);
    setCamOn(false);
    setSpeaking(false);
  };

  // ── Mic toggle ───────────────────────────────────

  const toggleMic = async () => {
    const client = clientRef.current;
    if (!client) return;

    if (micOn) {
      client.stopMic();
      setMicOn(false);
    } else {
      try {
        await client.startMic();
        setMicOn(true);
      } catch (err) {
        toast.error('Microphone access denied');
      }
    }
  };

  // ── Camera toggle ────────────────────────────────

  const toggleCam = async () => {
    const client = clientRef.current;
    if (!client) return;

    if (camOn) {
      client.stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
    } else {
      try {
        await client.startCamera(videoRef.current);
        setCamOn(true);
        toast.success('Camera enabled', { description: 'Gemini can now see your camera' });
      } catch (err) {
        toast.error('Camera access denied');
      }
    }
  };

  // ── Send text ────────────────────────────────────

  const handleSendText = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    clientRef.current?.sendText(textInput);
    setTextInput('');
  };

  // ── Render ───────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-window-bg to-window-header">
      {/* Header */}
      <div className="px-5 py-3 border-b border-primary/20 bg-window-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent via-secondary to-primary flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Gemini Live</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    status === 'connected'
                      ? 'border-success text-success text-[10px]'
                      : status === 'connecting'
                        ? 'border-warning text-warning text-[10px]'
                        : 'border-muted-foreground text-muted-foreground text-[10px]'
                  }
                >
                  {status === 'connected' && '● Live'}
                  {status === 'connecting' && '◌ Connecting...'}
                  {status === 'idle' && '○ Offline'}
                  {status === 'error' && '✕ Error'}
                </Badge>
                {status === 'connected' && (
                  <div className="flex gap-1">
                    {micOn && <Mic className="w-3 h-3 text-accent" />}
                    {camOn && <Camera className="w-3 h-3 text-primary" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {status !== 'connected' ? (
          /* ─── Pre-call view ─── */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-5 max-w-sm">
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-accent/20 via-secondary/20 to-primary/20 flex items-center justify-center border-2 border-primary/30">
                {status === 'connecting' ? (
                  <Loader2 className="w-14 h-14 text-primary animate-spin" />
                ) : (
                  <Phone className="w-14 h-14 text-primary" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Voice & Video Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time conversation with Gemini AI. Toggle your mic and camera freely during the call.
                </p>
              </div>

              <Button
                onClick={connect}
                size="lg"
                disabled={status === 'connecting'}
                className="w-full bg-gradient-to-r from-accent via-secondary to-primary hover:opacity-90 text-white font-semibold shadow-[0_0_40px_rgba(168,85,247,0.4)]"
              >
                {status === 'connecting' ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                ) : status === 'error' ? (
                  <><Phone className="w-5 h-5 mr-2" /> Retry</>
                ) : (
                  <><Phone className="w-5 h-5 mr-2" /> Start Call</>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { icon: Mic, label: 'Voice Input', desc: 'Speak naturally' },
                  { icon: Camera, label: 'Camera', desc: 'Show & tell' },
                  { icon: Volume2, label: 'Voice Output', desc: 'Hear responses' },
                  { icon: Eye, label: 'Vision', desc: 'AI sees your cam' },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border">
                      <Icon className="w-4 h-4 text-primary mb-0.5" />
                      <p className="text-[11px] font-medium text-foreground">{f.label}</p>
                      <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Active call view ─── */
          <>
            {/* Camera preview */}
            <div className={`relative ${camOn ? 'h-40' : 'h-0'} transition-all overflow-hidden bg-black`}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
                muted
                playsInline
              />
              {camOn && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-500/80 text-white text-[9px] border-0">
                    <Camera className="w-2.5 h-2.5 mr-1" /> LIVE
                  </Badge>
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center py-3 gap-3 border-b border-primary/10">
              <div className={`w-3 h-3 rounded-full ${
                speaking ? 'bg-primary animate-pulse' : micOn ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
              }`} />
              <span className="text-sm font-medium text-foreground">
                {speaking ? 'Nova is speaking...' : micOn ? 'Listening...' : 'Mic off'}
              </span>
              {speaking && <Waves className="w-4 h-4 text-primary animate-pulse" />}
            </div>

            {/* Transcript */}
            <ScrollArea className="flex-1 scrollbar-custom">
              <div className="p-4 space-y-3">
                {transcript.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Waves className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Start speaking or type a message</p>
                  </div>
                ) : (
                  transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-accent/20 border border-accent/30 text-foreground'
                            : 'bg-primary/10 border border-primary/30 text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollEndRef} />
              </div>
            </ScrollArea>

            {/* Text input */}
            <form onSubmit={handleSendText} className="px-4 py-2 border-t border-primary/10 flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-8 text-sm bg-window-bg border-primary/20"
              />
              <Button type="submit" size="icon" className="h-8 w-8 bg-primary/20 hover:bg-primary/30">
                <Send className="w-3.5 h-3.5 text-primary" />
              </Button>
            </form>

            {/* Controls */}
            <div className="px-4 py-3 border-t border-primary/15 bg-window-header/50 flex items-center justify-center gap-3">
              {/* Mic toggle */}
              <Button
                onClick={toggleMic}
                size="icon"
                className={`w-12 h-12 rounded-full transition-all ${
                  micOn
                    ? 'bg-accent hover:bg-accent/90 shadow-[0_0_20px_rgba(255,0,255,0.3)]'
                    : 'bg-muted/30 hover:bg-muted/50 border border-muted-foreground/30'
                }`}
              >
                {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-muted-foreground" />}
              </Button>

              {/* Camera toggle */}
              <Button
                onClick={toggleCam}
                size="icon"
                className={`w-12 h-12 rounded-full transition-all ${
                  camOn
                    ? 'bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                    : 'bg-muted/30 hover:bg-muted/50 border border-muted-foreground/30'
                }`}
              >
                {camOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-muted-foreground" />}
              </Button>

              {/* End call */}
              <Button
                onClick={disconnect}
                size="icon"
                className="w-12 h-12 rounded-full bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
