/**
 * Particle Text Animation
 * Forms text using floating particles that coalesce and disperse
 * Sequence: Welcome → i am Nova → Enjoy [Tier]
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticleTextAnimation = ({ userTier = 'free', onComplete }) => {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const textCacheRef = useRef({});

  const phases = [
    { text: 'Welcome', duration: 3000, hold: 1500 },
    { text: 'i am Nova', duration: 3000, hold: 1500 },
    { text: `Enjoy ${getTierName(userTier)}`, duration: 4000, hold: 2000 },
  ];

  function getTierName(tier) {
    const names = {
      free: 'Novice',
      spark: 'Spark',
      emergent: 'Emergent',
      catalyst: 'Catalyst',
      nova: 'Nova',
      'catalytic-crew': 'Crew',
    };
    return names[tier] || 'Novice';
  }

  // Particle class
  class Particle {
    constructor(x, y, targetX, targetY, color) {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;
      this.targetX = targetX;
      this.targetY = targetY;
      this.vx = 0;
      this.vy = 0;
      this.color = color;
      this.size = Math.random() * 2 + 1;
      this.life = 0;
      this.maxLife = 1;
      this.easing = 0.05 + Math.random() * 0.03;
    }

    update() {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      
      this.vx += dx * this.easing;
      this.vy += dy * this.easing;
      
      this.vx *= 0.9;
      this.vy *= 0.9;
      
      this.x += this.vx;
      this.y += this.vy;
      
      this.life = Math.min(this.life + 0.02, this.maxLife);
    }

    draw(ctx) {
      const alpha = Math.sin(this.life * Math.PI);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace('ALPHA', alpha);
      ctx.fill();
      
      // Glow effect
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace('ALPHA', alpha * 0.3);
      ctx.fill();
    }

    disperse() {
      this.targetX = Math.random() * window.innerWidth;
      this.targetY = Math.random() * window.innerHeight;
      this.easing = 0.02;
    }
  }

  // Get pixel data from text
  const getTextPixels = useCallback((text, canvas) => {
    if (textCacheRef.current[text]) {
      return textCacheRef.current[text];
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear and draw text
    ctx.clearRect(0, 0, width, height);
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, width / 2, height / 2);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = [];
    const step = 4; // Sample every 4th pixel

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (imageData.data[index + 3] > 128) {
          pixels.push({ x, y });
        }
      }
    }

    textCacheRef.current[text] = pixels;
    return pixels;
  }, []);

  // Create particles for text
  const createTextParticles = useCallback((text, canvas) => {
    const pixels = getTextPixels(text, canvas);
    const colors = [
      'rgba(0, 240, 255, ALPHA)',
      'rgba(139, 92, 246, ALPHA)',
      'rgba(255, 0, 255, ALPHA)',
      'rgba(0, 255, 136, ALPHA)',
      'rgba(255, 200, 0, ALPHA)',
    ];

    particlesRef.current = pixels.map((pixel, i) => {
      const color = colors[i % colors.length];
      return new Particle(0, 0, pixel.x, pixel.y, color);
    });
  }, [getTextPixels]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach(particle => {
      particle.update();
      particle.draw(ctx);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Phase management
  useEffect(() => {
    if (!isActive || phase >= phases.length) {
      if (phase >= phases.length) {
        setTimeout(() => {
          setIsActive(false);
          onComplete?.();
        }, 500);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const currentPhase = phases[phase];
    
    // Create particles for current text
    createTextParticles(currentPhase.text, canvas);

    // Hold, then disperse
    const holdTimer = setTimeout(() => {
      particlesRef.current.forEach(p => p.disperse());
      
      // Next phase
      const nextTimer = setTimeout(() => {
        setPhase(p => p + 1);
      }, 1000);

      return () => clearTimeout(nextTimer);
    }, currentPhase.hold);

    return () => clearTimeout(holdTimer);
  }, [phase, isActive, phases, createTextParticles, onComplete]);

  // Start animation
  useEffect(() => {
    if (!isActive) return;
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, animate]);

  // Skip on click
  const handleSkip = () => {
    setIsActive(false);
    onComplete?.();
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] pointer-events-auto cursor-pointer"
      onClick={handleSkip}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
      
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      />

      {/* Phase indicator dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
        {phases.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: i === phase ? '#00f0ff' : '#ffffff30',
              scale: i === phase ? 1.5 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm"
      >
        Click to skip
      </motion.p>
    </motion.div>
  );
};

export default ParticleTextAnimation;
