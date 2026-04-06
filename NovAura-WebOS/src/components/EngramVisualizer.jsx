/**
 * Engram Visualizer Component
 * Displays engrams as colored nodes with their emotion colors
 * Supports 9 markers and 9 emotion colors
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 9 Emotion Colors from engram-rag.ts
const EMOTION_COLORS = {
  ecstasy: { color: '#FF006E', label: 'Ecstasy', valence: 1.0, arousal: 1.0 },
  joy: { color: '#FB5607', label: 'Joy', valence: 0.8, arousal: 0.9 },
  serenity: { color: '#00D9FF', label: 'Serenity', valence: 0.7, arousal: 0.2 },
  contentment: { color: '#A855F7', label: 'Contentment', valence: 0.6, arousal: 0.3 },
  neutral: { color: '#94A3B8', label: 'Neutral', valence: 0.0, arousal: 0.0 },
  rage: { color: '#DC2626', label: 'Rage', valence: -0.9, arousal: 1.0 },
  anxiety: { color: '#EA580C', label: 'Anxiety', valence: -0.7, arousal: 0.8 },
  grief: { color: '#1E3A5F', label: 'Grief', valence: -0.8, arousal: 0.2 },
  melancholy: { color: '#475569', label: 'Melancholy', valence: -0.5, arousal: 0.1 },
};

// 9 Markers
const MARKERS = {
  preference: { icon: '💜', label: 'Preference', description: 'Likes & dislikes' },
  fact: { icon: '🔵', label: 'Fact', description: 'Verified knowledge' },
  skill: { icon: '🟢', label: 'Skill', description: 'Abilities' },
  relationship: { icon: '🟠', label: 'Relationship', description: 'People' },
  event: { icon: '🟡', label: 'Event', description: 'Occurrences' },
  concept: { icon: '🟣', label: 'Concept', description: 'Abstract ideas' },
  goal: { icon: '🔷', label: 'Goal', description: 'Objectives' },
  emotion: { icon: '💗', label: 'Emotion', description: 'Feelings' },
  reference: { icon: '⚪', label: 'Reference', description: 'Sources' },
};

// Engrams are loaded from Firestore or kernel storage
// No mock data - only real user memories

export default function EngramVisualizer() {
  const [engrams, setEngrams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [emotionFilter, setEmotionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | emotion-wheel | timeline
  const [selectedEngram, setSelectedEngram] = useState(null);

  // Filter engrams
  const filteredEngrams = useMemo(() => {
    return engrams.filter(e => {
      if (filter !== 'all' && e.marker !== filter) return false;
      if (emotionFilter !== 'all' && e.emotion !== emotionFilter) return false;
      return true;
    });
  }, [engrams, filter, emotionFilter]);

  // Statistics
  const stats = useMemo(() => {
    const byEmotion = {};
    const byMarker = {};
    
    engrams.forEach(e => {
      byEmotion[e.emotion] = (byEmotion[e.emotion] || 0) + 1;
      byMarker[e.marker] = (byMarker[e.marker] || 0) + 1;
    });
    
    return { byEmotion, byMarker, total: engrams.length };
  }, [engrams]);

  // Format timestamp
  const formatDate = (ts) => {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get size based on intensity
  const getSize = (intensity) => {
    const base = 80;
    return base + intensity * 60;
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-white overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-light tracking-wide">Engram Memory</h1>
            <p className="text-white/50 text-sm mt-1">
              {stats.total} memories • {Object.keys(stats.byEmotion).length} emotions • {Object.keys(stats.byMarker).length} categories
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-white/5 rounded-lg p-1">
            {['grid', 'emotion-wheel', 'timeline'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                  viewMode === mode ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                {mode.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Marker Filter */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">Marker</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Markers</option>
              {Object.entries(MARKERS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Emotion Filter */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">Emotion</span>
            <select
              value={emotionFilter}
              onChange={(e) => setEmotionFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Emotions</option>
              {Object.entries(EMOTION_COLORS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-white/10 flex flex-wrap gap-4 text-xs">
        {Object.entries(EMOTION_COLORS).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-white/60">{label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">Loading memories...</div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredEngrams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <div className="text-4xl mb-4">🧠</div>
            <div className="text-lg mb-2">No memories yet</div>
            <div className="text-sm">Interact with AI to build your memory map</div>
          </div>
        )}

        {viewMode === 'grid' && !isLoading && !error && filteredEngrams.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredEngrams.map((engram) => {
                const emotionColor = EMOTION_COLORS[engram.emotion]?.color || '#94A3B8';
                const marker = MARKERS[engram.marker];
                
                return (
                  <motion.div
                    key={engram.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedEngram(engram)}
                    className="group relative cursor-pointer"
                    style={{ height: getSize(engram.intensity) }}
                  >
                    {/* Card */}
                    <div
                      className="w-full h-full rounded-xl p-4 flex flex-col justify-between transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${emotionColor}20 0%, ${emotionColor}05 100%)`,
                        border: `2px solid ${emotionColor}40`,
                      }}
                    >
                      {/* Top: Marker & Intensity */}
                      <div className="flex items-start justify-between">
                        <span className="text-lg" title={marker?.label}>{marker?.icon}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-3 rounded-full"
                              style={{
                                backgroundColor: i < Math.ceil(engram.intensity * 5) ? emotionColor : 'rgba(255,255,255,0.1)',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <p className="text-sm font-medium line-clamp-3 leading-relaxed">
                          {engram.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                          <span>{formatDate(engram.timestamp)}</span>
                          <span>•</span>
                          <span>{engram.accessCount}× accessed</span>
                        </div>
                      </div>

                      {/* Glow Effect */}
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl"
                        style={{ backgroundColor: emotionColor }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {viewMode === 'emotion-wheel' && (
          <EmotionWheel engrams={filteredEngrams} />
        )}

        {viewMode === 'timeline' && (
          <TimelineView engrams={filteredEngrams} />
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEngram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedEngram(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const emotionColor = EMOTION_COLORS[selectedEngram.emotion];
                const marker = MARKERS[selectedEngram.marker];
                
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${emotionColor.color}30` }}
                      >
                        {marker?.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{marker?.label}</h3>
                        <p className="text-sm text-white/50">{marker?.description}</p>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-xl mb-4"
                      style={{ backgroundColor: `${emotionColor.color}15`, border: `1px solid ${emotionColor.color}30` }}
                    >
                      <p className="text-lg">{selectedEngram.content}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/40 block text-xs mb-1">Emotion</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotionColor.color }} />
                          <span>{emotionColor.label}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs mb-1">Intensity</span>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${selectedEngram.intensity * 100}%`, backgroundColor: emotionColor.color }}
                            />
                          </div>
                          <span>{Math.round(selectedEngram.intensity * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs mb-1">Created</span>
                        <span>{new Date(selectedEngram.timestamp).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs mb-1">Accessed</span>
                        <span>{selectedEngram.accessCount} times</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Emotion Wheel View
function EmotionWheel({ engrams }) {
  const emotions = Object.keys(EMOTION_COLORS);
  const angleStep = (2 * Math.PI) / emotions.length;
  const radius = 150;

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="relative w-[400px] h-[400px]">
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <span className="text-2xl">🧠</span>
        </div>

        {/* Emotion positions */}
        {emotions.map((emotion, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const color = EMOTION_COLORS[emotion].color;
          const count = engrams.filter(e => e.emotion === emotion).length;
          
          return (
            <motion.div
              key={emotion}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ x, y }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: `${color}30`, border: `2px solid ${color}` }}
              >
                <span className="text-xs font-medium">{EMOTION_COLORS[emotion].label}</span>
                <span className="text-lg">{count}</span>
              </div>
            </motion.div>
          );
        })}

        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {emotions.map((emotion, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = 200 + Math.cos(angle) * radius;
            const y = 200 + Math.sin(angle) * radius;
            return (
              <line
                key={emotion}
                x1="200"
                y1="200"
                x2={x}
                y2={y}
                stroke={EMOTION_COLORS[emotion].color}
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Timeline View
function TimelineView({ engrams }) {
  const sorted = [...engrams].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
        
        {sorted.map((engram, i) => {
          const emotionColor = EMOTION_COLORS[engram.emotion]?.color || '#94A3B8';
          const marker = MARKERS[engram.marker];
          
          return (
            <motion.div
              key={engram.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-start gap-4 mb-4 pl-12"
            >
              {/* Dot */}
              <div
                className="absolute left-2 top-2 w-4 h-4 rounded-full border-2 border-[#0a0a0a]"
                style={{ backgroundColor: emotionColor }}
              />
              
              {/* Card */}
              <div
                className="flex-1 p-4 rounded-lg border"
                style={{ borderColor: `${emotionColor}30`, backgroundColor: `${emotionColor}05` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{marker?.icon}</span>
                  <span className="text-sm text-white/60">{marker?.label}</span>
                  <span className="text-xs text-white/40 ml-auto">
                    {new Date(engram.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{engram.content}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
