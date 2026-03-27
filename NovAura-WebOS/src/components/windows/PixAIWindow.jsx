/**
 * PixAI Mio Art Studio
 * 
 * WARNING: PixAI models can generate adult content.
 * This UI includes safety controls and content filtering.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Download, RefreshCw, AlertTriangle, 
  Settings, Image as ImageIcon, Wand2, Shield 
} from 'lucide-react';
import { generateWithMio, checkStatus, applyPreset, MIO_PRESETS } from '../../services/pixaiBackendService';

export default function PixAIWindow() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [preset, setPreset] = useState('character');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [safetyMode, setSafetyMode] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [steps, setSteps] = useState(28);

  const aspectRatios = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:2': { width: 1024, height: 683 }
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Apply preset
      const { prompt: finalPrompt, negativePrompt: finalNegative } = 
        applyPreset(preset, prompt);

      // Generate using YOUR backend (your API key)
      const result = await generateWithMio({
        prompt: finalPrompt,
        negativePrompt: finalNegative || negativePrompt,
        aspectRatio
      });

      // Poll for completion
      pollGenerationStatus(result.taskId);

    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (taskId) => {
    const poll = async () => {
      try {
        const status = await checkStatus(taskId);
        
        if (status.status === 'completed') {
          setGeneratedImage(status.imageUrl);
          setIsGenerating(false);
        } else if (status.status === 'failed') {
          setError('Generation failed');
          setIsGenerating(false);
        } else {
          // Still processing, poll again
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError(err.message);
        setIsGenerating(false);
      }
    };

    poll();
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    const response = await fetch(generatedImage);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mio-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium">PixAI Studio</h1>
            <p className="text-xs text-white/50">Powered by Mio Model</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {safetyMode && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
              <Shield className="w-3 h-3" />
              Safety On
            </div>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        <span>PixAI models can generate adult content. Application-level filters are active.</span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-white/5 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Content Safety Filter</span>
            <button
              onClick={() => setSafetyMode(!safetyMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                safetyMode ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                safetyMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div>
            <span className="text-sm block mb-2">Aspect Ratio</span>
            <div className="flex gap-2">
              {Object.keys(aspectRatios).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1 rounded text-sm ${
                    aspectRatio === ratio 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-sm block mb-2">Steps: {steps}</span>
            <input
              type="range"
              min="20"
              max="50"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Controls Panel */}
        <div className="w-80 border-r border-white/10 p-4 space-y-4 overflow-y-auto">
          {/* Preset Selector */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(MIO_PRESETS).map(p => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    preset === p 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Negative Prompt (Optional)
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to avoid..."
              className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="flex-1 p-4 flex items-center justify-center bg-white/5">
          {generatedImage ? (
            <div className="relative group">
              <img
                src={generatedImage}
                alt="Generated"
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
              <button
                onClick={handleDownload}
                className="absolute bottom-4 right-4 p-3 bg-white/90 text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          ) : isGenerating ? (
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-pink-500" />
              <p className="text-white/50">Creating your masterpiece...</p>
            </div>
          ) : (
            <div className="text-center text-white/30">
              <ImageIcon className="w-16 h-16 mx-auto mb-4" />
              <p>Enter a prompt to generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
