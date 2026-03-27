import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Heart, MessageCircle, Zap, Music } from 'lucide-react';

// Cute Female AI Robot Head Component for Nova OS
export default function CuteRobotHead({ 
  size = 'medium', // small, medium, large
  mood = 'happy', // happy, curious, excited, calm, sleepy
  onClick,
  onMoodChange,
  className = '' 
}) {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [antennaWiggle, setAntennaWiggle] = useState(0);
  const containerRef = useRef(null);
  const blinkInterval = useRef(null);

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-40 h-40',
    large: 'w-56 h-56'
  };

  // Handle mouse movement for eye tracking
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const distance = Math.min(
      Math.hypot(e.clientX - centerX, e.clientY - centerY) / 10,
      8
    );
    
    setEyePosition({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    });
  }, []);

  // Blink animation
  useEffect(() => {
    const blinkLoop = () => {
      const nextBlink = Math.random() * 3000 + 2000; // 2-5 seconds
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        blinkLoop();
      }, nextBlink);
    };
    blinkLoop();

    return () => clearTimeout(blinkInterval.current);
  }, []);

  // Mouse tracking
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Mood-based animations
  const handleClick = () => {
    setAntennaWiggle(1);
    setTimeout(() => setAntennaWiggle(0), 500);
    
    const moods = ['happy', 'excited', 'curious', 'calm'];
    const newMood = moods[Math.floor(Math.random() * moods.length)];
    setCurrentMood(newMood);
    
    if (newMood === 'excited' || newMood === 'happy') {
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 2000);
    }
    
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 1500);
    
    onClick?.(newMood);
    onMoodChange?.(newMood);
  };

  const moodColors = {
    happy: { primary: '#f472b6', glow: '#f9a8d4' },
    curious: { primary: '#8b5cf6', glow: '#a78bfa' },
    excited: { primary: '#fbbf24', glow: '#fcd34d' },
    calm: { primary: '#60a5fa', glow: '#93c5fd' },
    sleepy: { primary: '#a78bfa', glow: '#c4b5fd' }
  };

  const colors = moodColors[currentMood];

  return (
    <div 
      ref={containerRef}
      className={`relative ${sizeClasses[size]} cursor-pointer select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Floating hearts when happy */}
      {showHearts && (
        <>
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className="absolute text-pink-400 animate-ping"
              style={{
                width: '16px',
                height: '16px',
                left: `${20 + i * 15}%`,
                top: '-20%',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
              fill="currentColor"
            />
          ))}
        </>
      )}

      {/* Speech bubble */}
      {isSpeaking && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm 
                        px-4 py-2 rounded-2xl shadow-lg whitespace-nowrap z-10
                        animate-bounce">
          <span className="text-sm font-medium text-slate-700">
            {currentMood === 'happy' && "Hello! 💕"}
            {currentMood === 'curious' && "What's that? 👀"}
            {currentMood === 'excited' && "Yay! ✨"}
            {currentMood === 'calm' && "Relaxing... 🌸"}
            {currentMood === 'sleepy' && "*yawn* 😴"}
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 
                          border-8 border-transparent border-t-white/90" />
        </div>
      )}

      {/* Main head container */}
      <div 
        className={`relative w-full h-full rounded-full transition-all duration-500
                   ${isHovered ? 'scale-105' : 'scale-100'}`}
        style={{
          background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.primary}40 100%)`,
          boxShadow: `0 0 ${isHovered ? '60px' : '30px'} ${colors.glow}60,
                      inset 0 -10px 30px rgba(0,0,0,0.2),
                      inset 0 10px 30px rgba(255,255,255,0.3)`,
          border: `3px solid ${colors.primary}60`
        }}
      >
        {/* Metallic sheen overlay */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full 
                          bg-gradient-to-br from-white/40 to-transparent 
                          rotate-45 transform origin-bottom-right" />
        </div>

        {/* Antenna */}
        <div 
          className="absolute -top-4 left-1/2 -translate-x-1/2 transition-transform duration-300"
          style={{
            transform: `translateX(-50%) rotate(${antennaWiggle * 20}deg)`
          }}
        >
          <div 
            className="w-1 h-8 mx-auto rounded-full"
            style={{ background: colors.primary }}
          />
          <div 
            className="w-4 h-4 rounded-full mx-auto -mt-1 animate-pulse"
            style={{ 
              background: colors.primary,
              boxShadow: `0 0 20px ${colors.glow}` 
            }}
          />
          {/* Signal waves */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 opacity-0 animate-ping"
                style={{
                  width: `${12 + i * 8}px`,
                  height: `${12 + i * 8}px`,
                  borderColor: colors.primary,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Left ear/communication array */}
        <div 
          className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-10 rounded-full
                     flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}60, ${colors.primary}80)`,
            boxShadow: `0 0 15px ${colors.glow}40`
          }}
        >
          <div className="flex flex-col gap-1">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        {/* Right ear/communication array */}
        <div 
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-10 rounded-full
                     flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}60, ${colors.primary}80)`,
            boxShadow: `0 0 15px ${colors.glow}40`
          }}
        >
          <div className="flex flex-col gap-1">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        {/* Face container */}
        <div className="absolute inset-4 flex flex-col items-center justify-center">
          
          {/* Eyes container */}
          <div className="flex gap-4 mb-2">
            {/* Left Eye */}
            <div 
              className="relative w-12 h-14 rounded-full overflow-hidden
                         bg-gradient-to-b from-slate-800 to-slate-900
                         border-2 border-white/30"
              style={{
                boxShadow: `0 0 20px ${colors.glow}40, inset 0 2px 10px rgba(0,0,0,0.5)`
              }}
            >
              {/* Eye shine */}
              <div className="absolute top-2 right-3 w-3 h-3 rounded-full bg-white/80" />
              
              {/* Pupil */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           rounded-full transition-all duration-200
                           ${isBlinking ? 'h-0.5 w-8' : 'h-8 w-8'}`}
                style={{
                  background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.glow} 100%)`,
                  boxShadow: `0 0 20px ${colors.primary}`,
                  transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))`
                }}
              >
                {/* Inner pupil detail */}
                <div className="absolute inset-1 rounded-full bg-slate-900/30" />
              </div>

              {/* Eyelid (for blinking) */}
              <div 
                className={`absolute inset-0 bg-gradient-to-b from-pink-300 to-pink-400
                           transition-transform duration-150 origin-top
                           ${isBlinking ? 'scale-y-100' : 'scale-y-0'}`}
              />
            </div>

            {/* Right Eye */}
            <div 
              className="relative w-12 h-14 rounded-full overflow-hidden
                         bg-gradient-to-b from-slate-800 to-slate-900
                         border-2 border-white/30"
              style={{
                boxShadow: `0 0 20px ${colors.glow}40, inset 0 2px 10px rgba(0,0,0,0.5)`
              }}
            >
              {/* Eye shine */}
              <div className="absolute top-2 right-3 w-3 h-3 rounded-full bg-white/80" />
              
              {/* Pupil */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           rounded-full transition-all duration-200
                           ${isBlinking ? 'h-0.5 w-8' : 'h-8 w-8'}`}
                style={{
                  background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.glow} 100%)`,
                  boxShadow: `0 0 20px ${colors.primary}`,
                  transform: `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))`
                }}
              >
                {/* Inner pupil detail */}
                <div className="absolute inset-1 rounded-full bg-slate-900/30" />
              </div>

              {/* Eyelid (for blinking) */}
              <div 
                className={`absolute inset-0 bg-gradient-to-b from-pink-300 to-pink-400
                           transition-transform duration-150 origin-top
                           ${isBlinking ? 'scale-y-100' : 'scale-y-0'}`}
              />
            </div>
          </div>

          {/* Eyebrows (expressive) */}
          <div className="flex gap-8 mb-1">
            <div 
              className="w-8 h-1.5 rounded-full transition-transform duration-300"
              style={{
                background: colors.primary,
                transform: `rotate(${currentMood === 'curious' ? '-15deg' : currentMood === 'excited' ? '-10deg' : '0deg'})`,
                boxShadow: `0 0 10px ${colors.glow}`
              }}
            />
            <div 
              className="w-8 h-1.5 rounded-full transition-transform duration-300"
              style={{
                background: colors.primary,
                transform: `rotate(${currentMood === 'curious' ? '15deg' : currentMood === 'excited' ? '10deg' : '0deg'})`,
                boxShadow: `0 0 10px ${colors.glow}`
              }}
            />
          </div>

          {/* Mouth */}
          <div 
            className="relative transition-all duration-300"
            style={{
              width: currentMood === 'excited' ? '32px' : '24px',
              height: currentMood === 'excited' ? '20px' : currentMood === 'sleepy' ? '8px' : '12px',
              background: currentMood === 'sleepy' ? 'transparent' : `linear-gradient(135deg, ${colors.primary}, ${colors.glow})`,
              borderRadius: currentMood === 'excited' ? '0 0 50% 50%' : currentMood === 'sleepy' ? '50%' : '0 0 25% 25%',
              border: currentMood === 'sleepy' ? `3px solid ${colors.primary}` : 'none',
              boxShadow: `0 0 15px ${colors.glow}60`
            }}
          >
            {/* Tongue when excited */}
            {currentMood === 'excited' && (
              <div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2
                           w-4 h-3 rounded-full bg-pink-400"
              />
            )}
          </div>

          {/* Cheek blush */}
          <div className="absolute bottom-8 flex gap-12">
            <div 
              className="w-6 h-3 rounded-full bg-pink-400/40 blur-sm"
              style={{ 
                opacity: isHovered || currentMood === 'happy' ? 1 : 0.5,
                transition: 'opacity 0.3s'
              }}
            />
            <div 
              className="w-6 h-3 rounded-full bg-pink-400/40 blur-sm"
              style={{ 
                opacity: isHovered || currentMood === 'happy' ? 1 : 0.5,
                transition: 'opacity 0.3s'
              }}
            />
          </div>
        </div>

        {/* Decorative elements */}
        <Sparkles 
          className={`absolute top-2 right-2 w-4 h-4 text-yellow-300 
                     transition-opacity duration-300
                     ${isHovered ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
        />
        <Sparkles 
          className={`absolute bottom-4 left-2 w-3 h-3 text-yellow-300 
                     transition-opacity duration-300
                     ${isHovered ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
          style={{ animationDelay: '0.5s' }}
        />

        {/* Music notes when calm */}
        {currentMood === 'calm' && (
          <>
            <Music className="absolute -right-4 top-4 w-4 h-4 text-blue-300 animate-bounce" />
            <Music className="absolute -left-4 top-8 w-3 h-3 text-blue-300 animate-bounce" 
                   style={{ animationDelay: '0.5s' }} />
          </>
        )}

        {/* Zap when excited */}
        {currentMood === 'excited' && (
          <Zap className="absolute -right-2 bottom-8 w-5 h-5 text-yellow-400 animate-pulse" fill="currentColor" />
        )}

        {/* Message bubble indicator */}
        {isHovered && !isSpeaking && (
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full 
                          bg-gradient-to-br from-pink-400 to-purple-500
                          flex items-center justify-center
                          animate-bounce shadow-lg">
            <MessageCircle className="w-4 h-4 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Mood indicator label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 
                      text-xs font-medium text-white/60 capitalize
                      transition-opacity duration-300
                      opacity-0 group-hover:opacity-100">
        {currentMood}
      </div>
    </div>
  );
}
