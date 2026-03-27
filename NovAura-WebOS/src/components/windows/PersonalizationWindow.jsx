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
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('novaura-theme') || 'cosmic';
    const savedApps = localStorage.getItem('novaura-taskbar-apps');
    
    setSelectedTheme(savedTheme);
    
    if (savedApps) {
      setTaskbarApps(JSON.parse(savedApps));
    } else {
      // Use defaults
      const defaults = AVAILABLE_APPS
        .filter(app => app.default)
        .map(app => app.id);
      setTaskbarApps(defaults);
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

    // Apply theme
    document.documentElement.setAttribute('data-theme', selectedTheme);

    // Notify Toolbar to update in real-time (same-tab writes don't fire 'storage')
    window.dispatchEvent(new CustomEvent('novaura-taskbar-update', { detail: taskbarApps }));

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
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="w-4 h-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="taskbar" className="gap-2">
            <Layout className="w-4 h-4" />
            Taskbar
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
        <TabsContent value="taskbar" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Grid className="w-5 h-5 text-primary" />
              Taskbar Apps
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select which apps appear in your taskbar and drag to reorder them.
            </p>

            {/* App Selection */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium mb-3">Visible Apps</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_APPS.map((app) => {
                  const isEnabled = taskbarApps.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      onClick={() => toggleApp(app.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        isEnabled
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-transparent text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span>{isEnabled ? '✓' : '+'}</span>
                      <span className="text-lg">{app.icon}</span>
                      <span className="text-sm font-medium">{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Taskbar Preview / Reorder */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                Taskbar Order
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag items to rearrange their order in the taskbar.
              </p>

              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[60px]">
                {taskbarApps.length === 0 ? (
                  <p className="text-muted-foreground text-sm w-full text-center py-2">
                    No apps selected. Choose apps above to add them to your taskbar.
                  </p>
                ) : (
                  taskbarApps.map((appId, index) => {
                    const app = AVAILABLE_APPS.find(a => a.id === appId);
                    if (!app) return null;
                    
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-2 px-3 py-2 bg-background border rounded-lg cursor-move hover:border-primary transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg">{app.icon}</span>
                        <span className="text-sm font-medium">{app.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Tips */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You can have up to 10 apps in your taskbar</li>
              <li>Frequently used apps should be placed at the beginning</li>
              <li>Changes take effect immediately after saving</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
