import React, { useState, useRef, useCallback } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function ChatBar({ onSubmit, llmConfig }) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
    }
  };

  const toggleVoice = useCallback(() => {
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setMessage(transcript);

      // Auto-submit on final result
      if (event.results[0].isFinal) {
        setIsListening(false);
        if (transcript.trim()) {
          onSubmit(transcript.trim());
          setMessage('');
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onSubmit]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* RGB liquid light border */}
        <div className="rgb-border rounded-2xl">
          <div className="rgb-flow-layer" />
          <div className="relative z-10 bg-black rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2">
              {/* AI Indicator */}
              <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 flex-shrink-0">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary animate-pulse" />
                <span className="text-xs md:text-sm font-medium text-primary">
                  {llmConfig?.useLocalLLM ? 'Local+Gemini' : 'Gemini'}
                </span>
              </div>

              {/* Input */}
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask AI to build, browse, code, or play media..."
                className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base touch-manipulation"
              />

              {/* Voice button */}
              <Button
                type="button"
                onClick={toggleVoice}
                size="icon"
                variant="ghost"
                className={`rounded-lg transition-all w-9 h-9 md:w-10 md:h-10 touch-manipulation active:scale-95 flex-shrink-0 ${
                  isListening
                    ? 'bg-accent/20 text-accent animate-pulse'
                    : 'text-muted-foreground hover:text-primary hover:bg-white/5'
                }`}
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim()}
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,217,255,0.3)] transition-all disabled:opacity-50 disabled:shadow-none w-9 h-9 md:w-10 md:h-10 touch-manipulation active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
