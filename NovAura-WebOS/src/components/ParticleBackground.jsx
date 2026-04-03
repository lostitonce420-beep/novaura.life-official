import React, { useEffect, useRef, useCallback } from 'react';
import { useGraphics } from '../contexts/GraphicsContext';

// ============================================
// THEME CONFIGURATIONS
// ============================================

const THEME_CONFIGS = {
  // Original themes
  cosmic: {
    background: '#0a0a0f',
    colors: [
      '#00b8d9', '#0891b2', '#0e7490',
      '#8b5cf6', '#7c3aed', '#6d28d9',
      '#d946ef', '#c026d3', '#a21caf',
      '#10b981', '#059669', '#047857',
      '#d97706', '#b45309', '#92400e',
      '#3b82f6', '#2563eb', '#1d4ed8',
      '#db2777', '#be185d'
    ],
    microColors: [
      '#22d3ee', '#67e8f9', '#a5f3fc',
      '#c084fc', '#d8b4fe', '#e9d5ff',
      '#e879f9', '#f0abfc', '#f5d0fe',
      '#34d399', '#6ee7b7', '#a7f3d0',
      '#fcd34d', '#fde68a', '#fef3c7',
      '#60a5fa', '#93c5fd', '#bfdbfe',
      '#f472b6', '#f9a8d4'
    ],
    linkColor: '0, 217, 255',
    mouseLinkColor: '168, 85, 247',
    particleSizeMultiplier: 1,
    flowSpeed: 1,
    glowIntensity: 1,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  
  'blue-night': {
    background: '#0f1729',
    colors: ['#60a5fa', '#ffffff', '#fbbf24', '#f59e0b', '#ef4444', '#60a5fa'],
    microColors: ['#60a5fa', '#93c5fd', '#ffffff', '#fcd34d', '#fbbf24', '#f97316', '#ef4444'],
    linkColor: '96, 165, 250',
    mouseLinkColor: '251, 191, 36',
    particleSizeMultiplier: 1,
    flowSpeed: 1,
    glowIntensity: 1,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  
  light: {
    background: '#f5f2ed',
    colors: [
      '#5a8a6e', '#6b9b7f', '#7cac90',
      '#b86b7e', '#c97c8f', '#da8da0',
      '#c9a35f', '#dab470', '#ebc581',
      '#7a9a8a', '#8bab9b', '#9cbcac',
      '#a67c6b', '#b78d7c', '#c89e8d'
    ],
    microColors: [
      '#8cbfa3', '#9dd0b4', '#aee1c5',
      '#d49aaa', '#e5abbb', '#f6bccc',
      '#e4c882', '#f5d993', '#ffea84',
      '#aaccbb', '#bbddcc', '#cceedd',
      '#c9a99a', '#dabfab', '#ebd5cc'
    ],
    linkColor: '90, 138, 110',
    mouseLinkColor: '184, 107, 126',
    particleSizeMultiplier: 1,
    flowSpeed: 1,
    glowIntensity: 1,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  
  matrix: {
    background: '#000a00',
    colors: [
      '#00ff00', '#00f500', '#00eb00',
      '#00e000', '#00d600', '#00cc00',
      '#00c200', '#00b800', '#00ad00',
      '#00a300', '#009900', '#008f00',
      '#008500', '#007a00', '#007000',
      '#006600', '#005c00', '#005200',
      '#004700', '#003d00', '#003300',
      '#002900', '#001f00', '#001400',
    ],
    microColors: [
      '#39ff14', '#32ff12', '#2bff10',
      '#1aff0d', '#0dff0b', '#05ff09',
      '#00fa08', '#00f007', '#00e607',
      '#00db06', '#00d106', '#00c705',
      '#00bc05', '#00b204', '#00a804',
      '#009d04', '#009303', '#008903',
      '#1aff66', '#33ff7a', '#4dff8f',
    ],
    linkColor: '0, 255, 65',
    mouseLinkColor: '57, 255, 20',
    particleSizeMultiplier: 0.5,
    flowSpeed: 0.6,
    glowIntensity: 1.5,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  
  // ============================================
  // NEW PREMIUM THEMES
  // ============================================
  
  // STORMY - Dark stormy sky with rain
  stormy: {
    background: '#0d1117',
    colors: [
      '#64748b', '#475569', '#334155', // Slate grays
      '#94a3b8', '#cbd5e1', '#e2e8f0', // Light grays
      '#60a5fa', '#3b82f6', '#2563eb', // Lightning blues
      '#a855f7', '#8b5cf6', '#7c3aed', // Storm purples
    ],
    microColors: [
      '#94a3b8', '#a8b5c4', '#bcc8d4',
      '#60a5fa', '#7bb3fb', '#96c1fc',
      '#a78bfa', '#b69dfb', '#c5b0fc',
    ],
    linkColor: '148, 163, 184',
    mouseLinkColor: '96, 165, 250',
    particleSizeMultiplier: 0.7,
    flowSpeed: 1.8, // Faster for rain effect
    glowIntensity: 0.8,
    hasRain: true,
    rainCount: 150,
    fontFamily: "'Cinzel', 'Playfair Display', serif",
  },
  
  // AURORA - Northern lights with stationary stars
  aurora: {
    background: '#0a0f1a', // Deep twilight blue
    colors: [
      '#22d3ee', '#06b6d4', '#0891b2', // Cyan aurora
      '#a855f7', '#c084fc', '#d8b4fe', // Purple aurora
      '#4ade80', '#22c55e', '#16a34a', // Green aurora
      '#f472b6', '#fb7185', '#fda4af', // Pink aurora edges
    ],
    microColors: [
      '#67e8f9', '#7ee7fa', '#95e6fb',
      '#c4b5fd', '#d4c8fe', '#e4dbff',
      '#86efac', '#9df2b8', '#b4f5c4',
    ],
    linkColor: '34, 211, 238',
    mouseLinkColor: '168, 85, 247',
    particleSizeMultiplier: 1.2, // Larger for aurora ribbons
    flowSpeed: 0.4, // Slow, dancing flow
    glowIntensity: 2.0, // Strong glow for aurora
    hasStars: true,
    starCount: 200,
    auroraWaves: 5,
    fontFamily: "'Quicksand', 'Comfortaa', sans-serif",
  },
  
  // MESH WATER - Net floating over water
  meshwater: {
    background: '#0c1a2d',
    colors: [
      '#0ea5e9', '#0284c7', '#0369a1', // Ocean blues
      '#06b6d4', '#0891b2', '#0e7490', // Teal depths
      '#22d3ee', '#67e8f9', '#a5f3fc', // Surface shimmer
    ],
    microColors: [
      '#7dd3fc', '#a3dffd', '#c9ebfe',
      '#5eead4', '#8df0e3', '#bcf5f1',
      '#bae6fd', '#d0effe', '#e6f7ff',
    ],
    linkColor: '14, 165, 233',
    mouseLinkColor: '34, 211, 238',
    particleSizeMultiplier: 0.6,
    flowSpeed: 0.5,
    glowIntensity: 1.2,
    meshMode: true,
    meshRows: 12,
    meshCols: 16,
    waveAmplitude: 30,
    waveFrequency: 0.02,
    fontFamily: "'Montserrat', 'Raleway', sans-serif",
  },
  
  // GOLDEN BLAZE - Warm, fiery, golden
  blaze: {
    background: '#1a0f05',
    colors: [
      '#fbbf24', '#f59e0b', '#d97706', // Gold
      '#f97316', '#ea580c', '#c2410c', // Orange flame
      '#ef4444', '#dc2626', '#b91c1c', // Red embers
      '#fcd34d', '#fde68a', '#fef3c7', // Light gold sparks
    ],
    microColors: [
      '#fcd34d', '#fde47a', '#fef1b8',
      '#fdba74', '#fdc595', '#fed0b6',
      '#fca5a5', '#fdb8b8', '#fecbcb',
    ],
    linkColor: '251, 191, 36',
    mouseLinkColor: '239, 68, 68',
    particleSizeMultiplier: 0.9,
    flowSpeed: 1.3, // Rising heat effect
    glowIntensity: 1.8, // Ember glow
    heatDistortion: true,
    sparkCount: 50,
    fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
  },
};

// ============================================
// FONT CONFIGURATIONS
// ============================================

export const FONT_CONFIGS = {
  default: {
    family: "'Inter', system-ui, -apple-system, sans-serif",
    weights: [300, 400, 500, 600, 700],
    letterSpacing: 'normal',
    lineHeight: 1.5,
  },
  // Sharp/Pointed - Cyberpunk, aggressive
  razor: {
    family: "'Orbitron', 'Rajdhani', sans-serif",
    weights: [400, 500, 600, 700, 900],
    letterSpacing: '0.05em',
    lineHeight: 1.3,
    textTransform: 'uppercase',
    googleFont: 'Orbitron:wght@400;500;600;700;900',
  },
  // Sophisticated/Elegant
  luxe: {
    family: "'Playfair Display', 'Cormorant Garamond', serif",
    weights: [400, 500, 600, 700],
    letterSpacing: '0.02em',
    lineHeight: 1.6,
    googleFont: 'Playfair+Display:wght@400;500;600;700',
  },
  // Modern Geometric
  nova: {
    family: "'Montserrat', 'Raleway', sans-serif",
    weights: [300, 400, 500, 600, 700, 800],
    letterSpacing: '0.01em',
    lineHeight: 1.5,
    googleFont: 'Montserrat:wght@300;400;500;600;700;800',
  },
  // Handwritten/Artistic
  artisan: {
    family: "'Caveat', 'Dancing Script', cursive",
    weights: [400, 500, 600, 700],
    letterSpacing: 'normal',
    lineHeight: 1.4,
    googleFont: 'Caveat:wght@400;500;600;700',
  },
  // Monospace/Coding
  code: {
    family: "'JetBrains Mono', 'Fira Code', monospace",
    weights: [300, 400, 500, 600, 700],
    letterSpacing: '0',
    lineHeight: 1.6,
    googleFont: 'JetBrains+Mono:wght@300;400;500;600;700',
  },
  // Gothic/Dark
  gothic: {
    family: "'Cinzel', 'Cinzel Decorative', serif",
    weights: [400, 500, 600, 700, 900],
    letterSpacing: '0.08em',
    lineHeight: 1.4,
    textTransform: 'uppercase',
    googleFont: 'Cinzel:wght@400;500;600;700;900',
  },
  // Rounded/Friendly
  soft: {
    family: "'Quicksand', 'Nunito', sans-serif",
    weights: [300, 400, 500, 600, 700],
    letterSpacing: '0.01em',
    lineHeight: 1.6,
    googleFont: 'Quicksand:wght@300;400;500;600;700',
  },
};

// Hook to get current font config
export function useFontConfig(fontKey = 'default') {
  return FONT_CONFIGS[fontKey] || FONT_CONFIGS.default;
}

// Generate Google Fonts URL
export function getGoogleFontsUrl(fonts = ['default']) {
  const families = fonts
    .map(f => FONT_CONFIGS[f]?.googleFont)
    .filter(Boolean);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}

// ============================================
// PARTICLE BACKGROUND COMPONENT
// ============================================

// Inner component that actually renders the canvas
function ParticleBackgroundCanvas({ config = 'idle', theme = 'cosmic', settings }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const microRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const attractorsRef = useRef([]);
  const microAttractorsRef = useRef([]);
  const themeRef = useRef(theme);
  
  // Theme-specific refs
  const rainRef = useRef([]);
  const starsRef = useRef([]);
  const sparksRef = useRef([]);
  const meshNodesRef = useRef([]);

  // Update theme ref and recolor particles when prop changes
  useEffect(() => {
    themeRef.current = theme;
    const tc = THEME_CONFIGS[theme] || THEME_CONFIGS.cosmic;
    for (const p of particlesRef.current) {
      p.color = tc.colors[Math.floor(Math.random() * tc.colors.length)];
    }
    for (const p of microRef.current) {
      p.color = tc.microColors[Math.floor(Math.random() * tc.microColors.length)];
    }
  }, [theme]);

  const getThemeConfig = useCallback(() => {
    return THEME_CONFIGS[themeRef.current] || THEME_CONFIGS.cosmic;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const themeConfig = getThemeConfig();
    const colors = themeConfig.colors;
    const microColors = themeConfig.microColors;
    
    const baseParticleCount = settings.particles.count;
    const baseMicroCount = settings.particles.microCount;
    const particleCount = config === 'active' ? Math.floor(baseParticleCount * 1.4) : baseParticleCount;
    const microCount = config === 'active' ? Math.floor(baseMicroCount * 1.4) : baseMicroCount;
    
    const baseSpeed = config === 'active' ? 2.0 : 0.8;
    const linkDistance = 150;
    const enableLinks = settings.particles.links;
    const enableColorCycling = settings.particles.colorCycling;
    
    const sizeMultiplier = themeConfig.particleSizeMultiplier || 1;
    const flowSpeedMult = themeConfig.flowSpeed || 1;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init main particles (reinitialize if count changed)
    if (particlesRef.current.length !== particleCount) {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        const colorGroup = i % 20;
        const baseSize = (Math.random() * 3 + 1) * sizeMultiplier;
        
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * baseSpeed * 2 * flowSpeedMult * (0.5 + Math.random()),
          vy: (Math.random() - 0.5) * baseSpeed * 2 * flowSpeedMult * (0.5 + Math.random()),
          size: Math.max(baseSize, 0.8),
          color: colors[colorGroup % colors.length],
          baseColorIndex: colorGroup % colors.length,
          colorGroup: colorGroup,
          colorPhase: Math.random() * Math.PI * 2,
          colorSpeed: (0.3 + Math.random() * 2.2) * flowSpeedMult,
          opacity: Math.random() * 0.5 + 0.3,
          opacityDir: Math.random() > 0.5 ? 1 : -1,
          driftAngle: Math.random() * Math.PI * 2,
          driftSpeed: (0.2 + Math.random() * 0.4) * flowSpeedMult,
          swirlOffset: Math.random() * 1000,
          fallBias: themeConfig.hasRain ? 2 : (theme === 'matrix' ? (Math.random() * 0.5 + 0.5) : 1),
        });
      }
    }

    // Init micro particles (reinitialize if count changed)
    if (microRef.current.length !== microCount) {
      microRef.current = [];
      for (let i = 0; i < microCount; i++) {
        const colorGroup = i % 20;
        microRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8 * flowSpeedMult,
          vy: (Math.random() - 0.5) * 0.8 * flowSpeedMult,
          size: 0.4 + Math.random() * 1.2,
          color: microColors[colorGroup % microColors.length],
          baseColorIndex: colorGroup % microColors.length,
          colorGroup: colorGroup,
          colorPhase: Math.random() * Math.PI * 2,
          colorSpeed: 0.3 + Math.random() * 1.2,
          opacity: 0.15 + Math.random() * 0.35,
          opacityDir: Math.random() > 0.5 ? 1 : -1,
          pulseSpeed: 0.002 + Math.random() * 0.004,
          driftAngle: Math.random() * Math.PI * 2,
          driftSpeed: 0.1 + Math.random() * 0.3,
          swirlOffset: Math.random() * 1000,
          fallBias: themeConfig.hasRain ? 1.5 : (theme === 'matrix' ? (Math.random() * 0.3 + 0.7) : 1),
        });
      }
    }

    // STORMY: Init rain drops
    if (themeConfig.hasRain) {
      const rainCount = themeConfig.rainCount || 100;
      if (rainRef.current.length !== rainCount) {
        rainRef.current = [];
        for (let i = 0; i < rainCount; i++) {
        rainRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 15 + 10,
          opacity: Math.random() * 0.4 + 0.1,
          width: Math.random() * 1 + 0.5,
        });
        }
      }
    }

    // AURORA: Init stars
    if (themeConfig.hasStars) {
      const starCount = themeConfig.starCount || 150;
      if (starsRef.current.length !== starCount) {
        starsRef.current = [];
        for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.6, // Only in upper 60%
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
        });
        }
      }
    }

    // BLAZE: Init sparks
    if (themeConfig.heatDistortion) {
      const sparkCount = themeConfig.sparkCount || 40;
      if (sparksRef.current.length !== sparkCount) {
        sparksRef.current = [];
        for (let i = 0; i < sparkCount; i++) {
        sparksRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 3 + 2),
          size: Math.random() * 2 + 0.5,
          life: Math.random(),
          decay: Math.random() * 0.01 + 0.005,
        });
        }
      }
    }

    // MESH WATER: Init mesh nodes
    if (themeConfig.meshMode) {
      const rows = themeConfig.meshRows || 10;
      const cols = themeConfig.meshCols || 14;
      const expectedNodes = rows * cols;
      if (meshNodesRef.current.length !== expectedNodes) {
        meshNodesRef.current = [];
        const spacingX = canvas.width / (cols - 1);
        const spacingY = canvas.height / (rows - 1);
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            meshNodesRef.current.push({
            baseX: c * spacingX,
            baseY: r * spacingY,
            x: c * spacingX,
            y: r * spacingY,
            row: r,
            col: c,
            phase: (r + c) * 0.3,
            });
          }
        }
      }
    }

    // Init attractors
    if (attractorsRef.current.length !== 4) {
      attractorsRef.current = [];
      for (let i = 0; i < 4; i++) {
        let hue;
        if (theme === 'matrix') hue = [100, 120, 130, 140][i];
        else if (theme === 'stormy') hue = [210, 220, 250, 270][i];
        else if (theme === 'aurora') hue = [180, 270, 140, 320][i];
        else if (theme === 'meshwater') hue = [190, 200, 180, 170][i];
        else if (theme === 'blaze') hue = [30, 20, 10, 0][i];
        else hue = [190, 270, 320, 140][i];
        
        attractorsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          strength: 0.015 + Math.random() * 0.025,
          radius: 180 + Math.random() * 120,
          lifetime: 0,
          maxLife: 200 + Math.random() * 400,
          speedMult: 0.5 + Math.random() * 2.5,
          hue,
        });
      }
    }

    // Init micro-attractors
    if (microAttractorsRef.current.length !== 6) {
      microAttractorsRef.current = [];
      for (let i = 0; i < 6; i++) {
        let hue;
        if (theme === 'matrix') hue = [100, 110, 120, 130, 140, 150][i];
        else if (theme === 'stormy') hue = [200, 210, 220, 230, 240, 250][i];
        else if (theme === 'aurora') hue = [170, 190, 260, 280, 130, 150][i];
        else if (theme === 'meshwater') hue = [185, 195, 175, 165, 200, 190][i];
        else if (theme === 'blaze') hue = [35, 25, 15, 5, 45, 55][i];
        else hue = [190, 230, 270, 310, 140, 60][i];
        
        microAttractorsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          strength: 0.008 + Math.random() * 0.015,
          radius: 100 + Math.random() * 80,
          lifetime: 0,
          maxLife: 150 + Math.random() * 300,
          hue,
        });
      }
    }

    const isMouseDownRef = { current: false };
    
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseDown = () => { isMouseDownRef.current = true; };
    const handleMouseUp = () => { isMouseDownRef.current = false; };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      isMouseDownRef.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    const updateAttractors = (arr) => {
      for (let a = 0; a < arr.length; a++) {
        const att = arr[a];
        att.lifetime++;

        if (att.lifetime > att.maxLife) {
          att.lifetime = 0;
          att.maxLife = 150 + Math.random() * 400;
          const angle = Math.random() * Math.PI * 2;
          const spd = 0.5 + Math.random() * 2.5;
          att.vx = Math.cos(angle) * spd * 2;
          att.vy = Math.sin(angle) * spd * 2;
          att.strength = 0.008 + Math.random() * 0.025;
          att.radius = 100 + Math.random() * 120;
        }

        att.vx += (Math.random() - 0.5) * 0.08;
        att.vy += (Math.random() - 0.5) * 0.08;

        const aspd = Math.sqrt(att.vx * att.vx + att.vy * att.vy);
        if (aspd > 4) { att.vx = (att.vx / aspd) * 4; att.vy = (att.vy / aspd) * 4; }

        att.x += att.vx;
        att.y += att.vy;

        if (att.x < -50) att.x = canvas.width + 50;
        if (att.x > canvas.width + 50) att.x = -50;
        if (att.y < -50) att.y = canvas.height + 50;
        if (att.y > canvas.height + 50) att.y = -50;
      }
    };

    // Draw rain for stormy theme
    const drawRain = (time) => {
      const rain = rainRef.current;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < rain.length; i++) {
        const r = rain[i];
        r.y += r.speed;
        r.x += Math.sin(time * 2 + i) * 0.5; // Slight wind
        
        if (r.y > canvas.height) {
          r.y = -r.length;
          r.x = Math.random() * canvas.width;
        }
        
        ctx.globalAlpha = r.opacity;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + Math.sin(time + i) * 2, r.y + r.length);
        ctx.stroke();
      }
    };

    // Draw stars for aurora theme
    const drawStars = (time) => {
      const stars = starsRef.current;
      
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = Math.sin(time * s.twinkleSpeed * 100 + s.twinklePhase);
        const opacity = s.opacity * (0.7 + twinkle * 0.3);
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw aurora waves
    const drawAurora = (time) => {
      const waves = themeConfig.auroraWaves || 4;
      const colors = ['#22d3ee', '#a855f7', '#4ade80', '#f472b6'];
      
      for (let w = 0; w < waves; w++) {
        const yOffset = 100 + w * 80;
        ctx.globalAlpha = 0.3;
        
        const gradient = ctx.createLinearGradient(0, yOffset - 50, 0, yOffset + 50);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, colors[w % colors.length] + '40');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = yOffset + 
            Math.sin(x * 0.003 + time * 0.5 + w) * 30 +
            Math.sin(x * 0.007 + time * 0.3 + w * 2) * 20 +
            Math.sin(x * 0.001 + time * 0.2) * 40;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fill();
      }
    };

    // Draw sparks for blaze theme
    const drawSparks = () => {
      const sparks = sparksRef.current;
      
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx += (Math.random() - 0.5) * 0.1;
        s.life -= s.decay;
        
        if (s.life <= 0) {
          s.x = Math.random() * canvas.width;
          s.y = canvas.height + Math.random() * 50;
          s.vx = (Math.random() - 0.5) * 2;
          s.vy = -(Math.random() * 3 + 2);
          s.life = 1;
        }
        
        const alpha = s.life * 0.8;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f97316';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    // Draw mesh water
    const drawMesh = (time) => {
      const nodes = meshNodesRef.current;
      const amp = themeConfig.waveAmplitude || 20;
      const freq = themeConfig.waveFrequency || 0.02;
      const rows = themeConfig.meshRows || 10;
      const cols = themeConfig.meshCols || 14;
      
      // Update node positions with wave effect
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const waveY = Math.sin(n.baseX * freq + time) * amp +
                      Math.sin(n.baseX * freq * 2 + time * 0.7) * (amp * 0.5);
        const waveX = Math.cos(n.baseY * freq * 0.5 + time * 0.5) * (amp * 0.3);
        
        n.x = n.baseX + waveX;
        n.y = n.baseY + waveY;
      }
      
      // Draw mesh lines
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const node = nodes[r * cols + c];
          if (c === 0) ctx.moveTo(node.x, node.y);
          else ctx.lineTo(node.x, node.y);
        }
        ctx.stroke();
      }
      
      // Vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const node = nodes[r * cols + c];
          if (r === 0) ctx.moveTo(node.x, node.y);
          else ctx.lineTo(node.x, node.y);
        }
        ctx.stroke();
      }
      
      // Draw nodes
      ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.globalAlpha = 0.4 + Math.sin(time + n.phase) * 0.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      const currentTheme = getThemeConfig();
      const time = Date.now() * 0.001;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = currentTheme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Theme-specific background layers
      if (currentTheme.hasStars) {
        drawStars(time);
      }
      
      if (currentTheme.auroraWaves) {
        drawAurora(time);
      }
      
      if (currentTheme.meshMode) {
        drawMesh(time);
      }
      
      if (currentTheme.heatDistortion) {
        drawSparks();
      }
      
      if (currentTheme.hasRain) {
        drawRain(time);
      }
      
      const particles = particlesRef.current;
      const micros = microRef.current;
      const attractors = attractorsRef.current;
      const microAtts = microAttractorsRef.current;
      const mouse = mouseRef.current;

      updateAttractors(attractors);
      updateAttractors(microAtts);

      // === Update & draw MICRO particles ===
      for (let i = 0; i < micros.length; i++) {
        const p = micros[i];

        p.opacity += p.opacityDir * p.pulseSpeed;
        if (p.opacity > 0.5) { p.opacity = 0.5; p.opacityDir = -1; }
        if (p.opacity < 0.08) { p.opacity = 0.08; p.opacityDir = 1; }

        p.driftAngle += 0.003 + Math.random() * 0.002;
        p.vx += Math.cos(p.driftAngle) * p.driftSpeed * 0.005;
        p.vy += Math.sin(p.driftAngle) * p.driftSpeed * 0.005 * (p.fallBias || 1);

        for (let a = 0; a < microAtts.length; a++) {
          const att = microAtts[a];
          const dx = att.x - p.x;
          const dy = att.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < att.radius && dist > 0) {
            p.vx += dx / dist * att.strength;
            p.vy += dy / dist * att.strength;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.996;
        p.vy *= 0.996;

        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd < 0.15) {
          p.vx += Math.cos(p.driftAngle) * 0.1;
          p.vy += Math.sin(p.driftAngle) * 0.1;
        }

        if (p.x < 0) { p.vx = Math.abs(p.vx) * 0.8; p.x = 1; }
        else if (p.x > canvas.width) { p.vx = -Math.abs(p.vx) * 0.8; p.x = canvas.width - 1; }
        if (p.y < 0) { p.vy = Math.abs(p.vy) * 0.8; p.y = 1; }
        else if (p.y > canvas.height) { p.vy = -Math.abs(p.vy) * 0.8; p.y = canvas.height - 1; }

        let particleColor = p.color;
        if (enableColorCycling) {
          const swirlTime = time * p.colorSpeed + p.swirlOffset * 0.001;
          const colorProgress = (Math.sin(swirlTime + p.colorPhase) + 1) / 2;
          const colorIndex = Math.floor(colorProgress * currentTheme.microColors.length);
          particleColor = currentTheme.microColors[colorIndex];
        }
        
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        if (p.size > 0.8) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = particleColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // === Update & draw MAIN particles ===
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.opacity += p.opacityDir * 0.003;
        if (p.opacity > 0.8) { p.opacity = 0.8; p.opacityDir = -1; }
        if (p.opacity < 0.2) { p.opacity = 0.2; p.opacityDir = 1; }

        p.driftAngle += 0.005 + Math.random() * 0.003;
        p.vx += Math.cos(p.driftAngle) * p.driftSpeed * 0.008;
        p.vy += Math.sin(p.driftAngle) * p.driftSpeed * 0.008 * (p.fallBias || 1);

        if (isMouseDownRef.current) {
          const mdx = mouse.x - p.x;
          const mdy = mouse.y - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 200 && mdist > 0) {
            p.vx += mdx / mdist * 0.04;
            p.vy += mdy / mdist * 0.04;
          }
        }

        for (let a = 0; a < attractors.length; a++) {
          const att = attractors[a];
          const adx = att.x - p.x;
          const ady = att.y - p.y;
          const adist = Math.sqrt(adx * adx + ady * ady);
          if (adist < att.radius && adist > 0) {
            p.vx += adx / adist * att.strength;
            p.vy += ady / adist * att.strength;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.993;
        p.vy *= 0.993;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.3) {
          p.vx += Math.cos(p.driftAngle) * 0.15;
          p.vy += Math.sin(p.driftAngle) * 0.15;
        }

        if (p.x < 0) { p.vx = Math.abs(p.vx) * 0.7 + 0.2; p.x = 1; }
        else if (p.x > canvas.width) { p.vx = -Math.abs(p.vx) * 0.7 - 0.2; p.x = canvas.width - 1; }
        if (p.y < 0) { p.vy = Math.abs(p.vy) * 0.7 + 0.2; p.y = 1; }
        else if (p.y > canvas.height) { p.vy = -Math.abs(p.vy) * 0.7 - 0.2; p.y = canvas.height - 1; }

        let mainParticleColor = p.color;
        if (enableColorCycling) {
          const swirlTime = time * p.colorSpeed * 0.5 + p.swirlOffset * 0.001;
          const colorWave = Math.sin(swirlTime + p.colorPhase) * 0.5 + 
                           Math.sin(swirlTime * 0.7 + p.x * 0.01) * 0.3 + 
                           Math.sin(swirlTime * 0.5 + p.y * 0.01) * 0.2;
          const colorProgress = (colorWave + 1) / 2;
          const mainColorIndex = Math.floor(colorProgress * currentTheme.colors.length);
          mainParticleColor = currentTheme.colors[mainColorIndex];
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = mainParticleColor;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        const glowMult = currentTheme.glowIntensity || 1;
        ctx.shadowBlur = 15 * glowMult;
        ctx.shadowColor = mainParticleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // === Draw particle-to-particle links ===
      if (enableLinks && !currentTheme.meshMode) {
        ctx.globalAlpha = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDistance) {
              const opacity = (1 - dist / linkDistance) * 0.2;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(${currentTheme.linkColor}, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // === Mouse links ===
      if (enableLinks && isMouseDownRef.current) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const opacity = (1 - dist / 200) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${currentTheme.mouseLinkColor}, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // === Ghost attractor links ===
      for (let a = 0; a < attractors.length; a++) {
        const att = attractors[a];
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = att.x - p.x;
          const dy = att.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < att.radius * 0.5) {
            const opacity = (1 - dist / (att.radius * 0.5)) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(att.x, att.y);
            ctx.strokeStyle = `hsla(${att.hue}, 80%, 60%, ${opacity})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // === Micro-attractor subtle aura ===
      for (let a = 0; a < microAtts.length; a++) {
        const att = microAtts[a];
        const grad = ctx.createRadialGradient(att.x, att.y, 0, att.x, att.y, att.radius * 0.4);
        grad.addColorStop(0, `hsla(${att.hue}, 70%, 60%, 0.02)`);
        grad.addColorStop(1, `hsla(${att.hue}, 70%, 60%, 0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(att.x, att.y, att.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [config, getThemeConfig, settings]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default function ParticleBackground({ config = 'idle', theme = 'cosmic' }) {
  const { settings, graphicsLevel } = useGraphics();

  // If particles disabled (low graphics legacy), render static background
  if (!settings.particles.enabled) {
    return (
      <div
        className="absolute inset-0 z-0"
        style={{
          background: THEME_CONFIGS[theme]?.background || '#0a0a0f',
          pointerEvents: 'none'
        }}
      />
    );
  }

  // Force full remount when graphics level changes so particle counts reinitialize cleanly
  return <ParticleBackgroundCanvas key={graphicsLevel} config={config} theme={theme} settings={settings} />;
}

// Export theme configs for use in other components
export { THEME_CONFIGS };
