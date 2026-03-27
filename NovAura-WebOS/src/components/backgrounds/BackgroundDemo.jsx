/**
 * Background Demo / Preview Component
 * 
 * Showcases the interactive mesh water background with controls
 * to customize parameters in real-time.
 */

import React, { useState } from 'react';
import { MeshWaterBackground, BACKGROUND_THEMES } from './index';

export default function BackgroundDemo() {
  const [params, setParams] = useState({
    gridSize: 40,
    damping: 0.95,
    tension: 0.05,
    lightRadius: 150,
    lightIntensity: 0.8,
    lineOpacity: 0.15,
    waveSpeed: 0.5,
    showParticles: true,
  });

  const [theme, setTheme] = useState('cosmic');
  const themeColors = BACKGROUND_THEMES[theme];

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Background */}
      <MeshWaterBackground
        {...params}
        baseColor={themeColors.baseColor}
        lineColor={themeColors.lineColor}
        glowColor={themeColors.glowColor}
      />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 text-white">
        <h2 className="text-lg font-medium mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Mesh Water Background
        </h2>

        {/* Theme Selector */}
        <div className="mb-4">
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
            Theme
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BACKGROUND_THEMES).map(([key, colors]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  theme === key ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${colors.lineColor}, ${colors.glowColor})`,
                }}
                title={key}
              />
            ))}
          </div>
        </div>

        {/* Grid Size */}
        <ControlSlider
          label="Grid Size"
          value={params.gridSize}
          min={20}
          max={80}
          onChange={(v) => updateParam('gridSize', v)}
        />

        {/* Damping */}
        <ControlSlider
          label="Damping"
          value={params.damping}
          min={0.8}
          max={0.99}
          step={0.01}
          onChange={(v) => updateParam('damping', v)}
        />

        {/* Tension */}
        <ControlSlider
          label="Tension"
          value={params.tension}
          min={0.01}
          max={0.2}
          step={0.01}
          onChange={(v) => updateParam('tension', v)}
        />

        {/* Light Radius */}
        <ControlSlider
          label="Light Radius"
          value={params.lightRadius}
          min={50}
          max={300}
          onChange={(v) => updateParam('lightRadius', v)}
        />

        {/* Light Intensity */}
        <ControlSlider
          label="Light Intensity"
          value={params.lightIntensity}
          min={0.1}
          max={1}
          step={0.1}
          onChange={(v) => updateParam('lightIntensity', v)}
        />

        {/* Line Opacity */}
        <ControlSlider
          label="Line Opacity"
          value={params.lineOpacity}
          min={0.05}
          max={0.5}
          step={0.05}
          onChange={(v) => updateParam('lineOpacity', v)}
        />

        {/* Toggles */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-white/70">Show Particles</span>
          <button
            onClick={() => updateParam('showParticles', !params.showParticles)}
            className={`w-12 h-6 rounded-full transition-colors ${
              params.showParticles ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                params.showParticles ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Code Export */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <details className="text-xs">
            <summary className="cursor-pointer text-white/50 hover:text-white">
              View Code
            </summary>
            <pre className="mt-2 p-2 bg-black/50 rounded text-cyan-300 overflow-x-auto">
{`<MeshWaterBackground
  gridSize={${params.gridSize}}
  damping={${params.damping}}
  tension={${params.tension}}
  lightRadius={${params.lightRadius}}
  lightIntensity={${params.lightIntensity}}
  baseColor="${themeColors.baseColor}"
  lineColor="${themeColors.lineColor}"
  glowColor="${themeColors.glowColor}"
  lineOpacity={${params.lineOpacity}}
  showParticles={${params.showParticles}}
/>`}
            </pre>
          </details>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/50 text-sm">
        <p>Move your mouse to create ripples in the mesh</p>
        <p>The light trace follows your cursor</p>
      </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-xs text-white/50">{label}</label>
        <span className="text-xs text-cyan-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  );
}
