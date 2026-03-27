import React, { useState } from 'react';
import { X, Thermometer, Shield, Filter, Zap, Lock, Unlock, Sparkles, Code, Bug, Palette, Terminal } from 'lucide-react';
import useBuilderStore from './useBuilderStore';

// ── Mode definitions (was personas, now behavior modifiers) ─────────────────
const MODES = [
  { id: 'architect', name: 'Architect', icon: '🏗️', desc: 'Focus on clean architecture and patterns', color: 'text-amber-400' },
  { id: 'coder', name: 'Full-Stack', icon: '⚡', desc: 'Production-ready code with error handling', color: 'text-primary', default: true },
  { id: 'creative', name: 'Creative', icon: '🎨', desc: 'Beautiful, modern UI/UX focus', color: 'text-pink-400' },
  { id: 'debugger', name: 'Debugger', icon: '🔍', desc: 'Analyze bugs and vulnerabilities', color: 'text-red-400' },
  { id: 'rapid', name: 'Rapid', icon: '🚀', desc: 'Fast prototypes, optimize later', color: 'text-green-400' },
];

// ── Trait toggles ────────────────────────────────────────────────────────────
const TRAITS = [
  { id: 'concise', label: 'Concise', desc: 'Brief responses, minimal comments' },
  { id: 'verbose', label: 'Verbose', desc: 'Detailed explanations and comments' },
  { id: 'autoFix', label: 'Auto-Fix', desc: 'Detect and fix common issues automatically' },
  { id: 'raw', label: 'Raw Output', desc: 'No sanitization or safety checks' },
  { id: 'types', label: 'Strong Types', desc: 'Always use TypeScript types' },
  { id: 'tests', label: 'Include Tests', desc: 'Generate unit tests with code' },
];

// ── Restriction levels ───────────────────────────────────────────────────────
const RESTRICTION_LEVELS = [
  { id: 'strict', label: 'Strict', desc: 'Enterprise-safe, all guards on', color: 'text-green-400', icon: Lock },
  { id: 'moderate', label: 'Moderate', desc: 'Balanced safety for most projects', color: 'text-yellow-400', icon: Shield },
  { id: 'lenient', label: 'Lenient', desc: 'Minimal filtering, creative freedom', color: 'text-orange-400', icon: Unlock },
  { id: 'unrestricted', label: 'Off', desc: 'No content filtering (18+ games OK)', color: 'text-red-400', icon: Zap },
];

// ── Content filters ───────────────────────────────────────────────────────────
const FILTER_CATEGORIES = [
  { id: 'explicit', label: 'Explicit Content', desc: 'NSFW, adult themes' },
  { id: 'violence', label: 'Violence', desc: 'Combat, weapons, gore' },
  { id: 'security', label: 'Security Risks', desc: 'eval(), unsafe patterns' },
  { id: 'copyright', label: 'Copyright', desc: 'Trademarked characters, IP' },
];

// ── Quick presets ─────────────────────────────────────────────────────────────
const PRESETS = [
  { id: 'enterprise', name: 'Enterprise Safe', desc: 'Strict + Architect mode', config: { mode: 'architect', restriction: 'strict', temp: 0.3, traits: ['concise', 'autoFix', 'types'] } },
  { id: 'creative', name: 'Creative Build', desc: 'Lenient + Creative mode', config: { mode: 'creative', restriction: 'lenient', temp: 0.8, traits: ['verbose', 'tests'] } },
  { id: 'gameDev', name: 'Game Dev', desc: 'Unrestricted + Rapid mode', config: { mode: 'rapid', restriction: 'unrestricted', temp: 0.9, traits: ['raw', 'concise'] } },
  { id: 'debug', name: 'Debug Mode', desc: 'Moderate + Debugger', config: { mode: 'debugger', restriction: 'moderate', temp: 0.2, traits: ['verbose', 'autoFix'] } },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAdjusters({ onClose }) {
  const { aiConfig = {}, setAIConfig } = useBuilderStore();
  
  // Local state synced to store
  const [config, setConfig] = useState({
    mode: aiConfig.mode || 'coder',
    temperature: aiConfig.temperature ?? 0.5,
    restrictionLevel: aiConfig.restrictionLevel || 'moderate',
    traits: aiConfig.traits || ['autoFix'],
    filters: aiConfig.filters || { explicit: true, violence: true, security: true, copyright: false },
  });

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setAIConfig?.(newConfig);
  };

  const toggleTrait = (traitId) => {
    const current = config.traits;
    const updated = current.includes(traitId)
      ? current.filter(t => t !== traitId)
      : [...current, traitId];
    updateConfig({ traits: updated });
  };

  const toggleFilter = (filterId) => {
    updateConfig({ 
      filters: { ...config.filters, [filterId]: !config.filters[filterId] } 
    });
  };

  const applyPreset = (preset) => {
    updateConfig({
      mode: preset.config.mode,
      temperature: preset.config.temp,
      restrictionLevel: preset.config.restriction,
      traits: preset.config.traits,
    });
  };

  const tempColor = config.temperature < 0.3 ? 'text-blue-400' : 
                    config.temperature < 0.7 ? 'text-yellow-400' : 'text-red-400';
  const tempEmoji = config.temperature < 0.3 ? '🧊' : 
                    config.temperature < 0.7 ? '⚡' : '🔥';

  return (
    <div className="flex flex-col h-full bg-[#12121e] border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-300">AI Adjusters</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Quick Presets */}
        <div className="p-3 border-b border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quick Presets</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="text-left p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all"
              >
                <div className="text-[11px] font-medium text-gray-200">{preset.name}</div>
                <div className="text-[9px] text-gray-500">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="p-3 border-b border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Mode</div>
          <div className="space-y-1">
            {MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => updateConfig({ mode: mode.id })}
                className={`w-full flex items-center gap-2 p-2 rounded transition-all ${
                  config.mode === mode.id 
                    ? 'bg-primary/15 border border-primary/30' 
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <span className="text-sm">{mode.icon}</span>
                <div className="flex-1 text-left">
                  <div className={`text-[11px] font-medium ${config.mode === mode.id ? mode.color : 'text-gray-300'}`}>
                    {mode.name}
                  </div>
                  <div className="text-[9px] text-gray-500">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Temperature</div>
            <span className={`text-[11px] font-mono ${tempColor}`}>
              {tempEmoji} {config.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={config.temperature}
            onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-gray-500 mt-1">
            <span>🧊 Precise</span>
            <span>⚡ Balanced</span>
            <span>🔥 Creative</span>
          </div>
        </div>

        {/* Restriction Level */}
        <div className="p-3 border-b border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Restriction Level</div>
          <div className="space-y-1">
            {RESTRICTION_LEVELS.map(level => {
              const Icon = level.icon;
              const isSelected = config.restrictionLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => updateConfig({ restrictionLevel: level.id })}
                  className={`w-full flex items-center gap-2 p-2 rounded transition-all ${
                    isSelected 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${level.color}`} />
                  <div className="flex-1 text-left">
                    <div className={`text-[11px] font-medium ${isSelected ? level.color : 'text-gray-300'}`}>
                      {level.label}
                    </div>
                    <div className="text-[9px] text-gray-500">{level.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {config.restrictionLevel === 'unrestricted' && (
            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="text-[9px] text-red-400">
                ⚠️ No content filtering. Generated code may include adult themes, violence, or security risks. Use responsibly.
              </div>
            </div>
          )}
        </div>

        {/* Content Filters (when not unrestricted) */}
        {config.restrictionLevel !== 'unrestricted' && (
          <div className="p-3 border-b border-white/5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Content Filters</div>
            <div className="space-y-1.5">
              {FILTER_CATEGORIES.map(filter => {
                const isEnabled = config.filters[filter.id];
                const isStrict = config.restrictionLevel === 'strict';
                const locked = isStrict && filter.id !== 'copyright';
                
                return (
                  <div 
                    key={filter.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      locked ? 'bg-green-500/5' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-[11px] text-gray-300">{filter.label}</div>
                      <div className="text-[9px] text-gray-500">{filter.desc}</div>
                    </div>
                    <button
                      onClick={() => !locked && toggleFilter(filter.id)}
                      disabled={locked}
                      className={`w-8 h-4 rounded-full transition-colors relative ${
                        isEnabled ? 'bg-green-500/50' : 'bg-gray-600'
                      } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                        isEnabled ? 'left-[18px]' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
            {config.restrictionLevel === 'strict' && (
              <div className="mt-2 text-[9px] text-green-400">
                ✓ Enterprise-safe: All critical filters locked ON
              </div>
            )}
          </div>
        )}

        {/* Traits */}
        <div className="p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Traits</div>
          <div className="flex flex-wrap gap-1.5">
            {TRAITS.map(trait => {
              const isActive = config.traits.includes(trait.id);
              return (
                <button
                  key={trait.id}
                  onClick={() => toggleTrait(trait.id)}
                  className={`px-2 py-1 rounded text-[10px] transition-all ${
                    isActive 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                  }`}
                  title={trait.desc}
                >
                  {trait.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/5">
        <div className="text-[9px] text-gray-500">Current Config</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
            {MODES.find(m => m.id === config.mode)?.icon} {MODES.find(m => m.id === config.mode)?.name}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/10 ${tempColor}`}>
            {tempEmoji} {(config.temperature * 100).toFixed(0)}%
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/10 ${
            RESTRICTION_LEVELS.find(r => r.id === config.restrictionLevel)?.color || 'text-gray-400'
          }`}>
            {RESTRICTION_LEVELS.find(r => r.id === config.restrictionLevel)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
