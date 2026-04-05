/**
 * CinematicIntro - NovAura OS Boot Sequence
 * RGB animated intro with Aura x Nova branding
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CinematicIntro = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Slower, more deliberate timing
    const timeline = [
      { phase: 1, delay: 800 },   // Logo emerges
      { phase: 2, delay: 2000 },  // Aura x Nova text
      { phase: 3, delay: 1200 },  // Est / 2025
      { phase: 4, delay: 1000 },  // Ecosystem text
      { phase: 5, delay: 1500 },  // Fade out
    ];

    let currentDelay = 500; // Initial delay

    timeline.forEach(({ phase: p, delay }) => {
      setTimeout(() => {
        setPhase(p);
        if (p === 5) {
          setTimeout(() => onComplete?.(), 1000);
        }
      }, currentDelay);
      currentDelay += delay;
    });
  }, [onComplete]);

  const rgbGradient = "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff00ff, #ff0000)";

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden"
        >
          {/* Animated RGB Background Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: phase >= 1 ? 0.3 : 0, 
                scale: 1.2,
                rotate: 360 
              }}
              transition={{ 
                opacity: { duration: 2 },
                scale: { duration: 20, repeat: Infinity, ease: "linear" },
                rotate: { duration: 30, repeat: Infinity, ease: "linear" }
              }}
              className="absolute w-[800px] h-[800px] rounded-full blur-[150px]"
              style={{
                background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff00ff, #ff0000)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 0.2 : 0 }}
              transition={{ duration: 2 }}
              className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
              style={{
                background: 'conic-gradient(from 180deg, #00ffff, #ff00ff, #ffff00, #00ffff)',
                bottom: '-20%',
                right: '-10%',
              }}
            />
          </div>

          {/* Main Content Container */}
          <div className="relative flex flex-col items-center justify-center">
            
            {/* Top Row - Est | Logo | 2025 */}
            <div className="flex items-center gap-8 mb-8">
              {/* Est Text - Left */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ 
                  opacity: phase >= 3 ? 1 : 0, 
                  x: phase >= 3 ? 0 : -50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-2xl md:text-4xl font-light tracking-[0.3em]"
                style={{
                  background: rgbGradient,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'rgbShift 4s ease infinite',
                }}
              >
                Est
              </motion.div>

              {/* Center Logo Container */}
              <div className="relative">
                {/* Logo Glow Effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: phase >= 1 ? 0.6 : 0, 
                    scale: phase >= 1 ? 1 : 0.5 
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 blur-3xl"
                  style={{
                    background: rgbGradient,
                    backgroundSize: '400% 400%',
                    animation: 'rgbFlow 3s ease infinite',
                  }}
                />

                {/* Main Logo */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  animate={{ 
                    opacity: phase >= 1 ? 1 : 0,
                    scale: phase >= 1 ? 1 : 0.8,
                    rotateY: phase >= 1 ? 0 : -90
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative w-32 h-32 md:w-48 md:h-48"
                >
                  <img 
                    src="/logo.png" 
                    alt="NovAura"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.5)) drop-shadow(0 0 60px rgba(255, 0, 255, 0.3))',
                    }}
                  />
                </motion.div>

                {/* Aura x Nova Text - Overlaid on Logo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: phase >= 2 ? 1 : 0,
                    y: phase >= 2 ? 0 : 20
                  }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span 
                    className="text-lg md:text-2xl font-bold tracking-[0.2em]"
                    style={{
                      background: rgbGradient,
                      backgroundSize: '300% 300%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'rgbFlow 2s ease infinite',
                      textShadow: '0 0 30px rgba(255,255,255,0.3)',
                    }}
                  >
                    Aura x Nova
                  </span>
                </motion.div>
              </div>

              {/* 2025 Text - Right */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: phase >= 3 ? 1 : 0, 
                  x: phase >= 3 ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-2xl md:text-4xl font-light tracking-[0.3em]"
                style={{
                  background: rgbGradient,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'rgbShift 4s ease infinite',
                  animationDelay: '0.5s',
                }}
              >
                2025
              </motion.div>
            </div>

            {/* NovAura Ecosystem - Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: phase >= 4 ? 1 : 0,
                y: phase >= 4 ? 0 : 30
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mt-4"
            >
              <div 
                className="text-xl md:text-3xl font-light tracking-[0.4em] uppercase"
                style={{
                  background: rgbGradient,
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'rgbFlow 3s ease infinite',
                }}
              >
                NovAura Ecosystem
              </div>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: phase >= 1 ? 1 : 0,
                width: phase >= 4 ? '200px' : '0px'
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="mt-12 h-[2px] rounded-full overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: rgbGradient,
                  backgroundSize: '400% 400%',
                  animation: 'rgbFlow 2s linear infinite',
                }}
              />
            </motion.div>

            {/* Scanlines Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.5) 2px,
                  rgba(0,0,0,0.5) 4px
                )`,
              }}
            />
          </div>

          {/* Keyframe Animations */}
          <style>{`
            @keyframes rgbFlow {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes rgbShift {
              0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
              50% { background-position: 100% 50%; filter: hue-rotate(30deg); }
              100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicIntro;
