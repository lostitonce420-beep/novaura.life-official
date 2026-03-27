import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';

// Animated AI avatar with eye tracking, blinking, and expressions
function AnimatedAvatar({ mood = 'idle', size = 48 }) {
  const [blinking, setBlinking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState('neutral');
  const avatarRef = useRef(null);

  // Blinking cycle
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };

    const interval = setInterval(() => {
      blink();
      // Occasional double blink
      if (Math.random() > 0.7) {
        setTimeout(blink, 300);
      }
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Eye tracking — follows mouse
  useEffect(() => {
    const handleMouse = (e) => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 2.5;
      const factor = Math.min(dist / 300, 1);
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Mood-based expression changes
  useEffect(() => {
    if (mood === 'thinking') setExpression('focused');
    else if (mood === 'talking') setExpression('happy');
    else if (mood === 'error') setExpression('concerned');
    else setExpression('neutral');
  }, [mood]);

  // Random idle expressions
  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'idle') {
        const expressions = ['neutral', 'curious', 'neutral', 'neutral', 'happy'];
        setExpression(expressions[Math.floor(Math.random() * expressions.length)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mood]);

  const eyeHeight = blinking ? 0.5 : (expression === 'happy' ? 3.5 : expression === 'focused' ? 3 : 4);
  const eyeWidth = expression === 'focused' ? 3.5 : 4;
  const mouthCurve = expression === 'happy' ? 'M 17 33 Q 24 37 31 33' :
                     expression === 'concerned' ? 'M 18 35 Q 24 33 30 35' :
                     expression === 'curious' ? 'M 19 34 Q 24 36 29 34' :
                     'M 19 34 Q 24 35.5 29 34';

  // Idle breathing animation via subtle scale
  const breatheStyle = {
    animation: 'breathe 3s ease-in-out infinite',
  };

  return (
    <div ref={avatarRef} style={breatheStyle}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Head glow */}
        <circle cx="24" cy="24" r="22" fill="url(#headGradient)" opacity="0.15" />

        {/* Face circle */}
        <circle cx="24" cy="24" r="18" fill="hsl(220, 15%, 10%)" stroke="url(#faceStroke)" strokeWidth="1.5" />

        {/* Inner face shading */}
        <circle cx="24" cy="24" r="16" fill="url(#faceInner)" opacity="0.5" />

        {/* Left eye */}
        <ellipse
          cx={16 + eyeOffset.x}
          cy={22 + eyeOffset.y}
          rx={eyeWidth / 2}
          ry={eyeHeight / 2}
          fill="hsl(190, 100%, 60%)"
          style={{ transition: 'ry 0.1s ease, rx 0.15s ease' }}
        >
          {!blinking && <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />}
        </ellipse>
        {/* Left pupil */}
        {!blinking && (
          <circle
            cx={16 + eyeOffset.x * 1.3}
            cy={22 + eyeOffset.y * 1.3}
            r="1"
            fill="white"
            opacity="0.9"
          />
        )}

        {/* Right eye */}
        <ellipse
          cx={32 + eyeOffset.x}
          cy={22 + eyeOffset.y}
          rx={eyeWidth / 2}
          ry={eyeHeight / 2}
          fill="hsl(190, 100%, 60%)"
          style={{ transition: 'ry 0.1s ease, rx 0.15s ease' }}
        >
          {!blinking && <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />}
        </ellipse>
        {/* Right pupil */}
        {!blinking && (
          <circle
            cx={32 + eyeOffset.x * 1.3}
            cy={22 + eyeOffset.y * 1.3}
            r="1"
            fill="white"
            opacity="0.9"
          />
        )}

        {/* Mouth */}
        <path
          d={mouthCurve}
          stroke="hsl(190, 80%, 50%)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
          style={{ transition: 'd 0.3s ease' }}
        />

        {/* Thinking indicator dots */}
        {mood === 'thinking' && (
          <>
            <circle cx="36" cy="12" r="1.2" fill="hsl(270, 100%, 65%)" opacity="0.7">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="39" cy="9" r="0.8" fill="hsl(270, 100%, 65%)" opacity="0.5">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="41" cy="7" r="0.5" fill="hsl(270, 100%, 65%)" opacity="0.3">
              <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Gradients */}
        <defs>
          <radialGradient id="headGradient">
            <stop offset="0%" stopColor="hsl(190, 100%, 50%)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="faceStroke" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="hsl(190, 100%, 50%)" stopOpacity="0.5">
              <animate attributeName="stop-color" values="hsl(190,100%,50%);hsl(270,100%,65%);hsl(320,100%,55%);hsl(190,100%,50%)" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="hsl(270, 100%, 65%)" stopOpacity="0.3">
              <animate attributeName="stop-color" values="hsl(270,100%,65%);hsl(320,100%,55%);hsl(190,100%,50%);hsl(270,100%,65%)" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <radialGradient id="faceInner" cx="0.4" cy="0.35">
            <stop offset="0%" stopColor="hsl(220, 20%, 18%)" />
            <stop offset="100%" stopColor="hsl(220, 15%, 8%)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function AvatarButton({ onClick, mood = 'idle', hasUnread = false }) {
  const [hovering, setHovering] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative group transition-transform duration-200 hover:scale-110 active:scale-95"
      title="Chat with Nova"
    >
      {/* Outer glow ring */}
      <div className="absolute -inset-2 rounded-full rgb-glow opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Avatar container with liquid light border */}
      <div className="relative z-10 w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center overflow-hidden rgb-border rounded-full">
        <div className="rgb-flow-layer" />
        <div className="relative z-10 bg-black rounded-full p-0.5">
          <AnimatedAvatar mood={hovering ? 'curious' : mood} size={48} />
        </div>
      </div>

      {/* Chat icon badge */}
      <div className="absolute -bottom-0.5 -right-0.5 z-20 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(0,217,255,0.5)]">
        <MessageCircle className="w-3 h-3 text-black" />
      </div>

      {/* Unread indicator */}
      {hasUnread && (
        <div className="absolute -top-0.5 -right-0.5 z-20 w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(255,0,255,0.5)]" />
      )}
    </button>
  );
}
