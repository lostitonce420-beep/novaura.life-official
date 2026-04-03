import React from 'react';
import { useGraphics, GRAPHICS_LEVELS, GRAPHICS_PRESETS } from '../../contexts/GraphicsContext';
import { Monitor, Zap, Battery, Cpu } from 'lucide-react';

export default function GraphicsSettingsWindow() {
  const { graphicsLevel, setGraphicsLevel, detectedLevel, GRAPHICS_LEVELS } = useGraphics();

  const levels = [
    {
      id: GRAPHICS_LEVELS.LOW,
      name: 'Low',
      description: 'Maximum performance',
      detail: 'Light particle effects (60 particles), minimal animations. Best for older devices or maximum battery life.',
      icon: Battery,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50'
    },
    {
      id: GRAPHICS_LEVELS.MEDIUM,
      name: 'Medium',
      description: 'Balanced',
      detail: 'Particle effects with moderate density, flowing colors, animated borders. Good for most modern devices.',
      icon: Monitor,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50'
    },
    {
      id: GRAPHICS_LEVELS.HIGH,
      name: 'High',
      description: 'Visual fidelity',
      detail: '3x particle density, intense lighting effects on all borders. For high-end devices and WebGPU future.',
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50'
    }
  ];

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-white">Graphics Performance</h2>
      </div>

      {detectedLevel && (
        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
          <span className="text-white/60">Recommended for your device: </span>
          <span className="text-primary font-medium capitalize">{detectedLevel}</span>
        </div>
      )}

      <div className="space-y-3">
        {levels.map((level) => {
          const Icon = level.icon;
          const isSelected = graphicsLevel === level.id;
          
          return (
            <button
              key={level.id}
              onClick={() => setGraphicsLevel(level.id)}
              className={`w-full p-4 rounded-xl border transition-all duration-200 text-left
                ${isSelected 
                  ? `${level.bgColor} ${level.borderColor} border-2` 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? level.bgColor : 'bg-white/5'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? level.color : 'text-white/60'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {level.name}
                    </h3>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white/80">
                        Active
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isSelected ? level.color : 'text-white/40'}`}>
                    {level.description}
                  </p>
                  <p className="text-xs mt-2 text-white/50 leading-relaxed">
                    {level.detail}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="text-xs text-white/40 space-y-1">
          <p>Current settings:</p>
          <ul className="ml-4 space-y-0.5">
            <li>• Particles: {GRAPHICS_PRESETS[graphicsLevel].particles.enabled ? `${GRAPHICS_PRESETS[graphicsLevel].particles.count}` : 'Off'}</li>
            <li>• Color cycling: {GRAPHICS_PRESETS[graphicsLevel].particles.colorCycling ? 'On' : 'Off'}</li>
            <li>• Animated borders: {GRAPHICS_PRESETS[graphicsLevel].borders.animated ? 'On' : 'Off'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
