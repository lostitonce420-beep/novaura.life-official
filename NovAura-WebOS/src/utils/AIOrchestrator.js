// AI Orchestration System - Controls all OS functions via AI intent

const APP_KEYWORDS = {
  'ide': ['ide', 'code editor', 'coding editor'],
  'website-builder': ['website builder', 'build website', 'web builder', 'build a site'],
  'browser': ['browse', 'search', 'visit', 'go to', 'open website', 'web browser'],
  'vertex': ['vertex', 'generate image', 'generate picture', 'generate photo', 'image gen', 'ai image'],
  'bg-remover': ['remove background', 'remove bg', 'background remover', 'bg cut'],
  'media': ['media player', 'play media', 'play video', 'play audio', 'play music'],
  'media-library': ['media library', 'files', 'file manager', 'my files'],
  'chat': ['chat', 'ai chat', 'talk to ai', 'nova chat'],
  'voice': ['voice', 'talk', 'speak', 'voice chat', 'call'],
  'terminal': ['terminal', 'command line', 'cmd', 'shell', 'command prompt'],
  'ai-assistant': ['ai assistant', 'assistant', 'help me'],
  'literature-ide': ['literature', 'lit ide', 'writing ide', 'novel', 'story editor', 'creative writing'],
  'games-arena': ['games', 'game arena', 'play games', 'chess', 'checkers'],
  'music-composer': ['compose music', 'music composer', 'make music', 'create music', 'beat maker', 'composer'],
  'poems': ['poem', 'poetry', 'write poem', 'poems creator'],
  'aetherium-tcg': ['aetherium', 'card game', 'tcg', 'trading card'],
  'comic-creator': ['comic', 'create comic', 'comic creator', 'comic strip'],
  'business-card': ['business card', 'create card', 'card designer'],
  'art-studio': ['art studio', 'draw', 'paint', 'drawing', 'painting', 'sketch'],
  'art-gallery': ['art gallery', 'gallery', 'view art', 'browse art'],
  'clothing-creator': ['clothing', 'create clothing', 'design clothes', 'fashion design'],
  'outfit-generator': ['outfit', 'what to wear', 'outfit generator', 'style me'],
  'collab-writing': ['collaborative writing', 'collab writing', 'write together', 'writing session'],
  'writing-library': ['writing library', 'my writing', 'documents', 'my docs'],
  'script-fusion': ['script fusion', 'script', 'scripting'],
  'constructor': ['constructor', 'component builder', 'ui builder'],
  'creator-studio': ['creator studio', 'create project', 'project creator'],
  'vibe-coding': ['vibe coding', 'vibe code', 'code with ai', 'pair program'],
  'workspace': ['workspace', 'project workspace', 'my workspace'],
  'avatar-builder': ['avatar', 'create avatar', 'avatar builder', 'character creator'],
  'live-broadcast': ['broadcast', 'live stream', 'streaming', 'go live'],
  'dojo': ['dojo', 'game asset', 'game code', 'game dev', 'unreal', 'unity', 'godot'],
  'challenges': ['challenge', 'coding challenge', 'practice coding', 'xp', 'level up'],
  'psychometrics': ['psychometric', 'assessment', 'personality test', 'quiz', 'evaluate'],
  'appstore': ['app store', 'marketplace', 'store'],
  'profile': ['profile', 'my profile', 'account', 'settings'],
  'files': ['files', 'file manager', 'my files', 'documents', 'explorer'],
  'pixai': ['pixai', 'pix ai', 'pixel art', 'ai art'],
  'ai-companion': ['companion', 'nova ai', 'nova companion', 'ai companion'],
  'avatar-gallery': ['avatar gallery', 'view avatars', 'browse avatars'],
  'outfit-manager': ['outfit manager', 'wardrobe', 'manage outfits', 'my outfits'],
  'card-deck-creator': ['deck creator', 'create deck', 'deck builder', 'card deck'],
  'tax-filing': ['tax', 'taxes', 'tax filing', 'file taxes', 'tax return'],
  'personalization': ['personalization', 'customize', 'settings', 'personalize', 'preferences'],
  'notifications': ['notifications', 'alerts', 'notify'],
  'secrets': ['secrets', 'secret manager', 'api keys', 'credentials'],
  'billing': ['billing', 'subscription', 'payment', 'plan'],
  'git': ['git', 'version control', 'repository', 'repo'],
  'pricing': ['pricing', 'prices', 'plans', 'pricing plans'],
  'admin-panel': ['admin', 'admin panel', 'administration', 'dashboard'],
  'business-operator': ['business operator', 'operator', 'business', 'dropship', 'store manager', 'business automation', 'ai operator'],
  'nova-concierge': ['nova concierge', 'concierge', 'nova operator', 'ai assistant', 'business manager', 'nova control', 'control center'],
};

const APP_TITLES = {
  'ide': 'Code IDE', 'website-builder': 'Website Builder', 'browser': 'AI Browser',
  'vertex': 'Vertex AI', 'bg-remover': 'Background Remover', 'media': 'Media Player',
  'media-library': 'Media Library', 'chat': 'AI Chat', 'voice': 'Voice Chat',
  'terminal': 'Terminal', 'ai-assistant': 'AI Assistant', 'literature-ide': 'Literature IDE',
  'games-arena': 'Games Arena', 'music-composer': 'Music Composer', 'poems': 'Poems Creator',
  'aetherium-tcg': 'Aetherium TCG', 'comic-creator': 'Comic Creator',
  'business-card': 'Business Cards', 'art-studio': 'Art Studio', 'art-gallery': 'Art Gallery',
  'clothing-creator': 'Clothing Creator', 'outfit-generator': 'Outfit Generator',
  'collab-writing': 'Collaborative Writing', 'writing-library': 'Writing Library',
  'script-fusion': 'Script Fusion', 'constructor': 'Constructor',
  'creator-studio': 'Creator Studio', 'vibe-coding': 'Vibe Coding', 'workspace': 'Workspace',
  'avatar-builder': 'Avatar Builder', 'live-broadcast': 'Live Broadcasting',
  'dojo': 'Dojo', 'challenges': 'Challenges', 'psychometrics': 'Psychometrics',
  'appstore': 'Marketplace', 'profile': 'Profile',
  'files': 'Files', 'pixai': 'PixAI Art', 'ai-companion': 'Nova AI',
  'avatar-gallery': 'Avatar Gallery', 'outfit-manager': 'Outfit Manager',
  'card-deck-creator': 'Deck Creator', 'tax-filing': 'Tax Filing',
  'personalization': 'Personalization', 'notifications': 'Notifications',
  'secrets': 'Secrets Manager', 'billing': 'Billing & Plans', 'git': 'Git',
  'pricing': 'Pricing & Plans', 'admin-panel': 'Admin Panel',
  'business-operator': 'Business Operator',
  'nova-concierge': 'Nova Concierge',
};

export class AIOrchestrator {
  constructor(windowManager, toast) {
    this.windowManager = windowManager;
    this.toast = toast;
    this.openWindows = new Map();
  }

  async executeIntent(intent, context = {}) {
    const { action, params } = this.parseIntent(intent);

    if (action === 'open_app') {
      return this.openApp(params.appType);
    }
    if (action === 'close_window') {
      return this.closeWindow(params);
    }
    if (action === 'close_all') {
      return this.closeAllWindows();
    }
    if (action === 'generate_image') {
      return this.openApp('vertex', { initialPrompt: params.prompt, mode: 'image' });
    }
    if (action === 'generate_video') {
      return this.openApp('vertex', { initialPrompt: params.prompt, mode: 'video' });
    }
    if (action === 'browse_url') {
      return this.openApp('browser', { initialUrl: params.query });
    }
    if (action === 'execute_command') {
      return this.openApp('terminal', { initialCommand: params.command });
    }

    return { success: false, action: 'unknown', message: null };
  }

  parseIntent(intent) {
    const lower = intent.toLowerCase().trim();

    // Close commands
    if (lower.startsWith('close')) {
      if (lower.includes('all') || lower.includes('everything')) {
        return { action: 'close_all', params: {} };
      }
      const appType = this.detectAppFromText(lower);
      if (appType) return { action: 'close_window', params: { windowType: appType } };
      return { action: 'close_window', params: { windowType: null } };
    }

    // Image/video generation (specific before generic open)
    if (/generate\s+(an?\s+)?image|create\s+(an?\s+)?image|make\s+(an?\s+)?image|generate\s+(a\s+)?picture/.test(lower)) {
      return { action: 'generate_image', params: { prompt: intent } };
    }
    if (/generate\s+(a\s+)?video|create\s+(a\s+)?video|make\s+(a\s+)?video/.test(lower)) {
      return { action: 'generate_video', params: { prompt: intent } };
    }

    // Terminal commands
    if (/^(run|execute)\s+/.test(lower) && !this.detectAppFromText(lower)) {
      return { action: 'execute_command', params: { command: intent.replace(/^(run|execute)\s+/i, '') } };
    }

    // Open app — match against all keywords
    const appType = this.detectAppFromText(lower);
    if (appType) {
      return { action: 'open_app', params: { appType } };
    }

    // URL detection
    if (/https?:\/\/|www\./.test(lower) || /\.(com|org|net|io|dev|ai)\b/.test(lower)) {
      return { action: 'browse_url', params: { query: intent } };
    }

    return { action: 'unknown', params: {} };
  }

  detectAppFromText(text) {
    const lower = text.toLowerCase();
    let bestMatch = null;
    let bestLen = 0;

    for (const [appType, keywords] of Object.entries(APP_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw) && kw.length > bestLen) {
          bestMatch = appType;
          bestLen = kw.length;
        }
      }
    }
    return bestMatch;
  }

  openApp(appType, params = {}) {
    const title = APP_TITLES[appType] || appType;
    const windowId = this.windowManager.openWindow(appType, title, params);
    this.openWindows.set(appType, windowId);
    this.toast(`${title} opened`);
    return { success: true, windowId, appType, message: `Opened ${title}` };
  }

  async closeWindow(params) {
    const windowType = params.windowType;
    if (windowType && this.openWindows.has(windowType)) {
      const windowId = this.openWindows.get(windowType);
      this.windowManager.closeWindow(windowId);
      this.openWindows.delete(windowType);
      return { success: true, message: `${APP_TITLES[windowType] || windowType} closed` };
    }
    return { success: false, message: 'Window not found' };
  }

  async closeAllWindows() {
    for (const [type, id] of this.openWindows.entries()) {
      this.windowManager.closeWindow(id);
    }
    this.openWindows.clear();
    this.toast('All windows closed');
    return { success: true, message: 'All windows closed' };
  }
}

export default AIOrchestrator;
