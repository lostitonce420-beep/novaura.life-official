/**
 * Interactive Backgrounds for Novaura Web OS
 * 
 * Available backgrounds:
 * - MeshWaterBackground: Grid mesh that reacts like water with mouse light trace
 * - ParticleField: Original particle constellation background
 * - (Add more as created)
 */

export { default as MeshWaterBackground } from './MeshWaterBackground';

// Background registry for theme system
export const BACKGROUNDS = {
  meshWater: {
    name: 'Mesh Water',
    component: 'MeshWaterBackground',
    description: 'Interactive mesh grid that ripples like water with mouse light trace',
    defaultParams: {
      gridSize: 40,
      damping: 0.95,
      tension: 0.05,
      lightRadius: 150,
      lightIntensity: 0.8,
      lineColor: '#00d9ff',
      glowColor: '#a855f7',
      lineOpacity: 0.15,
      showParticles: true,
    },
  },
  // Add more backgrounds here
};

// Theme presets
export const BACKGROUND_THEMES = {
  cosmic: {
    baseColor: '#0a0a0f',
    lineColor: '#00d9ff',
    glowColor: '#a855f7',
  },
  blueNight: {
    baseColor: '#0a1628',
    lineColor: '#60a5fa',
    glowColor: '#fbbf24',
  },
  aurora: {
    baseColor: '#0f172a',
    lineColor: '#a855f7',
    glowColor: '#10b981',
  },
  sunset: {
    baseColor: '#1a0a0a',
    lineColor: '#fb5607',
    glowColor: '#ff006e',
  },
  ocean: {
    baseColor: '#0a1a1a',
    lineColor: '#00d9ff',
    glowColor: '#00ff9f',
  },
};
