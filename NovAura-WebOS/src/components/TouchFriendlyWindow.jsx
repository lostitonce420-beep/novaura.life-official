import React, { useState, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minus, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { Button } from './ui/button';

// Full spectrum RGB border styles - each window gets a random one
const RGB_BORDER_STYLES = [
  'rgb-border-rainbow',
  'rgb-border-hot', 
  'rgb-border-cool',
  'rgb-border-sunset',
  'rgb-border-neon',
  'rgb-border-gold',
  'rgb-border-ocean',
  'rgb-border-forest',
  'rgb-border-candy',
];

const RGB_GLOW_STYLES = [
  'rgb-glow-rainbow',
  'rgb-glow-hot',
  'rgb-glow-cool',
  'rgb-glow-gold',
];

export default function TouchFriendlyWindow({
  id,
  title,
  children,
  zIndex,
  defaultSize = { width: 600, height: 400 },
  onClose,
  onFocus,
  borderStyle = null // Allow explicit border style, or random if null
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [previousBounds, setPreviousBounds] = useState(null);
  const windowRef = useRef(null);

  // Pick a random border style for this window instance (stable across renders)
  const randomBorderStyle = useMemo(() => {
    if (borderStyle) return borderStyle;
    const borderIndex = Math.floor(Math.random() * RGB_BORDER_STYLES.length);
    const glowIndex = Math.floor(Math.random() * RGB_GLOW_STYLES.length);
    return {
      border: RGB_BORDER_STYLES[borderIndex],
      glow: RGB_GLOW_STYLES[glowIndex]
    };
  }, [id, borderStyle]); // Only re-randomize if id changes

  const handleMaximize = () => {
    if (!isMaximized) {
      const rnd = document.getElementById(`rnd-${id}`);
      if (rnd) {
        setPreviousBounds({
          x: parseInt(rnd.style.transform.match(/translate\(([^,]+)/)?.[1] || '0'),
          y: parseInt(rnd.style.transform.match(/,\s*([^)]+)/)?.[1] || '0'),
          width: rnd.offsetWidth,
          height: rnd.offsetHeight,
        });
      }
    }
    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isMinimized) return null;

  return (
    <Rnd
      id={`rnd-${id}`}
      ref={windowRef}
      default={{
        x: Math.random() * (window.innerWidth - defaultSize.width - 100) + 50,
        y: Math.random() * Math.max(50, window.innerHeight - defaultSize.height - 100) + 30,
        width: defaultSize.width,
        height: defaultSize.height,
      }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      style={{ zIndex }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      position={isMaximized ? { x: 0, y: 0 } : undefined}
      size={isMaximized ? { width: '100%', height: '100%' } : undefined}
      enableUserSelectHack={false}
      cancel=".no-drag"
    >
      {/* RGB border wrapper with FULL SPECTRUM rainbow effect */}
      <div className={`h-full w-full ${randomBorderStyle.border || 'rgb-border-rainbow'} rounded-2xl`}>
        <div className="rgb-flow-layer" />
        <div className={`flex flex-col h-full w-full bg-black/85 backdrop-blur-xl rounded-2xl overflow-hidden relative z-10 ${randomBorderStyle.glow || 'rgb-glow-rainbow'}`} style={{ animationDuration: '4s' }}>
          {/* Window Header */}
          <div className="window-drag-handle flex items-center justify-between px-4 py-2.5 bg-black/60 border-b border-white/[0.06] cursor-move no-select touch-manipulation active:cursor-grabbing">
            <div className="flex items-center gap-3">
              <GripHorizontal className="w-4 h-4 text-white/20" />
              <h3 className="text-sm font-semibold text-foreground/90">{title}</h3>
            </div>

            <div className="flex items-center gap-1 no-drag">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleMinimize}
                className="h-7 w-7 rounded-lg hover:bg-warning/20 hover:text-warning transition-colors touch-manipulation active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleMaximize}
                className="h-7 w-7 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors touch-manipulation active:scale-95"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-colors touch-manipulation active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-auto bg-transparent no-drag" style={{ touchAction: 'auto' }}>
            {children}
          </div>

          {/* Corner drag tabs — visual resize handles */}
          {!isMaximized && (
            <>
              {/* Bottom-left corner tab */}
              <div className="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize z-20 group">
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-sm border-b-2 border-l-2 border-primary/40 group-hover:border-primary/80 transition-colors group-hover:shadow-[0_0_6px_rgba(0,217,255,0.5)]" />
              </div>
              {/* Bottom-right corner tab */}
              <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20 group">
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-sm border-b-2 border-r-2 border-primary/40 group-hover:border-primary/80 transition-colors group-hover:shadow-[0_0_6px_rgba(0,217,255,0.5)]" />
              </div>
            </>
          )}
        </div>
      </div>
    </Rnd>
  );
}
