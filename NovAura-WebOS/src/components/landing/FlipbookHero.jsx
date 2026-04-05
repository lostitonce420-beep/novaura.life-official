/**
 * FlipbookHero - Cinematic frame-by-frame animation
 * Like a flipbook with 120-200 frames for ultra-smooth animation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Settings, Film } from 'lucide-react';
import { toast } from 'sonner';

// Frame configuration - user will place frames in /public/frames/ folder
// Naming convention: frame_001.jpg, frame_002.jpg, etc.
const TOTAL_FRAMES = 200; // Adjust based on your frame count (120-200)
const FRAME_PATH = '/frames';
const FRAME_EXTENSION = 'jpg'; // or png, webp, etc.

const FlipbookHero = ({
  className = '',
  autoPlay = true,
  fps = 2,
  loop = true,
  showControls = true
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedFrames, setLoadedFrames] = useState(0);
  const [frames, setFrames] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const containerRef = useRef(null);

  // Generate frame URLs
  useEffect(() => {
    const frameUrls = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const frameNum = (i + 1).toString().padStart(3, '0');
      return `${FRAME_PATH}/frame_${frameNum}.${FRAME_EXTENSION}`;
    });
    setFrames(frameUrls);
  }, []);

  // Preload frames
  useEffect(() => {
    if (frames.length === 0) return;

    let loaded = 0;
    const preloadPromises = frames.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loaded++;
          setLoadedFrames(loaded);
          resolve();
        };
        img.onerror = () => {
          loaded++;
          setLoadedFrames(loaded);
          resolve(); // Continue even if some frames fail
        };
        img.src = src;
      });
    });

    Promise.all(preloadPromises).then(() => {
      setIsLoading(false);
      if (autoPlay) {
        setIsPlaying(true);
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frames, autoPlay]);

  // Animation loop
  const animate = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    const frameInterval = 1000 / (fps * playbackSpeed);

    if (deltaTime >= frameInterval) {
      setCurrentFrame((prev) => {
        if (prev >= TOTAL_FRAMES - 1) {
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return prev + 1;
      });
      lastTimeRef.current = timestamp;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, fps, playbackSpeed, loop]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleFrameChange = (direction) => {
    setCurrentFrame((prev) => {
      const newFrame = prev + direction;
      if (newFrame < 0) return loop ? TOTAL_FRAMES - 1 : 0;
      if (newFrame >= TOTAL_FRAMES) return loop ? 0 : TOTAL_FRAMES - 1;
      return newFrame;
    });
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const frame = Math.floor(percentage * TOTAL_FRAMES);
    setCurrentFrame(Math.min(Math.max(frame, 0), TOTAL_FRAMES - 1));
  };

  const progress = ((currentFrame + 1) / TOTAL_FRAMES) * 100;
  const currentFrameUrl = frames[currentFrame] || '';

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black ${className}`}
    >
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <Film className="w-16 h-16 text-neon-cyan mb-4 animate-pulse" />
            <p className="text-white/60 text-sm mb-2">Loading Cinematic Sequence</p>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-pink-400"
                initial={{ width: 0 }}
                animate={{ width: `${(loadedFrames / TOTAL_FRAMES) * 100}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-2">
              {loadedFrames} / {TOTAL_FRAMES} frames
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frame Display */}
      <div className="absolute inset-0">
        {currentFrameUrl && (
          <img
            src={currentFrameUrl}
            alt={`Frame ${currentFrame + 1}`}
            className="w-full h-full object-cover"
            style={{
              imageRendering: 'high-quality',
            }}
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      {/* Scanlines Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.3) 2px,
            rgba(0,0,0,0.3) 4px
          )`,
        }}
      />

      {/* Frame Info */}
      <div className="absolute top-4 left-4 z-20">
        <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm">
          <span className="text-xs text-white/60 font-mono">
            FRAME {String(currentFrame + 1).padStart(3, '0')} / {TOTAL_FRAMES}
          </span>
        </div>
      </div>

      {/* FPS Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm">
          <span className="text-xs text-neon-cyan font-mono">
            {Math.round(fps * playbackSpeed)} FPS
          </span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-white/10 rounded-full mb-4 cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0 }}
            />
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between">
            {/* Left: Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleFrameChange(-1)}
                className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                title="Previous Frame"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleFrameChange(1)}
                className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                title="Next Frame"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Time Display */}
            <div className="px-4 py-2 rounded-lg bg-black/60 border border-white/10">
              <span className="text-sm text-white/80 font-mono">
                {((currentFrame / fps) / playbackSpeed).toFixed(2)}s / {((TOTAL_FRAMES / fps) / playbackSpeed).toFixed(2)}s
              </span>
            </div>

            {/* Right: Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg border transition-colors ${
                  showSettings 
                    ? 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan' 
                    : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Settings Panel */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-xl bg-black/90 border border-white/10 backdrop-blur-md"
                >
                  <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Playback Speed</p>
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {[0.25, 0.5, 1, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`py-1.5 rounded text-xs font-medium transition-colors ${
                          playbackSpeed === speed
                            ? 'bg-neon-cyan/20 text-neon-cyan'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Loop</p>
                  <button
                    onClick={() => {}}
                    className="w-full py-1.5 rounded text-xs text-left px-2 text-white/70"
                  >
                    {loop ? '✓ Enabled' : 'Disabled'}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity">
        <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/40">
          Space: Play/Pause • ← → : Frame Step • Home: Reset
        </div>
      </div>
    </div>
  );
};

// Keyboard controls
export const useFlipbookKeyboard = ({
  isPlaying,
  setIsPlaying,
  setCurrentFrame,
  currentFrame,
  totalFrames,
  loop
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentFrame((prev) => {
            const newFrame = prev - 1;
            return newFrame < 0 ? (loop ? totalFrames - 1 : 0) : newFrame;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentFrame((prev) => {
            const newFrame = prev + 1;
            return newFrame >= totalFrames ? (loop ? 0 : totalFrames - 1) : newFrame;
          });
          break;
        case 'Home':
          e.preventDefault();
          setCurrentFrame(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentFrame(totalFrames - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying, setCurrentFrame, currentFrame, totalFrames, loop]);
};

export default FlipbookHero;
