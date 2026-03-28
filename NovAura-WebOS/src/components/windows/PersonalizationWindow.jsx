import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  Grid, 
  Check, 
  GripVertical,
  Moon,
  Sun,
  Stars,
  Monitor,
  Save,
  RotateCcw,
  Cpu
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

// Available themes
const THEMES = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Deep space black with RGB particles',
    icon: Stars,
    preview: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
    particleColors: ['#00d9ff', '#a855f7', '#ff00ff'],
  },
  {
    id: 'blue-night',
    name: 'Blue Night',
    description: 'Deep navy with sunset colors',
    icon: Moon,
    preview: 'linear-gradient(135deg, #0f1729 0%, #1e293b 100%)',
    particleColors: ['#60a5fa', '#fbbf24', '#f97316'],
  },
  {
    id: 'light',
    name: 'Aurora',
    description: 'Soft warm tones - easy on eyes',
    icon: Sun,
    preview: 'linear-gradient(135deg, #f5f2ed 0%, #e8e5e0 100%)',
    particleColors: ['#5a8a6e', '#b86b7e', '#c9a35f'],
  },
];

// Available apps for taskbar — all registered window types
const AVAILABLE_APPS = [
  // Dev Tools
  { id: 'ide', name: 'Code IDE', icon: '💻', category: 'Dev', default: true },
  { id: 'website-builder', name: 'Builder', icon: '🔨', category: 'Dev', default: true },
  { id: 'vibe-coding', name: 'Vibe Code', icon: '⚡', category: 'Dev', default: true },
  { id: 'creator-studio', name: 'Creator', icon: '🔧', category: 'Dev', default: false },
  { id: 'constructor', name: 'Constructor', icon: '🧱', category: 'Dev', default: false },
  { id: 'script-fusion', name: 'Script Fuse', icon: '🔀', category: 'Dev', default: false },
  { id: 'workspace', name: 'Workspace', icon: '📂', category: 'Dev', default: false },
  { id: 'dojo', name: 'Dojo', icon: '⚔️', category: 'Dev', default: false },
  { id: 'terminal', name: 'Terminal', icon: '⌨️', category: 'Dev', default: true },
  // Creative
  { id: 'art-studio', name: 'Art Studio', icon: '🎨', category: 'Creative', default: true },
  { id: 'art-gallery', name: 'Art Gallery', icon: '🖼️', category: 'Creative', default: false },
  { id: 'comic-creator', name: 'Comics', icon: '📰', category: 'Creative', default: false },
  { id: 'clothing-creator', name: 'Clothing', icon: '👕', category: 'Creative', default: false },
  { id: 'outfit-generator', name: 'Outfits', icon: '✨', category: 'Creative', default: false },
  { id: 'outfit-manager', name: 'Wardrobe', icon: '👗', category: 'Creative', default: false },
  { id: 'avatar-builder', name: 'Avatar', icon: '👤', category: 'Creative', default: false },
  { id: 'avatar-gallery', name: 'Avatars', icon: '👥', category: 'Creative', default: false },
  // Writing
  { id: 'literature-ide', name: 'Literature', icon: '📖', category: 'Writing', default: true },
  { id: 'poems', name: 'Poems', icon: '🪶', category: 'Writing', default: false },
  { id: 'collab-writing', name: 'Collab Write', icon: '✍️', category: 'Writing', default: false },
  { id: 'writing-library', name: 'Library', icon: '📚', category: 'Writing', default: false },
  // Media
  { id: 'music-composer', name: 'Composer', icon: '🎵', category: 'Media', default: true },
  { id: 'live-broadcast', name: 'Broadcast', icon: '📡', category: 'Media', default: false },
  { id: 'media', name: 'Player', icon: '▶️', category: 'Media', default: false },
  { id: 'media-library', name: 'Files', icon: '📁', category: 'Media', default: false },
  // AI
  { id: 'chat', name: 'AI Chat', icon: '💬', category: 'AI', default: true },
  { id: 'voice', name: 'Voice', icon: '📞', category: 'AI', default: false },
  { id: 'ai-assistant', name: 'Assistant', icon: '🧠', category: 'AI', default: false },
  { id: 'ai-companion', name: 'Nova AI', icon: '🤖', category: 'AI', default: false },
  { id: 'vertex', name: 'Vertex AI', icon: '🎨', category: 'AI', default: false },
  { id: 'bg-remover', name: 'BG Remove', icon: '🧹', category: 'AI', default: false },
  // Utility
  { id: 'browser', name: 'Browser', icon: '🌐', category: 'Utility', default: true },
  { id: 'business-card', name: 'Biz Cards', icon: '💳', category: 'Utility', default: false },
  { id: 'tax-filing', name: 'Tax Filing', icon: '📋', category: 'Utility', default: false },
  { id: 'notifications', name: 'Alerts', icon: '🔔', category: 'Utility', default: false },
  { id: 'profile', name: 'Profile', icon: '👤', category: 'Utility', default: true },
  { id: 'appstore', name: 'Market', icon: '🛒', category: 'Utility', default: false },
  { id: 'personalization', name: 'Settings', icon: '⚙️', category: 'Utility', default: true },
  // Games & Learn
  { id: 'games-arena', name: 'Games', icon: '🎮', category: 'Games', default: true },
  { id: 'aetherium-tcg', name: 'Aetherium', icon: '🃏', category: 'Games', default: false },
  { id: 'card-deck-creator', name: 'Deck Builder', icon: '🎴', category: 'Games', default: false },
  { id: 'challenges', name: 'Challenges', icon: '🏋️', category: 'Learn', default: false },
  { id: 'psychometrics', name: 'Psyche', icon: '🧩', category: 'Learn', default: false },
];

export default function PersonalizationWindow({ onThemeChange, onOpenWindow }) {
  const [activeTab, setActiveTab] = useState('themes');
  const [selectedTheme, setSelectedTheme] = useState('cosmic');
  const [taskbarApps, setTaskbarApps] = useState([]);
  const [llmConfig, setLlmConfig] = useState({
    useLocalLLM: false,
    localLLMUrl: 'http://localhost:11434/api/generate',
    localLLMModel: 'llama3',
    apiKey: ''
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('novaura-theme') || 'cosmic';
    const savedApps = localStorage.getItem('novaura-taskbar-apps');
    const savedAI = localStorage.getItem('llm_config');
    
    setSelectedTheme(savedTheme);
    
    if (savedApps) {
      setTaskbarApps(JSON.parse(savedApps));
    } else {
      const defaults = AVAILABLE_APPS.filter(app => app.default).map(app => app.id);
      setTaskbarApps(defaults);
    }

    if (savedAI) {
      setLlmConfig(JSON.parse(savedAI));
    }
  }, []);

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    setHasChanges(true);
    
    // Apply theme immediately for preview
    document.documentElement.setAttribute('data-theme', themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const toggleApp = (appId) => {
    setTaskbarApps(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
    setHasChanges(true);
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newApps = [...taskbarApps];
    const draggedApp = newApps[draggedItem];
    newApps.splice(draggedItem, 1);
    newApps.splice(index, 0, draggedApp);
    
    setTaskbarApps(newApps);
    setDraggedItem(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const saveSettings = () => {
    localStorage.setItem('novaura-theme', selectedTheme);
    localStorage.setItem('novaura-taskbar-apps', JSON.stringify(taskbarApps));
    localStorage.setItem('llm_config', JSON.stringify(llmConfig));

    // Apply theme
    document.documentElement.setAttribute('data-theme', selectedTheme);

    // Notify Toolbar and App to update in real-time
    window.dispatchEvent(new CustomEvent('novaura-taskbar-update', { detail: taskbarApps }));
    window.dispatchEvent(new CustomEvent('novaura-ai-config-update', { detail: llmConfig }));

    toast.success('Settings saved!', {
      description: 'Your personalization preferences have been updated.',
    });
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setSelectedTheme('cosmic');
    document.documentElement.setAttribute('data-theme', 'cosmic');
    
    const defaults = AVAILABLE_APPS
      .filter(app => app.default)
      .map(app => app.id);
    setTaskbarApps(defaults);
    
    setHasChanges(true);
    toast.info('Reset to defaults');
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Personalization
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your Nova OS experience
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenWindow && onOpenWindow('graphics-settings', 'Graphics')}
            className="gap-2"
          >
            <Cpu className="w-4 h-4" />
            Graphics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={!hasChanges}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="w-4 h-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="taskbar" className="gap-2">
            <Layout className="w-4 h-4" />
            Taskbar
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Cpu className="w-4 h-4" />
            AI Engine
          </TabsTrigger>
        </TabsList>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Choose Your Theme
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {THEMES.map((theme) => {
                const Icon = theme.icon;
                const isSelected = selectedTheme === theme.id;
                
                return (
                  <Card
                    key={theme.id}
                    className={`p-4 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'ring-2 ring-primary shadow-lg shadow-primary/20' 
                        : 'hover:shadow-md hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeSelect(theme.id)}
                  >
                    {/* Preview */}
                    <div 
                      className="h-24 rounded-lg mb-4 relative overflow-hidden"
                      style={{ background: theme.preview }}
                    >
                      {/* Particle preview dots */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        {theme.particleColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ 
                              backgroundColor: color,
                              animationDelay: `${i * 0.2}s`,
                              boxShadow: `0 0 10px ${color}`,
                            }}
                          />
                        ))}
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{theme.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Theme Preview Info */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Stars className="w-4 h-4 text-primary" />
              Active Theme: {THEMES.find(t => t.id === selectedTheme)?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Your theme changes are previewed in real-time. Click "Save Changes" to persist them.
            </p>
          </Card>
        </TabsContent>

        {/* Taskbar Tab */}
        {/* AI Engine Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="p-4 bg-muted/50 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  AI Provider Settings
                </h3>
                <p className="text-sm text-muted-foreground">Toggle between Cloud and Local inference</p>
              </div>
              <Switch 
                checked={llmConfig.useLocalLLM} 
                onCheckedChange={(val) => {
                  setLlmConfig(prev => ({ ...prev, useLocalLLM: val }));
                  setHasChanges(true);
                }} 
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              {llmConfig.useLocalLLM ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[11px] text-blue-400 mb-2">
                    Ensure Ollama or LM Studio is running and CORS is enabled.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase">Endpoint URL</label>
                      <input 
                        className="w-full bg-background border border-border p-2 rounded text-sm"
                        value={llmConfig.localLLMUrl}
                        onChange={(e) => {
                          setLlmConfig(prev => ({ ...prev, localLLMUrl: e.target.value }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase">Model Name</label>
                      <input 
                        className="w-full bg-background border border-border p-2 rounded text-sm"
                        value={llmConfig.localLLMModel}
                        onChange={(e) => {
                          setLlmConfig(prev => ({ ...prev, localLLMModel: e.target.value }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-[11px] text-purple-400 mb-2">
                    Using Google Vertex AI / Gemini Cloud Infrastructure.
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">Platform API Key (Optional Override)</label>
                    <input 
                      type="password"
                      className="w-full bg-background border border-border p-2 rounded text-sm"
                      placeholder="Leave blank to use platform default"
                      value={llmConfig.apiKey}
                      onChange={(e) => {
                        setLlmConfig(prev => ({ ...prev, apiKey: e.target.value }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Platform Fee Notice</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard 10% platform fee applies to all marketplace transactions. AI inference is provided as part of your base subscription tier. Use of local models (Ollama/LM Studio) is free and privacy-focused.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
