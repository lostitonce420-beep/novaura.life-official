import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Monitor, Video, VideoOff,
  PhoneOff, Settings, MessageSquare, Sparkles, Loader2,
  AlertCircle, Radio, Waves
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { initLiveSession, sendLiveAudio, closeLiveSession, isAIAvailable } from '../../services/firebaseAIService';

const VOICES = [
  { name: 'Puck', description: 'Young, energetic' },
  { name: 'Charon', description: 'Mature, professional' },
  { name: 'Kore', description: 'Warm, friendly' },
  { name: 'Fenrir', description: 'Deep, powerful' },
  { name: 'Aoede', description: 'Musical, lyrical' },
];

export default function LiveAIWindow() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioOutputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setIsConnecting(true);
    
    try {
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize live session
      await initLiveSession({
        voice: selectedVoice,
        onAudioOutput: (audioData) => {
          if (isSpeakerOn) {
            playAudio(audioData);
          }
        },
        onMessage: (message) => {
          if (message.text) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: message.text,
              timestamp: Date.now(),
            }]);
          }
        },
        onError: (error) => {
          console.error('[Live AI] Error:', error);
          toast.error('Connection error: ' + error.message);
        },
      });

      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        if (isConnected) {
          try {
            await sendLiveAudio(audioBlob);
          } catch (err) {
            console.error('[Live AI] Failed to send audio:', err);
          }
        }
      };

      // Record in chunks
      const recordChunk = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
          setTimeout(recordChunk, 1000);
        }
      };

      mediaRecorderRef.current.start();
      setTimeout(recordChunk, 1000);

      setIsConnected(true);
      toast.success('Live AI session started');
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm Nova Live. I'm listening - just start talking!`,
        timestamp: Date.now(),
      }]);
      
    } catch (err) {
      console.error('[Live AI] Failed to start:', err);
      toast.error(err.message || 'Failed to start live session');
    } finally {
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    // Stop recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    // Close live session
    closeLiveSession();

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    toast.info('Live session ended');
  };

  const playAudio = async (audioData) => {
    if (!audioContextRef.current) return;
    
    try {
      const buffer = await audioContextRef.current.decodeAudioData(audioData.buffer.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('[Live AI] Failed to play audio:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mediaRecorderRef.current) {
      if (isMuted) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
  };

  if (!isAIAvailable()) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Firebase AI Not Available</h3>
          <p className="text-gray-400 max-w-md">
            Firebase AI is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected 
                ? 'bg-green-500/20 animate-pulse' 
                : 'bg-gradient-to-br from-red-500 to-orange-500'
            }`}>
              <Radio className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-white'}`} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-100">Nova Live</h1>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Connected • Real-time voice' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              disabled={isConnected}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && !isConnected && (
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <label className="text-xs font-medium text-gray-400 uppercase mb-3 block">
              Voice Selection
            </label>
            <div className="grid grid-cols-5 gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.name}
                  onClick={() => setSelectedVoice(voice.name)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedVoice === voice.name
                      ? 'bg-primary/20 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium text-sm">{voice.name}</div>
                  <div className="text-xs text-gray-500">{voice.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connection Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Animated Waveform */}
          <div className="relative mb-8">
            <div className={`w-48 h-48 rounded-full flex items-center justify-center ${
              isConnected 
                ? 'bg-green-500/10 animate-pulse' 
                : isConnecting
                ? 'bg-yellow-500/10 animate-pulse'
                : 'bg-white/5'
            }`}>
              <div className={`w-36 h-36 rounded-full flex items-center justify-center ${
                isConnected 
                  ? 'bg-green-500/20' 
                  : isConnecting
                  ? 'bg-yellow-500/20'
                  : 'bg-white/10'
              }`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isConnected 
                    ? 'bg-green-500/30' 
                    : isConnecting
                    ? 'bg-yellow-500/30'
                    : 'bg-white/20'
                }`}>
                  {isConnected ? (
                    <Waves className="w-12 h-12 text-green-400" />
                  ) : isConnecting ? (
                    <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
                  ) : (
                    <Mic className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Status Ring */}
            {isConnected && (
              <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping" />
            )}
          </div>

          {/* Status Text */}
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">
            {isConnected 
              ? 'Listening...' 
              : isConnecting 
              ? 'Connecting...' 
              : 'Ready to Connect'}
          </h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            {isConnected 
              ? 'Speak naturally. I\'ll respond in real-time with voice and text.' 
              : 'Start a live conversation with Nova. Uses real-time audio streaming.'}
          </p>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleMute}
                  className="w-14 h-14 rounded-full p-0"
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopSession}
                  className="w-16 h-16 rounded-full p-0"
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className="w-14 h-14 rounded-full p-0"
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={startSession}
                disabled={isConnecting}
                className="gap-2 px-8"
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Radio className="w-5 h-5" />
                )}
                {isConnecting ? 'Connecting...' : 'Start Live Session'}
              </Button>
            )}
          </div>
        </div>

        {/* Transcript / Messages */}
        {messages.length > 0 && (
          <div className="h-48 border-t border-white/10 bg-white/5 overflow-auto p-4">
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
