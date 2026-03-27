import React, { useState } from 'react';
import CuteRobotHead from './CuteRobotHead';
import { Sparkles, MousePointer, MessageCircle } from 'lucide-react';

// Demo component showcasing CuteRobotHead features
export default function CuteRobotHeadDemo() {
  const [currentMood, setCurrentMood] = useState('happy');
  const [clickCount, setClickCount] = useState(0);

  const handleMoodChange = (mood) => {
    setCurrentMood(mood);
    setClickCount(prev => prev + 1);
  };

  const moods = [
    { id: 'happy', label: 'Happy', color: 'bg-pink-500', desc: 'Cheerful and friendly' },
    { id: 'curious', label: 'Curious', color: 'bg-violet-500', desc: 'Inquisitive eyes' },
    { id: 'excited', label: 'Excited', color: 'bg-amber-500', desc: 'Energetic bounce' },
    { id: 'calm', label: 'Calm', color: 'bg-blue-500', desc: 'Peaceful and serene' },
    { id: 'sleepy', label: 'Sleepy', color: 'bg-indigo-500', desc: 'Getting drowsy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Nova AI Companion
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-slate-400">Interactive animated robot avatar for Nova OS</p>
        </div>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Robot Display */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 
                         flex flex-col items-center justify-center
                         border border-slate-700/50">
            <CuteRobotHead 
              size="large" 
              mood={currentMood}
              onMoodChange={handleMoodChange}
            />
            <p className="mt-6 text-slate-400 text-sm">
              Click me to change my mood! 💕
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Interactions: {clickCount}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              Mood Selector
            </h2>
            
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setCurrentMood(mood.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl
                          transition-all duration-300 border
                          ${currentMood === mood.id 
                            ? 'bg-slate-700/50 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/30'
                          }`}
              >
                <div className={`w-4 h-4 rounded-full ${mood.color} shadow-lg`} />
                <div className="text-left">
                  <p className="text-white font-medium">{mood.label}</p>
                  <p className="text-slate-400 text-xs">{mood.desc}</p>
                </div>
                {currentMood === mood.id && (
                  <Sparkles className="w-4 h-4 text-yellow-400 ml-auto animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={MousePointer}
            title="Eye Tracking"
            description="Her eyes follow your mouse cursor smoothly for a lifelike feel"
            color="text-cyan-400"
          />
          <FeatureCard
            icon={Sparkles}
            title="Animated Expressions"
            description="Smooth transitions between moods with unique visual effects"
            color="text-pink-400"
          />
          <FeatureCard
            icon={MessageCircle}
            title="Interactive Speech"
            description="Click to interact and see her react with speech bubbles"
            color="text-purple-400"
          />
        </div>

        {/* Size Variants */}
        <div className="mt-12 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Size Variants
          </h2>
          <div className="flex items-end justify-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <CuteRobotHead size="small" mood="happy" />
              <span className="text-xs text-slate-400">Small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CuteRobotHead size="medium" mood="curious" />
              <span className="text-xs text-slate-400">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CuteRobotHead size="large" mood="excited" />
              <span className="text-xs text-slate-400">Large</span>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-slate-900 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Usage Example:</h3>
          <pre className="text-xs text-slate-400 overflow-x-auto">
{`import CuteRobotHead from './components/CuteRobotHead';

// Basic usage
<CuteRobotHead size="medium" mood="happy" />

// With interactions
<CuteRobotHead 
  size="large"
  mood={currentMood}
  onMoodChange={(mood) => console.log('Mood changed to:', mood)}
  onClick={(mood) => console.log('Clicked! Current mood:', mood)}
/>

// Available sizes: 'small' | 'medium' | 'large'
// Available moods: 'happy' | 'curious' | 'excited' | 'calm' | 'sleepy'`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 
                   border border-slate-700/30 hover:border-slate-600/50
                   transition-all duration-300">
      <Icon className={`w-8 h-8 ${color} mb-3`} />
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
