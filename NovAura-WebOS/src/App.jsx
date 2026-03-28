import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ParticleBackground from './components/ParticleBackground';
import ChatBar from './components/ChatBar';
import Toolbar from './components/Toolbar';
import WindowManager from './components/WindowManager';
import SetupPage from './pages/SetupPage';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/sonner';
import { LeftSidebar, RightSidebar } from './components/Sidebar';
import AvatarButton from './components/AvatarButton';
import OnboardingWizard, { HelpButton } from './components/OnboardingWizard';
import TipsWidget from './components/TipsWidget';
import CommandPalette from './components/CommandPalette';
import AuraChatHistory from './components/AuraChatHistory';
import { useCommandPalette } from './hooks/useCommandPalette';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { AIOrchestrator } from './utils/AIOrchestrator';
import { smartChat } from './services/aiService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [llmConfig, setLlmConfig] = useState(null);
  const [windows, setWindows] = useState([]);
  const [particleConfig, setParticleConfig] = useState('idle');
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [theme, setTheme] = useState('cosmic');
  const [showOS, setShowOS] = useState(false);
  const [pendingWindow, setPendingWindow] = useState(null);
  const [showAuraHistory, setShowAuraHistory] = useState(false);
  const [auraHistory, setAuraHistory] = useState([]);
  const [promptLibrary, setPromptLibrary] = useState([]);
  const orchestratorRef = useRef(null);
  const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsAuthenticated(true);

        const savedConfig = localStorage.getItem('llm_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setLlmConfig(config);
          setIsSetupComplete(true);
        }
      } catch (e) {
        console.error('Error loading saved session:', e);
      }
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('novaura-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Load Aura history and prompt library
    try {
      const savedHistory = localStorage.getItem('novaura_aura_history');
      if (savedHistory) setAuraHistory(JSON.parse(savedHistory));
      
      const savedLibrary = localStorage.getItem('novaura_prompt_library');
      if (savedLibrary) setPromptLibrary(JSON.parse(savedLibrary));
    } catch (e) {
      console.error('Error loading Aura memory:', e);
    }
  }, []);

  // URL deep-link support for specific OS features (if any are left)
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    if (path === '/os') {
      setShowOS(true);
    }
  }, [location.pathname]);
  
  // Persist Aura history
  useEffect(() => {
    if (auraHistory.length > 0) {
      localStorage.setItem('novaura_aura_history', JSON.stringify(auraHistory));
    }
  }, [auraHistory]);

  const handleAuthComplete = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleSetupComplete = (config) => {
    setLlmConfig(config);
    setIsSetupComplete(true);

    const windowManagerAPI = { openWindow, closeWindow, focusWindow };
    orchestratorRef.current = new AIOrchestrator(windowManagerAPI, toast);

    toast.success('AI Environment Ready!', {
      description: `Using ${config.useLocalLLM ? 'Local LLM + ' : ''}Gemini AI`,
    });
  };

  const openWindow = useCallback((type, title, props = {}) => {
    const newWindow = {
      id: `window-${Date.now()}-${Math.random()}`,
      type,
      title,
      zIndex: nextZIndex,
      props
    };
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);

    setParticleConfig('active');
    setTimeout(() => setParticleConfig('idle'), 2000);

    return newWindow.id;
  }, [nextZIndex]);

  const closeWindow = useCallback((id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const focusWindow = useCallback((id) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      if (!win) return prev;
      const newZIndex = nextZIndex;
      setNextZIndex(newZIndex + 1);
      return prev.map(w => w.id === id ? { ...w, zIndex: newZIndex } : w);
    });
  }, [nextZIndex]);

  // AI chat — routes through centralized service (local LLM or cloud provider)
  const chatWithAI = async (message, taskCategory = 'general') => {
    return await smartChat(message, taskCategory, llmConfig || {});
  };

  const handleChatSubmit = async (message) => {
    setParticleConfig('active');
    setTimeout(() => setParticleConfig('idle'), 1500);

    // Add user message to history
    const userMsg = { role: 'user', text: message, timestamp: Date.now() };
    setAuraHistory(prev => [...prev, userMsg]);

    try {
      toast.loading('AI is processing...', { id: 'ai-response' });

      const responseData = await chatWithAI(message, 'conversations');

      if (responseData.function_calls && orchestratorRef.current) {
        for (const functionCall of responseData.function_calls) {
          await executeFunctionCall(functionCall);
        }
      }

      // Local orchestrator fallback — if AI returned no function calls, try local intent parsing
      if (!responseData.function_calls && orchestratorRef.current) {
        const localResult = await orchestratorRef.current.executeIntent(message);
        if (localResult.success) {
          toast.success(localResult.message, { id: 'ai-response', duration: 3000 });
          // Add Aura response to history
          setAuraHistory(prev => [...prev, { 
            role: 'assistant', 
            text: localResult.message, 
            timestamp: Date.now() 
          }]);
          return;
        }
      }

      if (responseData.response) {
        toast.success(`AI Response (${responseData.source || 'cloud'})`, {
          id: 'ai-response',
          description: responseData.response.substring(0, 300),
          duration: 5000,
        });
        // Add AI response to history
        setAuraHistory(prev => [...prev, { 
          role: 'assistant', 
          text: responseData.response, 
          timestamp: Date.now(),
          source: responseData.source
        }]);
      } else {
        toast.dismiss('ai-response');
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('AI Error', {
        id: 'ai-response',
        description: error.message || 'Failed to get AI response',
      });
      // Add error to history
      setAuraHistory(prev => [...prev, { 
        role: 'assistant', 
        text: `Error: ${error.message}`, 
        timestamp: Date.now(),
        error: true
      }]);
    }
  };

  const executeFunctionCall = async (functionCall) => {
    if (!orchestratorRef.current) return;

    const { name, args } = functionCall;

    try {
      switch (name) {
        case 'open_window':
          openWindow(args.window_type, getWindowTitle(args.window_type), args.params || {});
          break;
        case 'generate_code':
          openWindow('ide', 'Code IDE', { language: args.language, initialCode: `// ${args.description}\n\n` });
          toast.info('IDE opened', { description: 'Ready to code: ' + args.description });
          break;
        case 'browse_web':
          openWindow('browser', 'AI Browser', { initialUrl: args.url || args.search_query, aiMode: args.ai_mode !== false });
          break;
        case 'generate_image':
          openWindow('vertex', 'Vertex AI', { initialPrompt: args.prompt, mode: 'image', aspectRatio: args.aspect_ratio });
          toast.info('Generating image', { description: args.prompt });
          break;
        case 'generate_video':
          openWindow('vertex', 'Vertex AI', { initialPrompt: args.prompt, mode: 'video' });
          toast.info('Generating video', { description: args.prompt });
          break;
        case 'build_website':
          openWindow('website-builder', 'Website Builder', { initialPrompt: args.description, template: args.template, features: args.features });
          toast.info('Website Builder opened', { description: args.description });
          break;
        case 'remove_background':
          openWindow('bg-remover', 'Background Remover', {});
          break;
        case 'execute_terminal_command':
          openWindow('terminal', 'Terminal', { initialCommand: args.command });
          break;
        case 'control_media':
          openWindow('media', 'Media Player', { action: args.action });
          break;
        case 'open_media_library':
          openWindow('media-library', 'Media Library', {});
          break;
        case 'compose_music':
          openWindow('music-composer', 'Music Composer', { initialPrompt: args.prompt, genre: args.genre });
          toast.info('Music Composer opened', { description: args.prompt || args.genre });
          break;
        case 'open_art_studio':
          openWindow('art-studio', 'Art Studio', { initialPrompt: args.prompt, style: args.style });
          break;
        case 'open_literature_ide':
          openWindow('literature-ide', 'Literature IDE', { initialPrompt: args.prompt, genre: args.genre });
          break;
        case 'create_avatar':
          openWindow('avatar-builder', 'Avatar Builder', { initialPrompt: args.prompt });
          break;
        case 'create_comic':
          openWindow('comic-creator', 'Comic Creator', { initialPrompt: args.prompt });
          break;
        case 'design_clothing':
          openWindow('clothing-creator', 'Clothing Creator', { initialPrompt: args.prompt });
          break;
        case 'open_game':
          openWindow('games-arena', 'Games Arena', { gameId: args.game_id });
          break;
        case 'file_taxes':
          openWindow('tax-filing', 'Tax Filing', {});
          break;
        case 'open_chat':
          openWindow('chat', 'Nova AI', { initialMessage: args.message });
          break;
        case 'voice_call':
          openWindow('voice', 'Voice Chat', {});
          break;
        case 'close_windows':
          if (args.close_all) {
            setWindows([]);
            toast.info('All windows closed');
          } else if (args.window_type) {
            const windowToClose = windows.find(w => w.type === args.window_type);
            if (windowToClose) closeWindow(windowToClose.id);
          }
          break;
        default:
          // Fallback: if the function name matches a window type, just open it
          if (getWindowTitle(name) !== 'Window') {
            openWindow(name, getWindowTitle(name), args || {});
          } else {
            console.warn('Unknown function call:', name);
          }
      }
    } catch (error) {
      console.error('Error executing function:', error);
    }
  };

  const getWindowTitle = (type) => {
    const titles = {
      'ide': 'Cybeni IDE',
      'website-builder': 'Website Builder',
      'browser': 'AI Browser',
      'vertex': 'Vertex AI',
      'bg-remover': 'Background Remover',
      'media': 'Media Player',
      'media-library': 'Media Library',
      'chat': 'AI Chat',
      'voice': 'Voice Chat',
      'terminal': 'Terminal',
      'ai-assistant': 'AI Assistant',
      'literature-ide': 'Literature IDE',
      'games-arena': 'Games Arena',
      'music-composer': 'Music Composer',
      'poems': 'Poems Creator',
      'aetherium-tcg': 'Aetherium TCG',
      'comic-creator': 'Comic Creator',
      'business-card': 'Business Cards',
      'appstore': 'Repo Station',
      'profile': 'Profile',
      'game': 'Game',
      'art-studio': 'Art Studio',
      'art-gallery': 'Art Gallery',
      'clothing-creator': 'Clothing Creator',
      'outfit-generator': 'Outfit Generator',
      'collab-writing': 'Collaborative Writing',
      'writing-library': 'Writing Library',
      'script-fusion': 'Script Fusion',
      'constructor': 'Constructor',
      'creator-studio': 'Creator Studio',
      'vibe-coding': 'Vibe Coding',
      'workspace': 'Workspace',
      'avatar-builder': 'Avatar Builder',
      'live-broadcast': 'Live Broadcasting',
      'dojo': 'Dojo',
      'challenges': 'Challenges',
      'psychometrics': 'Psychometrics',
      'notifications': 'Notifications',
      'ai-companion': 'Nova AI',
      'avatar-gallery': 'Avatar Gallery',
      'outfit-manager': 'Outfit Manager',
      'card-deck-creator': 'Deck Creator',
      'tax-filing': 'Tax Filing',
      'admin-panel': 'Admin Panel',
      'personalization': 'Personalization',
      'pricing': 'Pricing & Plans',
      'secrets': 'Secrets Manager',
      'social': 'Community',
      'billing': 'Billing & Plans',
      'git': 'Git',
      'files': 'Files',
      'pixai': 'PixAI Art',
      'business-operator': 'Business Operator',
      'nova-concierge': 'Nova Concierge',
      'weather': 'Weather',
      'crypto': 'Crypto Markets',
      'calculator': 'Calculator',
    };
    return titles[type] || 'Window';
  };

  // Handle launching OS from landing page
  const handleLaunchOS = (windowType) => {
    if (windowType) {
      setPendingWindow(windowType);
    }
    setShowOS(true);
  };
  
  // Open pending window from landing page deep-link
  // (must be before conditional returns to satisfy React hooks rules)
  useEffect(() => {
    if (pendingWindow && isSetupComplete) {
      openWindow(pendingWindow, getWindowTitle(pendingWindow));
      setPendingWindow(null);
    }
  }, [isSetupComplete, pendingWindow]);

  // Landing page (search engine) - entry point for all users
  if (!showOS) {
    return (
      <>
        <LandingPage 
          onLaunchOS={handleLaunchOS}
          isAuthenticated={isAuthenticated}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  // Auth screen (when launching OS but not authenticated)
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onAuthComplete={handleAuthComplete} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Setup screen
  if (!isSetupComplete) {
    return (
      <>
        <SetupPage onComplete={handleSetupComplete} />
        <Toaster position="top-right" />
      </>
    );
  }


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Particle Background */}
      <ParticleBackground config={particleConfig} theme={theme} />

      {/* Window Manager */}
      <WindowManager
        windows={windows}
        onClose={closeWindow}
        onFocus={focusWindow}
        onOpenWindow={openWindow}
        onAIChat={chatWithAI}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Sidebars */}
      <LeftSidebar windowCount={windows.length} onOpenWindow={openWindow} />
      <RightSidebar onOpenWindow={openWindow} onOpenGame={(gameId, title) => openWindow('game', title, { gameId, title })} />

      {/* Avatar Chat Button — bottom right */}
      <div className="fixed bottom-28 right-6 z-[850] pointer-events-auto">
        <AvatarButton
          onClick={() => openWindow('chat', 'Nova AI')}
          mood="idle"
        />
      </div>

      {/* Bottom UI Layer */}
      <div className="fixed bottom-0 left-0 right-0 z-[900] flex flex-col items-center pointer-events-none">
        {/* Toolbar — slides up from behind ChatBar */}
        <div className={`pointer-events-auto transition-all duration-300 ease-in-out ${toolbarOpen ? 'max-h-20 opacity-100 mb-2' : 'max-h-0 opacity-0 overflow-hidden mb-0'}`}>
          <Toolbar onOpenWindow={(type, label) => { openWindow(type, label); setToolbarOpen(false); }} />
        </div>

        {/* Chat Bar with toggle tab */}
        <div className="pointer-events-auto w-full px-6 pb-4">
          <div className="relative">
            <button
              onClick={() => setToolbarOpen(!toolbarOpen)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-0.5 bg-black/80 border border-white/10 rounded-t-lg text-white/40 hover:text-white/80 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-300 ${toolbarOpen ? 'rotate-180' : ''}`}>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <ChatBar onSubmit={handleChatSubmit} llmConfig={llmConfig} />
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
      
      {/* Aura Chat History - Top Right Panel */}
      <AuraChatHistory
        isOpen={showAuraHistory}
        onClose={() => setShowAuraHistory(false)}
        messages={auraHistory}
        onSendMessage={handleChatSubmit}
        savedPrompts={promptLibrary}
        onSavePrompt={(prompt) => {
          setPromptLibrary(prev => {
            const exists = prev.some(p => p.text === prompt.text);
            if (exists) return prev;
            const updated = [...prev, prompt];
            localStorage.setItem('novaura_prompt_library', JSON.stringify(updated));
            return updated;
          });
        }}
        onDeletePrompt={(promptId) => {
          setPromptLibrary(prev => {
            const updated = prev.filter(p => p.id !== promptId);
            localStorage.setItem('novaura_prompt_library', JSON.stringify(updated));
            return updated;
          });
        }}
      />
      
      {/* Aura Memory Toggle Button - Top Right */}
      <button
        onClick={() => setShowAuraHistory(!showAuraHistory)}
        className={`fixed top-4 right-4 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
          showAuraHistory 
            ? 'bg-primary/20 border-primary/40 text-primary' 
            : 'bg-black/50 border-white/10 text-gray-300 hover:bg-white/10'
        } backdrop-blur-sm`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium">Aura Memory</span>
        {promptLibrary.length > 0 && (
          <span className="text-[9px] px-1 rounded bg-primary/30 text-primary">
            {promptLibrary.length}
          </span>
        )}
      </button>
      
      {/* Command Palette - Global Cmd+K */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        onSelect={(commandId) => {
          // Map commands to window openings
          const windowMap = {
            'ide': () => openWindow('ide', 'Cybeni IDE'),
            'terminal': () => openWindow('terminal', 'Terminal'),
            'browser': () => openWindow('browser', 'AI Browser'),
            'git': () => openWindow('git', 'Git'),
            'files': () => openWindow('files', 'Files'),
            'pixai': () => openWindow('pixai', 'PixAI Art Studio'),
            'secrets': () => openWindow('secrets', 'Secrets Manager'),
            'settings': () => openWindow('personalization', 'Settings'),
            'profile': () => openWindow('profile', 'Profile'),
            'billing': () => openWindow('billing', 'Billing'),
          };
          
          if (windowMap[commandId]) {
            windowMap[commandId]();
            toast.success(`Opened ${commandId}`);
          } else if (commandId === 'dark-mode') {
            const newTheme = theme === 'cosmic' ? 'blueNight' : 'cosmic';
            setTheme(newTheme);
            localStorage.setItem('novaura-theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            toast.success(`Theme: ${newTheme}`);
          } else if (commandId === 'logout') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.reload();
          }
        }}
      />
      
      {/* Onboarding Wizard - shows on first launch */}
      <OnboardingWizard 
        onComplete={() => {
          toast.success('You\'re all set! 🎉', {
            description: 'Start by opening an app from the sidebar.',
          });
        }}
        onSkip={() => {
          toast.info('Skipped onboarding', {
            description: 'You can restart it from Settings > Help.',
          });
        }}
      />
      
      {/* Help Button - always visible */}
      <HelpButton />
      
      {/* Tips Widget - rotating helpful hints */}
      <TipsWidget />
    </div>
  );
}
