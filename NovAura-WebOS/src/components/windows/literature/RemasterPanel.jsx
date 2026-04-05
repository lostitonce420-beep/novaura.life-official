import React, { useState } from 'react';
import { 
  Sparkles, RefreshCw, GitBranch, Palette, Eye, BookOpen,
  ChevronDown, ChevronRight, Play, Save, Trash2, Copy,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { RemasterEngine, REMASTER_TYPES } from './RemasterEngine';

export default function RemasterPanel({ 
  storyBible, 
  content, 
  fileName = 'Untitled',
  onSaveRemaster,
  onLoadRemaster
}) {
  const [engine, setEngine] = useState(() => new RemasterEngine(storyBible));
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [remasters, setRemasters] = useState([]);
  const [expandedRemaster, setExpandedRemaster] = useState(null);
  const [branchingPoint, setBranchingPoint] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newPerspective, setNewPerspective] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const runAnalysis = async () => {
    if (!content) return;
    setAnalyzing(true);
    try {
      const result = await engine.analyzeStory(content, storyBible);
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
    setAnalyzing(false);
  };

  const generateRemaster = async (type) => {
    if (!content) return;
    setGenerating(true);
    setSelectedType(type);
    
    try {
      const options = {
        type,
        title: fileName,
        branchingPoint: type === 'branching_point' ? branchingPoint : null,
        newGenre: type === 'genre_shift' ? newGenre : null,
        newPerspective: type === 'perspective_flip' ? newPerspective : null,
        customInstructions
      };

      const result = await engine.generateRemaster(content, storyBible, options);
      
      if (!result.error) {
        setRemasters(prev => [result, ...prev]);
      }
    } catch (err) {
      console.error('Remaster generation failed:', err);
    }
    
    setGenerating(false);
    setSelectedType(null);
  };

  const deleteRemaster = (id) => {
    if (confirm('Delete this remastered version?')) {
      engine.deleteRemaster(id);
      setRemasters(prev => prev.filter(r => r.id !== id));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getTypeIcon = (typeId) => {
    const type = Object.values(REMASTER_TYPES).find(t => t.id === typeId);
    return type?.icon || '✨';
  };

  const getTypeName = (typeId) => {
    const type = Object.values(REMASTER_TYPES).find(t => t.id === typeId);
    return type?.name || typeId;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Remaster</span>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing || !content}
            className="p-1 rounded hover:bg-white/10 text-gray-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        {analysis?.remaster_potential && (
          <div className="mt-2 p-2 bg-[#252540] rounded">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Remaster Potential</span>
              <span className="text-[10px] text-primary font-medium">
                {analysis.remaster_potential.score}/10
              </span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              {analysis.remaster_potential.rationale}
            </p>
          </div>
        )}
      </div>

      {/* Remaster Types */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <p className="text-[10px] text-gray-500 mb-2">Generate Alternative Version</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(REMASTER_TYPES).map(type => (
            <button
              key={type.id}
              onClick={() => generateRemaster(type.id)}
              disabled={generating || !content}
              className="p-2 rounded bg-[#252540] hover:bg-[#2a2a4a] text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{type.icon}</span>
                <span className="text-[10px] font-medium">{type.name}</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-1">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Options for specific types */}
        {selectedType === 'branching_point' && (
          <div className="mt-2 p-2 bg-[#252540] rounded">
            <p className="text-[10px] text-gray-500 mb-1">Branching Point</p>
            <input
              type="text"
              value={branchingPoint}
              onChange={(e) => setBranchingPoint(e.target.value)}
              placeholder="Describe the moment of divergence..."
              className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
            />
          </div>
        )}

        {selectedType === 'genre_shift' && (
          <div className="mt-2 p-2 bg-[#252540] rounded">
            <p className="text-[10px] text-gray-500 mb-1">New Genre</p>
            <select
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
            >
              <option value="">Select genre...</option>
              <option value="horror">Horror</option>
              <option value="comedy">Comedy</option>
              <option value="noir">Noir</option>
              <option value="romance">Romance</option>
              <option value="thriller">Thriller</option>
              <option value="scifi">Science Fiction</option>
              <option value="fantasy">Fantasy</option>
              <option value="mystery">Mystery</option>
            </select>
          </div>
        )}

        {selectedType === 'perspective_flip' && (
          <div className="mt-2 p-2 bg-[#252540] rounded">
            <p className="text-[10px] text-gray-500 mb-1">New Perspective</p>
            <input
              type="text"
              value={newPerspective}
              onChange={(e) => setNewPerspective(e.target.value)}
              placeholder="Character name..."
              className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
            />
          </div>
        )}

        {/* Custom Instructions */}
        <div className="mt-2">
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Additional instructions for the remaster (optional)..."
            className="w-full bg-[#252540] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none resize-none h-16"
          />
        </div>
      </div>

      {/* Generated Remasters */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {generating && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary animate-pulse" />
            <p className="text-[11px] text-primary">Generating remastered version...</p>
            <p className="text-[9px] text-gray-500 mt-1">This may take a moment</p>
          </div>
        )}

        {remasters.length === 0 && !generating && (
          <div className="text-center py-8 text-gray-600">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No remasters yet</p>
            <p className="text-[10px] text-gray-700 mt-1">
              Select a remaster type above to create an alternative version
            </p>
          </div>
        )}

        {remasters.map(remaster => (
          <div
            key={remaster.id}
            className="p-2 rounded bg-[#252540] border border-gray-700 hover:border-primary/50 transition-colors"
          >
            <div 
              className="flex items-start gap-2 cursor-pointer"
              onClick={() => setExpandedRemaster(
                expandedRemaster === remaster.id ? null : remaster.id
              )}
            >
              <span className="text-lg">{getTypeIcon(remaster.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">
                  {remaster.newTitle}
                </p>
                <p className="text-[9px] text-gray-500">
                  {getTypeName(remaster.type)} • {new Date(remaster.createdAt).toLocaleDateString()}
                </p>
              </div>
              {expandedRemaster === remaster.id ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>

            {expandedRemaster === remaster.id && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                {/* Summary */}
                {remaster.changelog?.summary && (
                  <p className="text-[10px] text-gray-400">
                    {remaster.changelog.summary}
                  </p>
                )}

                {/* Major Changes */}
                {remaster.changelog?.major_changes?.length > 0 && (
                  <div>
                    <p className="text-[9px] text-gray-500 mb-1">Major Changes:</p>
                    <ul className="text-[9px] text-gray-400 space-y-1">
                      {remaster.changelog.major_changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span>
                            <span className="capitalize">{change.type}:</span>{' '}
                            {change.description}
                            {change.rationale && (
                              <span className="text-gray-500 block ml-3">
                                Why: {change.rationale}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Content Preview */}
                <div>
                  <p className="text-[9px] text-gray-500 mb-1">Preview:</p>
                  <div className="p-2 bg-[#1e1e2e] rounded text-[9px] text-gray-400 max-h-24 overflow-y-auto">
                    {remaster.content.substring(0, 500)}...
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onLoadRemaster?.(remaster)}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-[9px] hover:bg-primary/30"
                  >
                    <BookOpen className="w-3 h-3" /> Load
                  </button>
                  <button
                    onClick={() => copyToClipboard(remaster.content)}
                    className="flex items-center gap-1 px-2 py-1 bg-white/10 text-gray-400 rounded text-[9px] hover:bg-white/15"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() => onSaveRemaster?.(remaster)}
                    className="flex items-center gap-1 px-2 py-1 bg-white/10 text-gray-400 rounded text-[9px] hover:bg-white/15"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => deleteRemaster(remaster.id)}
                    className="p-1 hover:bg-red-400/20 text-red-400 rounded ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
