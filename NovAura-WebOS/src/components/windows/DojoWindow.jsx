import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Swords, Copy, Download, Play, Code2, Sparkles, Wand2,
  Save, FolderOpen, FileArchive, Cloud, GitBranch,
  CheckSquare, Lightbulb, Zap, RefreshCw, Search, Globe,
  Database, Upload, Folder, FileText, Image, Box, Layers,
  BookOpen, Cpu, Code, Settings, ChevronRight, ChevronDown,
  Plus, Trash2, ExternalLink, Loader2, AlertCircle,
  Grid3X3, Mountain, TreePine, Waves, Wind
} from 'lucide-react';
import { exportProjectAsZip, downloadFile } from '../../utils/exportUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED DOJO - Game Development Powerhouse
// Knowledge base, web research, asset management, 3D world generation
// ═══════════════════════════════════════════════════════════════════════════════

const ENGINES = [
  { id: 'unreal', label: 'Unreal Engine 5', lang: 'C++', ext: '.cpp', icon: '🎮', color: 'text-blue-400', supports: ['3d', 'blueprint', 'nanite', 'lumen'] },
  { id: 'unity', label: 'Unity 6', lang: 'C#', ext: '.cs', icon: '🔷', color: 'text-cyan-400', supports: ['3d', 'urp', 'hdrp', 'dots'] },
  { id: 'godot', label: 'Godot 4', lang: 'GDScript', ext: '.gd', icon: '🤖', color: 'text-green-400', supports: ['3d', 'gdextension', 'visual'] },
];

const ASSET_TYPES = [
  { id: 'world-3d', label: '3D World/Level', desc: 'Complete 3D environment with terrain, props, lighting', complexity: 'very-high', category: 'world' },
  { id: 'character-controller', label: 'Character Controller', desc: 'Player movement, jumping, camera', complexity: 'medium', category: 'gameplay' },
  { id: 'enemy-ai', label: 'Enemy AI', desc: 'Patrol, chase, attack behaviors', complexity: 'high', category: 'ai' },
  { id: 'inventory', label: 'Inventory System', desc: 'Item slots, stacking, equipping', complexity: 'medium', category: 'systems' },
  { id: 'ui-hud', label: 'UI / HUD', desc: 'Health bar, minimap, score display', complexity: 'low', category: 'ui' },
  { id: 'dialogue', label: 'Dialogue System', desc: 'NPC conversations, branching choices', complexity: 'medium', category: 'systems' },
  { id: 'combat', label: 'Combat System', desc: 'Melee/ranged attacks, damage, abilities', complexity: 'high', category: 'gameplay' },
  { id: 'save-load', label: 'Save / Load', desc: 'Game state persistence and recovery', complexity: 'medium', category: 'systems' },
  { id: 'particles', label: 'Particle Effects', desc: 'Fire, smoke, magic, explosions', complexity: 'low', category: 'fx' },
  { id: 'procedural', label: 'Procedural Generation', desc: 'Random levels, items, terrain', complexity: 'high', category: 'world' },
  { id: 'multiplayer', label: 'Multiplayer Networking', desc: 'Sync, lobby, matchmaking', complexity: 'very-high', category: 'networking' },
  { id: 'shader', label: 'Custom Shaders', desc: 'HLSL/GLSL/Shader Graph materials', complexity: 'high', category: 'fx' },
  { id: 'animation', label: 'Animation System', desc: 'State machines, blending, IK', complexity: 'high', category: 'gameplay' },
  { id: 'physics', label: 'Physics Interactions', desc: 'Ragdolls, joints, vehicles', complexity: 'high', category: 'gameplay' },
];

const WORLD_GENERATORS = [
  { id: 'forest', name: 'Enchanted Forest', icon: TreePine, biomes: ['dense woods', 'clearings', 'ancient ruins'], features: ['procedural trees', 'fog volumes', 'particle wildlife'] },
  { id: 'desert', name: 'Cyber Desert', icon: Waves, biomes: ['dunes', 'oasis', 'abandoned structures'], features: ['sand shaders', 'heat haze', 'dynamic shadows'] },
  { id: 'mountain', name: 'Snowy Peaks', icon: Mountain, biomes: ['peaks', 'valleys', 'frozen lakes'], features: ['snow deformation', 'avalanche fx', 'icicle systems'] },
  { id: 'ocean', name: 'Underwater Realm', icon: Waves, biomes: ['coral reefs', 'deep trenches', 'sunken cities'], features: ['caustics', 'bubble particles', 'kelp forests'] },
  { id: 'city', name: 'Neo Tokyo', icon: Grid3X3, biomes: ['streets', 'rooftops', 'underground'], features: ['neon signs', 'rain fx', 'crowd systems'] },
  { id: 'space', name: 'Space Station', icon: Box, biomes: ['hangars', 'labs', 'docking bays'], features: ['zero-g physics', 'holograms', 'airlock systems'] },
];

const RESEARCH_SOURCES = [
  { id: 'docs', name: 'Engine Documentation', icon: BookOpen },
  { id: 'github', name: 'GitHub Repositories', icon: Code },
  { id: 'tutorials', name: 'Video Tutorials', icon: Play },
  { id: 'forums', name: 'Community Forums', icon: Globe },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DOJO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DojoWindow({ onAIChat }) {
  // ── Core State ───────────────────────────────────────────────────────────────
  const [engine, setEngine] = useState('godot');
  const [assetType, setAssetType] = useState('world-3d');
  const [code, setCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generate'); // generate | knowledge | research | assets
  
  // World generation state
  const [selectedWorldType, setSelectedWorldType] = useState('forest');
  const [worldSize, setWorldSize] = useState('medium'); // small | medium | large
  const [worldComplexity, setWorldComplexity] = useState('balanced'); // simple | balanced | complex
  const [worldFeatures, setWorldFeatures] = useState([]);
  
  // Knowledge base state
  const [knowledgeBase, setKnowledgeBase] = useState({
    codeSnippets: [],
    uploadedAssets: [],
    documentation: [],
    projectReferences: []
  });
  const [selectedKnowledge, setSelectedKnowledge] = useState([]);
  
  // Research state
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState([]);
  const [researching, setResearching] = useState(false);
  
  // Asset upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Generation config
  const [customPrompt, setCustomPrompt] = useState('');
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [useWebResearch, setUseWebResearch] = useState(false);
  const [generationMode, setGenerationMode] = useState('asset'); // asset | world | research

  const currentEngine = ENGINES.find(e => e.id === engine);
  const currentAsset = ASSET_TYPES.find(a => a.id === assetType);
  const currentWorld = WORLD_GENERATORS.find(w => w.id === selectedWorldType);

  // ═══════════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleFileUpload = useCallback(async (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      category: categorizeFile(file.name),
      uploadDate: new Date().toISOString(),
      // In real implementation, upload to Firebase Storage
      status: 'uploaded'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload progress
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 100));
      setUploadProgress(i);
    }
    setUploadProgress(0);
  }, []);

  const categorizeFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['fbx', 'obj', 'gltf', 'glb', 'blend', 'ma', 'mb'].includes(ext)) return '3d-model';
    if (['png', 'jpg', 'jpeg', 'tga', 'psd', 'exr'].includes(ext)) return 'texture';
    if (['cs', 'cpp', 'h', 'hpp', 'gd', 'py', 'js', 'ts'].includes(ext)) return 'code';
    if (['wav', 'mp3', 'ogg', 'flac'].includes(ext)) return 'audio';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
    if (['prefab', 'unitypackage', 'uasset', 'umap'].includes(ext)) return 'engine-asset';
    return 'other';
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEB RESEARCH
  // ═══════════════════════════════════════════════════════════════════════════════

  const performResearch = useCallback(async () => {
    if (!researchQuery.trim() || !onAIChat) return;
    
    setResearching(true);
    try {
      const prompt = `Search and summarize information about: "${researchQuery}"
      
Context: Game development for ${currentEngine.label}
Focus on: Implementation details, best practices, code examples, and common pitfalls.

Provide:
1. Quick summary (2-3 sentences)
2. Key implementation points
3. Code snippet example (if applicable)
4. Relevant documentation links
5. Community forum discussions summary`;

      const result = await onAIChat(prompt, 'research');
      
      const newResult = {
        id: Date.now(),
        query: researchQuery,
        response: result?.response || 'Research completed',
        timestamp: new Date().toISOString(),
        engine: engine
      };
      
      setResearchResults(prev => [newResult, ...prev]);
    } catch (err) {
      console.error('Research failed:', err);
    } finally {
      setResearching(false);
      setResearchQuery('');
    }
  }, [researchQuery, onAIChat, engine, currentEngine]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI GENERATION
  // ═══════════════════════════════════════════════════════════════════════════════

  const generateWorld = useCallback(async () => {
    if (!onAIChat) {
      setCode(generateWorldTemplate(engine, selectedWorldType, worldSize, worldComplexity));
      return;
    }

    setGenerating(true);
    try {
      const worldConfig = WORLD_GENERATORS.find(w => w.id === selectedWorldType);
      
      const knowledgeContext = useKnowledgeBase && uploadedFiles.length > 0
        ? `\n\nReference Assets Available:\n${uploadedFiles.map(f => `- ${f.name} (${f.category})`).join('\n')}`
        : '';

      const prompt = `Generate a complete ${worldSize} ${worldConfig.name} for ${currentEngine.label}.

Configuration:
- Engine: ${currentEngine.label} (${currentEngine.lang})
- Complexity: ${worldComplexity}
- Size: ${worldSize}
- Biomes: ${worldConfig.biomes.join(', ')}
- Features: ${worldConfig.features.join(', ')}
${worldFeatures.length > 0 ? `- Custom Features: ${worldFeatures.join(', ')}` : ''}
${knowledgeContext}

Generate:
1. Scene setup code with proper node hierarchy
2. Procedural generation scripts
3. Lighting and environment setup
4. Player spawn and basic navigation
5. Optimization settings
6. Comments explaining each section

This should be a complete, runnable world that can be dropped into a project.`;

      const result = await onAIChat(prompt, 'coding');
      setCode(result?.code || result?.response || generateWorldTemplate(engine, selectedWorldType, worldSize, worldComplexity));
    } catch (err) {
      console.error('World generation failed:', err);
      setCode(generateWorldTemplate(engine, selectedWorldType, worldSize, worldComplexity));
    } finally {
      setGenerating(false);
    }
  }, [engine, selectedWorldType, worldSize, worldComplexity, worldFeatures, onAIChat, currentEngine, uploadedFiles, useKnowledgeBase]);

  const generateAsset = useCallback(async () => {
    if (assetType === 'world-3d') {
      generateWorld();
      return;
    }

    if (!onAIChat) {
      setCode(generatePlaceholder(engine, assetType));
      return;
    }

    setGenerating(true);
    try {
      const knowledgeContext = useKnowledgeBase && uploadedFiles.length > 0
        ? `\n\nReference Code Snippets:\n${uploadedFiles.filter(f => f.category === 'code').map(f => `- ${f.name}`).join('\n')}`
        : '';

      const prompt = `Generate production-ready ${currentAsset.label} for ${currentEngine.label} in ${currentEngine.lang}.

Requirements:
${currentAsset.desc}
Complexity: ${currentAsset.complexity}
${knowledgeContext}

Include:
- Complete implementation with error handling
- Performance optimizations
- Integration examples
- Comments explaining architecture
- Best practices for ${currentEngine.label}

The code should be production-ready and follow engine conventions.`;

      const result = await onAIChat(prompt, 'coding');
      setCode(result?.code || result?.response || generatePlaceholder(engine, assetType));
    } catch (err) {
      console.error('Asset generation failed:', err);
      setCode(generatePlaceholder(engine, assetType));
    } finally {
      setGenerating(false);
    }
  }, [assetType, engine, onAIChat, currentAsset, currentEngine, uploadedFiles, useKnowledgeBase, generateWorld]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPORT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const exportAsset = async () => {
    const files = [
      { name: `${assetType}${currentEngine.ext}`, content: code },
      { name: 'README.md', content: generateReadme() },
      { name: '.novaura/dojo-config.json', content: JSON.stringify({
        engine, assetType, selectedWorldType, worldSize, worldComplexity,
        generatedAt: new Date().toISOString()
      }, null, 2)}
    ];

    await exportProjectAsZip({
      files,
      projectName: `dojo-${currentAsset?.label || 'asset'}-${currentEngine.label}`,
      metadata: { engine, assetType, type: 'dojo-asset' }
    });
  };

  const generateReadme = () => `# ${currentAsset?.label || 'Game Asset'}

**Engine:** ${currentEngine.label}  
**Type:** ${currentAsset?.label || 'Custom'}  
**Generated:** ${new Date().toLocaleString()}

## Overview
${currentAsset?.desc || 'Custom generated game asset'}

## Files
- Main implementation: \`${assetType}${currentEngine.ext}\`
- Configuration: \`.novaura/dojo-config.json\`

## Installation
1. Import/copy the code into your ${currentEngine.label} project
2. Follow setup instructions in code comments
3. Configure any exposed parameters

## Dependencies
- ${currentEngine.label} (latest stable)
- See code comments for specific dependencies

---
Generated with NovAura Dojo 🎮
`;

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Dojo</h1>
            <p className="text-xs text-slate-500">AI Game Development Studio</p>
          </div>
        </div>
        
        {/* Main Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
          {[
            { id: 'generate', icon: Sparkles, label: 'Generate' },
            { id: 'knowledge', icon: Database, label: 'Knowledge' },
            { id: 'research', icon: Search, label: 'Research' },
            { id: 'assets', icon: Folder, label: 'Assets' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id ? 'bg-orange-600/30 text-orange-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 space-y-4 shrink-0">
          
          {/* Engine Selection */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Game Engine
            </label>
            <div className="space-y-2">
              {ENGINES.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEngine(e.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    engine === e.id
                      ? 'bg-orange-600/20 border-orange-600/50 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{e.icon}</span>
                  <div>
                    <div className={`font-medium ${engine === e.id ? 'text-orange-300' : 'text-slate-300'}`}>
                      {e.label}
                    </div>
                    <div className="text-xs text-slate-500">{e.lang}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Mode */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Generation Mode
            </label>
            <div className="space-y-1">
              {[
                { id: 'asset', label: 'Game Asset', desc: 'Scripts, systems, components' },
                { id: 'world', label: '3D World', desc: 'Complete environments' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setGenerationMode(mode.id);
                    if (mode.id === 'world') setAssetType('world-3d');
                  }}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                    generationMode === mode.id
                      ? 'bg-blue-600/20 border-blue-600/50 text-blue-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-slate-500">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Context Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useKnowledgeBase}
                onChange={e => setUseKnowledgeBase(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-600"
              />
              Use Knowledge Base
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useWebResearch}
                onChange={e => setUseWebResearch(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-600"
              />
              Enable Web Research
            </label>
          </div>

          {/* Stats */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-500 mb-2">Knowledge Base</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Assets</span>
                <span className="text-orange-400">{uploadedFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Research</span>
                <span className="text-blue-400">{researchResults.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'generate' && generationMode === 'world' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">3D World Generator</h2>
                <p className="text-slate-400">Generate complete game environments with AI</p>
              </div>

              {/* World Type Selection */}
              <div className="grid grid-cols-3 gap-4">
                {WORLD_GENERATORS.map(world => (
                  <button
                    key={world.id}
                    onClick={() => setSelectedWorldType(world.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedWorldType === world.id
                        ? 'bg-blue-600/20 border-blue-600/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <world.icon className={`w-8 h-8 mb-3 ${selectedWorldType === world.id ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div className={`font-medium ${selectedWorldType === world.id ? 'text-blue-300' : 'text-slate-300'}`}>
                      {world.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{world.biomes.length} biomes</div>
                  </button>
                ))}
              </div>

              {/* World Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">World Size</label>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        onClick={() => setWorldSize(size)}
                        className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                          worldSize === size
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Complexity</label>
                  <div className="flex gap-2">
                    {['simple', 'balanced', 'complex'].map(comp => (
                      <button
                        key={comp}
                        onClick={() => setWorldComplexity(comp)}
                        className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                          worldComplexity === comp
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Features */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <label className="text-sm font-medium text-slate-300 mb-3 block">Custom Features</label>
                <textarea
                  value={worldFeatures.join('\n')}
                  onChange={e => setWorldFeatures(e.target.value.split('\n').filter(f => f.trim()))}
                  placeholder="Add specific features (one per line)...&#10;e.g.,&#10;underwater cave system&#10;ancient temple ruins&#10;dynamic weather system"
                  className="w-full h-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateWorld}
                disabled={generating}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-xl text-lg font-semibold text-white transition-all flex items-center justify-center gap-3"
              >
                {generating ? (
                  <><RefreshCw className="w-6 h-6 animate-spin" /> Generating World...</>
                ) : (
                  <><Wand2 className="w-6 h-6" /> Generate 3D World</>
                )}
              </button>
            </div>
          )}

          {activeTab === 'generate' && generationMode === 'asset' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Game Asset Generator</h2>
                <p className="text-slate-400">Generate scripts, systems, and components</p>
              </div>

              {/* Asset Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                {ASSET_TYPES.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setAssetType(asset.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      assetType === asset.id
                        ? 'bg-orange-600/20 border-orange-600/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${assetType === asset.id ? 'text-orange-300' : 'text-slate-300'}`}>
                        {asset.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        asset.complexity === 'low' ? 'bg-green-900/50 text-green-400' :
                        asset.complexity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                        asset.complexity === 'high' ? 'bg-orange-900/50 text-orange-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {asset.complexity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{asset.desc}</div>
                  </button>
                ))}
              </div>

              {/* Custom Prompt */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Custom Requirements</label>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Add specific requirements...&#10;e.g., 'Include double jump mechanic' or 'Use state machine pattern'"
                  className="w-full h-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-orange-500/50"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAsset}
                disabled={generating}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 rounded-xl text-lg font-semibold text-white transition-all flex items-center justify-center gap-3"
              >
                {generating ? (
                  <><RefreshCw className="w-6 h-6 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-6 h-6" /> Generate {currentAsset?.label}</>
                )}
              </button>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Knowledge Base</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Code className="w-5 h-5 text-blue-400" />
                    <h3 className="font-medium text-white">Code Snippets</h3>
                  </div>
                  <p className="text-sm text-slate-500">Saved code examples and patterns</p>
                  <div className="mt-3 text-2xl font-bold text-blue-400">
                    {uploadedFiles.filter(f => f.category === 'code').length}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Box className="w-5 h-5 text-green-400" />
                    <h3 className="font-medium text-white">3D Models</h3>
                  </div>
                  <p className="text-sm text-slate-500">Reference models and assets</p>
                  <div className="mt-3 text-2xl font-bold text-green-400">
                    {uploadedFiles.filter(f => f.category === '3d-model').length}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Image className="w-5 h-5 text-purple-400" />
                    <h3 className="font-medium text-white">Textures & Materials</h3>
                  </div>
                  <p className="text-sm text-slate-500">Reference textures and shaders</p>
                  <div className="mt-3 text-2xl font-bold text-purple-400">
                    {uploadedFiles.filter(f => f.category === 'texture').length}
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-medium text-white">Documentation</h3>
                  </div>
                  <p className="text-sm text-slate-500">Saved research and docs</p>
                  <div className="mt-3 text-2xl font-bold text-yellow-400">
                    {researchResults.length}
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-medium text-white">Uploaded Assets</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={e => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                {uploadProgress > 0 && (
                  <div className="px-4 py-2 bg-slate-800/30">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-800">
                  {uploadedFiles.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No assets uploaded yet</p>
                      <p className="text-sm mt-1">Upload code, models, or textures to use as reference</p>
                    </div>
                  ) : (
                    uploadedFiles.map(file => (
                      <div key={file.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/30">
                        <div className="flex items-center gap-3">
                          {file.category === 'code' && <Code className="w-4 h-4 text-blue-400" />}
                          {file.category === '3d-model' && <Box className="w-4 h-4 text-green-400" />}
                          {file.category === 'texture' && <Image className="w-4 h-4 text-purple-400" />}
                          {file.category === 'audio' && <span className="text-pink-400">♪</span>}
                          {!['code', '3d-model', 'texture', 'audio'].includes(file.category) && <FileText className="w-4 h-4 text-slate-400" />}
                          <div>
                            <div className="text-sm text-slate-300">{file.name}</div>
                            <div className="text-xs text-slate-500">{file.category} • {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1.5 hover:bg-red-600/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'research' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Web Research</h2>
              
              {/* Search Box */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={researchQuery}
                  onChange={e => setResearchQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && performResearch()}
                  placeholder="Search for solutions, patterns, best practices..."
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={performResearch}
                  disabled={researching || !researchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white font-medium flex items-center gap-2"
                >
                  {researching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Research
                </button>
              </div>

              {/* Sources */}
              <div className="flex gap-2 mb-6">
                {RESEARCH_SOURCES.map(source => (
                  <div
                    key={source.id}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 flex items-center gap-2"
                  >
                    <source.icon className="w-4 h-4" />
                    {source.name}
                  </div>
                ))}
              </div>

              {/* Results */}
              <div className="space-y-4">
                {researchResults.map(result => (
                  <div key={result.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{result.query}</h3>
                      <span className="text-xs text-slate-500">
                        {new Date(result.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-slate-300 text-sm">
                        {result.response}
                      </pre>
                    </div>
                  </div>
                ))}
                
                {researchResults.length === 0 && !researching && (
                  <div className="text-center py-12 text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Search the web for game dev solutions</p>
                    <p className="text-sm mt-1">Try "inventory system pattern" or "Unity movement physics"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Asset Library</h2>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Characters', count: 0, icon: '👤' },
                  { name: 'Environments', count: 0, icon: '🌍' },
                  { name: 'Props', count: 0, icon: '📦' },
                  { name: 'Vehicles', count: 0, icon: '🚗' },
                  { name: 'Weapons', count: 0, icon: '⚔️' },
                  { name: 'Effects', count: 0, icon: '✨' },
                ].map(category => (
                  <div key={category.name} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-medium text-white">{category.name}</div>
                    <div className="text-sm text-slate-500">{category.count} assets</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 text-center">
                <Database className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">Connect asset store integrations</p>
                <p className="text-sm text-slate-600 mt-1">Unity Asset Store, Unreal Marketplace, Sketchfab</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Output */}
        {code && (
          <div className="w-96 border-l border-slate-800 bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">
                  {generationMode === 'world' ? 'Generated World' : currentAsset?.label}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigator.clipboard.writeText(code)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={exportAsset} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                  <FileArchive className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

function generateWorldTemplate(engine, worldType, size, complexity) {
  const world = WORLD_GENERATORS.find(w => w.id === worldType);
  
  if (engine === 'godot') {
    return `# ${world.name} - Godot 4
# Size: ${size} | Complexity: ${complexity}

extends Node3D

@export var world_size: int = ${size === 'small' ? 256 : size === 'medium' ? 512 : 1024}
@export var chunk_size: int = 64

var noise = FastNoiseLite.new()
var chunks = {}

func _ready():
    setup_noise()
    generate_world()
    setup_lighting()
    
func setup_noise():
    noise.seed = randi()
    noise.frequency = ${complexity === 'simple' ? '0.01' : complexity === 'balanced' ? '0.02' : '0.04'}
    noise.fractal_octaves = ${complexity === 'simple' ? '3' : complexity === 'balanced' ? '5' : '8'}

func generate_world():
    print("Generating ${world.name}...")
    # Procedural generation logic here
    # Biomes: ${world.biomes.join(', ')}
    
func setup_lighting():
    # ${world.features.join(', ')}
    var light = DirectionalLight3D.new()
    light.shadow_enabled = true
    add_child(light)

# Features to implement:
# - ${world.features.join('\n# - ')}
`;
  }
  
  if (engine === 'unity') {
    return `using UnityEngine;

// ${world.name} Generator
// Size: ${size} | Complexity: ${complexity}

public class WorldGenerator : MonoBehaviour
{
    [Header("World Settings")]
    public int worldSize = ${size === 'small' ? '256' : size === 'medium' ? '512' : '1024'};
    public int chunkSize = 64;
    
    [Header("Noise Settings")]
    public float noiseScale = ${complexity === 'simple' ? '0.01f' : complexity === 'balanced' ? '0.02f' : '0.04f'};
    public int octaves = ${complexity === 'simple' ? '3' : complexity === 'balanced' ? '5' : '8'};
    
    void Start()
    {
        GenerateWorld();
        SetupLighting();
    }
    
    void GenerateWorld()
    {
        Debug.Log("Generating ${world.name}...");
        // Biomes: ${world.biomes.join(', ')}
        
        // TODO: Implement procedural mesh generation
        // TODO: Implement biome system
        // TODO: Implement object placement
    }
    
    void SetupLighting()
    {
        // ${world.features.join(', ')}
        var light = gameObject.AddComponent<Light>();
        light.type = LightType.Directional;
        light.shadows = LightShadows.Soft;
    }
}
`;
  }
  
  return `// ${world.name} World Template
// Engine: ${engine}
// Size: ${size}
// Complexity: ${complexity}
// Biomes: ${world.biomes.join(', ')}
// Features: ${world.features.join(', ')}

// TODO: Implement world generation for ${engine}
`;
}

function generatePlaceholder(engine, assetType) {
  const asset = ASSET_TYPES.find(a => a.id === assetType);
  return `// ${asset?.label || 'Game Asset'}
// Engine: ${engine}
// Complexity: ${asset?.complexity || 'unknown'}
//
// TODO: Implement ${asset?.desc || 'asset'}
//
// This is a placeholder. Connect an AI provider to generate
// production-ready code.`;
}
