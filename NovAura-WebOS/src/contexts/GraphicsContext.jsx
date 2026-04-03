import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { kernelStorage } from '../kernel/kernelStorage.js';

const GraphicsContext = createContext();

export const GRAPHICS_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

export const GRAPHICS_PRESETS = {
  [GRAPHICS_LEVELS.LOW]: {
    name: 'Low',
    description: 'Lightweight particles for weaker devices',
    particles: {
      enabled: true,
      count: 60,
      microCount: 30,
      links: false,
      mouseInteraction: false,
      colorCycling: false
    },
    borders: {
      animated: false,
      glow: false,
      flowLayer: false
    },
    background: {
      animated: false,
      mesh: false,
      aurora: false
    }
  },
  [GRAPHICS_LEVELS.MEDIUM]: {
    name: 'Medium',
    description: 'Balanced visuals for most devices',
    particles: {
      enabled: true,
      count: 140,
      microCount: 80,
      links: true,
      mouseInteraction: true,
      colorCycling: true
    },
    borders: {
      animated: true,
      glow: true,
      flowLayer: true
    },
    background: {
      animated: true,
      mesh: false,
      aurora: true
    }
  },
  [GRAPHICS_LEVELS.HIGH]: {
    name: 'High',
    description: 'Maximum visual fidelity - WebGPU ready',
    particles: {
      enabled: true,
      count: 420, // 3x
      microCount: 240, // 3x
      links: true,
      mouseInteraction: true,
      colorCycling: true
    },
    borders: {
      animated: true,
      glow: true,
      flowLayer: true,
      intense: true,
      allBorders: true
    },
    background: {
      animated: true,
      mesh: true,
      aurora: true,
      intense: true
    }
  }
};

export function GraphicsProvider({ children }) {
  const [graphicsLevel, setGraphicsLevel] = useState(() => {
    const saved = kernelStorage.getItem('novaura-graphics-level');
    return saved || GRAPHICS_LEVELS.MEDIUM;
  });

  const [detectedLevel, setDetectedLevel] = useState(null);

  useEffect(() => {
    if (detectedLevel === null) {
      detectHardwareCapability();
    }
  }, []);

  const detectHardwareCapability = () => {
    const hasWebGPU = !!navigator.gpu;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 8;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const pixelCount = window.screen.width * window.screen.height;
    const isHighRes = pixelCount > 2073600;
    
    let recommended;
    
    if (hasWebGPU && cores >= 8 && memory >= 8 && !isTouch) {
      recommended = GRAPHICS_LEVELS.HIGH;
    } else if (cores < 4 || memory < 4) {
      recommended = GRAPHICS_LEVELS.LOW;
    } else {
      recommended = GRAPHICS_LEVELS.MEDIUM;
    }
    
    setDetectedLevel(recommended);
    
    if (!kernelStorage.getItem('novaura-graphics-level')) {
      setGraphicsLevel(recommended);
    }
    
    return recommended;
  };

  const setLevel = useCallback((level) => {
    setGraphicsLevel(level);
    kernelStorage.setItem('novaura-graphics-level', level);
  }, []);

  const settings = GRAPHICS_PRESETS[graphicsLevel] || GRAPHICS_PRESETS[GRAPHICS_LEVELS.MEDIUM];

  return (
    <GraphicsContext.Provider value={{
      graphicsLevel,
      setGraphicsLevel: setLevel,
      settings,
      detectedLevel,
      detectHardwareCapability,
      GRAPHICS_LEVELS
    }}>
      {children}
    </GraphicsContext.Provider>
  );
}

export function useGraphics() {
  const context = useContext(GraphicsContext);
  if (!context) {
    throw new Error('useGraphics must be used within GraphicsProvider');
  }
  return context;
}

export default GraphicsContext;
