import React, { useState } from 'react';
import CuteRobotHeadSimple from '../components/CuteRobotHeadSimple';
import { Sparkles, Heart, Zap, Moon, Bot } from 'lucide-react';

// Test page for the Cute Robot Head component
export default function RobotTestPage() {
  const [mood, setMood] = useState('happy');
  const [size, setSize] = useState('medium');

  const moods = [
    { id: 'happy', label: 'Happy', color: 'from-pink-500 to-rose-500', icon: Heart },
    { id: 'curious', label: 'Curious', color: 'from-violet-500 to-purple-500', icon: Sparkles },
    { id: 'excited', label: 'Excited', color: 'from-amber-500 to-yellow-500', icon: Zap },
    { id: 'calm', label: 'Calm', color: 'from-blue-500 to-cyan-500', icon: Moon },
    { id: 'sleepy', label: 'Sleepy', color: 'from-indigo-500 to-violet-500', icon: Bot },
  ];

  const sizes = [
    { id: 'small', label: 'Small', desc: '96px - Good for icons' },
    { id: 'medium', label: 'Medium', desc: '160px - Sidebar size' },
    { id: 'large', label: 'Large', desc: '224px - Hero display' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Nova AI Robot Head
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-slate-400 text-lg">
            Interactive animated avatar component test page
          </p>
        </div>

        {/* Main Display */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-12 mb-8 
                      border border-slate-700/50 flex flex-col items-center">
          <CuteRobotHeadSimple 
            size={size}
            mood={mood}
            onClick={(newMood) => setMood(newMood)}
          />
          <p className="mt-8 text-slate-400">
            Current Mood: <span className="text-white font-semibold capitalize">{mood}</span>
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Click the robot to change moods!
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Selector */}
          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Select Mood
            </h2>
            <div className="space-y-2">
              {moods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl
                              transition-all duration-300 border
                              ${mood === m.id 
                                ? 'bg-slate-700/50 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                                : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/30'
                              }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${m.color} 
                                   flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{m.label}</p>
                    </div>
                    {mood === m.id && (
                      <Sparkles className="w-5 h-5 text-yellow-400 ml-auto animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              Select Size
            </h2>
            <div className="space-y-3">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl
                            transition-all duration-300 border
                            ${size === s.id 
                              ? 'bg-slate-700/50 border-cyan-500/50' 
                              : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/30'
                            }`}
                >
                  <div className="text-left">
                    <p className="text-white font-medium">{s.label}</p>
                    <p className="text-slate-400 text-sm">{s.desc}</p>
                  </div>
                  {size === s.id && (
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Size Preview */}
            <div className="mt-6 p-6 bg-slate-900/50 rounded-xl flex items-center justify-center gap-8">
              <div className="text-center">
                <CuteRobotHeadSimple size="small" mood={mood} />
                <span className="text-xs text-slate-500 mt-2 block">Small</span>
              </div>
              <div className="text-center">
                <CuteRobotHeadSimple size="medium" mood={mood} />
                <span className="text-xs text-slate-500 mt-2 block">Medium</span>
              </div>
              <div className="text-center">
                <CuteRobotHeadSimple size="large" mood={mood} />
                <span className="text-xs text-slate-500 mt-2 block">Large</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
          <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Real-time eye tracking (follows mouse)
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Natural blinking animation
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              5 expressive moods with unique colors
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Click to interact and change moods
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Floating hearts animation on happy
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Pulsing antenna and glowing effects
            </li>
          </ul>
        </div>

        {/* Integration Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            This component is now integrated into Nova OS as the "AI Companion" app!
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Find it in the sidebar under AI → Nova AI
          </p>
        </div>
      </div>
    </div>
  );
}
