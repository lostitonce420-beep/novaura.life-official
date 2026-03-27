import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Sparkles, Zap, Moon, Bot } from 'lucide-react';

// Simplified but fully animated Cute Robot Head
export default function CuteRobotHeadSimple({ 
  size = 'medium',
  mood = 'happy',
  onClick,
  className = ''
}) {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const containerRef = useRef(null);

  // Size configurations
  const sizes = {
    small: { container: 96, head: 80, eye: 28, pupil: 16 },
    medium: { container: 160, head: 140, eye: 48, pupil: 28 },
    large: { container: 224, head: 200, eye: 68, pupil: 40 }
  };
  const s = sizes[size];

  // Eye tracking
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const dist = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy) / 15, s.pupil / 3);
    setEyePos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [s.pupil]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Blinking
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      setTimeout(blink, 2000 + Math.random() * 3000);
    };
    const timer = setTimeout(blink, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    const moods = ['happy', 'curious', 'excited', 'calm'];
    const newMood = moods[Math.floor(Math.random() * moods.length)];
    setCurrentMood(newMood);
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1500);
    onClick?.(newMood);
  };

  const moodConfig = {
    happy: { color: '#f472b6', glow: '#f9a8d4', eyebrow: 0 },
    curious: { color: '#8b5cf6', glow: '#a78bfa', eyebrow: -15 },
    excited: { color: '#fbbf24', glow: '#fcd34d', eyebrow: -10 },
    calm: { color: '#60a5fa', glow: '#93c5fd', eyebrow: 0 },
    sleepy: { color: '#a78bfa', glow: '#c4b5fd', eyebrow: 5 }
  };
  const cfg = moodConfig[currentMood];

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ width: s.container, height: s.container }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Floating hearts */}
      {showHearts && (
        <>
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              className="absolute text-pink-400 animate-ping"
              style={{
                width: 16,
                height: 16,
                left: `${20 + i * 30}%`,
                top: '-10%',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.2s'
              }}
              fill="currentColor"
            />
          ))}
        </>
      )}

      {/* Main head circle */}
      <div 
        className="absolute rounded-full transition-all duration-300 cursor-pointer"
        style={{
          width: s.head,
          height: s.head,
          left: (s.container - s.head) / 2,
          top: (s.container - s.head) / 2,
          background: `linear-gradient(135deg, ${cfg.color}30 0%, ${cfg.color}50 100%)`,
          border: `3px solid ${cfg.color}`,
          boxShadow: `0 0 ${isHovered ? '40px' : '20px'} ${cfg.glow}60, inset 0 -5px 20px rgba(0,0,0,0.2)`,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {/* Shine overlay */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ opacity: 0.4 }}
        >
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white to-transparent rotate-45" />
        </div>

        {/* Antenna */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div 
            className="w-1 h-6 rounded-full animate-pulse"
            style={{ background: cfg.color }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-ping"
            style={{ background: cfg.color, marginTop: -2 }}
          />
        </div>

        {/* Left ear */}
        <div 
          className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-8 rounded-full flex flex-col justify-center items-center gap-1"
          style={{ background: cfg.color }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>

        {/* Right ear */}
        <div 
          className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-8 rounded-full flex flex-col justify-center items-center gap-1"
          style={{ background: cfg.color }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>

        {/* Face container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          
          {/* Eyebrows */}
          <div className="flex gap-6 mb-1">
            <div 
              className="w-6 h-1 rounded-full transition-transform duration-300"
              style={{ 
                background: cfg.color,
                transform: `rotate(${cfg.eyebrow}deg)`
              }}
            />
            <div 
              className="w-6 h-1 rounded-full transition-transform duration-300"
              style={{ 
                background: cfg.color,
                transform: `rotate(${-cfg.eyebrow}deg)`
              }}
            />
          </div>

          {/* Eyes */}
          <div className="flex gap-3">
            {/* Left eye */}
            <div 
              className="relative rounded-full overflow-hidden bg-slate-900 border-2 border-white/30"
              style={{ width: s.eye, height: s.eye * 1.2 }}
            >
              {/* Shine */}
              <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-white/80" />
              
              {/* Pupil */}
              <div 
                className="absolute rounded-full transition-all"
                style={{
                  width: s.pupil,
                  height: s.pupil,
                  background: `radial-gradient(circle, ${cfg.color} 0%, ${cfg.glow} 100%)`,
                  boxShadow: `0 0 15px ${cfg.color}`,
                  left: `calc(50% - ${s.pupil/2}px + ${eyePos.x}px)`,
                  top: `calc(50% - ${s.pupil/2}px + ${eyePos.y}px)`,
                  opacity: isBlinking ? 0.1 : 1,
                  transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)'
                }}
              />
            </div>

            {/* Right eye */}
            <div 
              className="relative rounded-full overflow-hidden bg-slate-900 border-2 border-white/30"
              style={{ width: s.eye, height: s.eye * 1.2 }}
            >
              {/* Shine */}
              <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-white/80" />
              
              {/* Pupil */}
              <div 
                className="absolute rounded-full transition-all"
                style={{
                  width: s.pupil,
                  height: s.pupil,
                  background: `radial-gradient(circle, ${cfg.color} 0%, ${cfg.glow} 100%)`,
                  boxShadow: `0 0 15px ${cfg.color}`,
                  left: `calc(50% - ${s.pupil/2}px + ${eyePos.x}px)`,
                  top: `calc(50% - ${s.pupil/2}px + ${eyePos.y}px)`,
                  opacity: isBlinking ? 0.1 : 1,
                  transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)'
                }}
              />
            </div>
          </div>

          {/* Mouth */}
          <div 
            className="mt-2 transition-all duration-300"
            style={{
              width: currentMood === 'excited' ? 24 : 16,
              height: currentMood === 'excited' ? 16 : currentMood === 'sleepy' ? 6 : 10,
              background: currentMood === 'sleepy' ? 'transparent' : cfg.color,
              border: currentMood === 'sleepy' ? `2px solid ${cfg.color}` : 'none',
              borderRadius: currentMood === 'excited' ? '0 0 50% 50%' : '0 0 30% 30%',
              boxShadow: `0 0 10px ${cfg.glow}`
            }}
          />

          {/* Blush */}
          <div className="absolute bottom-4 flex gap-8">
            <div 
              className="w-5 h-2 rounded-full bg-pink-400/50 blur-sm transition-opacity"
              style={{ opacity: isHovered ? 1 : 0.6 }}
            />
            <div 
              className="w-5 h-2 rounded-full bg-pink-400/50 blur-sm transition-opacity"
              style={{ opacity: isHovered ? 1 : 0.6 }}
            />
          </div>
        </div>

        {/* Sparkles when hovered */}
        {isHovered && (
          <>
            <Sparkles className="absolute top-2 right-2 w-3 h-3 text-yellow-300 animate-pulse" />
            <Zap className="absolute bottom-2 left-2 w-3 h-3 text-yellow-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </>
        )}
      </div>
    </div>
  );
}
