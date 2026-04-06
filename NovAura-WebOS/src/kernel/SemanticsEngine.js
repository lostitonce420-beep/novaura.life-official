/**
 * NovAura OS — Semantics Engine v1
 * 
 * Makes the entire OS callable and controllable by Aura/Nova.
 * Exposes all windows, features, and actions as semantic functions
 * that AI can invoke through structured function calling.
 */

// Simple ID generator (no external dependency)
function generateId() {
  return 'sem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC REGISTRY - All OS capabilities exposed to AI
// ═══════════════════════════════════════════════════════════════════════════════

const SEMANTIC_REGISTRY = {
  // ── Window Management ──────────────────────────────────────────────────────
  window: {
    description: 'Control OS windows - open, close, focus, minimize, maximize',
    actions: {
      open: {
        description: 'Open a new window by type',
        parameters: {
          type: { type: 'string', required: true, enum: [], description: 'Window type ID' },
          title: { type: 'string', required: false, description: 'Custom window title' },
          props: { type: 'object', required: false, description: 'Initial window properties' }
        }
      },
      close: {
        description: 'Close a window by ID or type',
        parameters: {
          windowId: { type: 'string', required: false, description: 'Specific window ID' },
          type: { type: 'string', required: false, description: 'Close all windows of this type' }
        }
      },
      closeAll: {
        description: 'Close all open windows',
        parameters: {}
      },
      focus: {
        description: 'Bring window to front',
        parameters: {
          windowId: { type: 'string', required: true, description: 'Window ID to focus' }
        }
      },
      minimize: {
        description: 'Minimize a window',
        parameters: {
          windowId: { type: 'string', required: true, description: 'Window ID' }
        }
      },
      maximize: {
        description: 'Maximize a window',
        parameters: {
          windowId: { type: 'string', required: true, description: 'Window ID' }
        }
      },
      restore: {
        description: 'Restore minimized/maximized window',
        parameters: {
          windowId: { type: 'string', required: true, description: 'Window ID' }
        }
      },
      list: {
        description: 'Get list of all open windows',
        parameters: {}
      }
    }
  },

  // ── Navigation & Guidance ───────────────────────────────────────────────────
  navigate: {
    description: 'Guide user to specific features or sections',
    actions: {
      toApp: {
        description: 'Navigate to a specific app/window and guide the user',
        parameters: {
          appType: { type: 'string', required: true, description: 'Target app type' },
          context: { type: 'string', required: false, description: 'Why navigating here' },
          highlight: { type: 'string', required: false, description: 'Specific element to highlight' }
        }
      },
      highlight: {
        description: 'Highlight a UI element to draw user attention',
        parameters: {
          selector: { type: 'string', required: true, description: 'CSS selector or element ID' },
          message: { type: 'string', required: false, description: 'Tooltip message' },
          duration: { type: 'number', required: false, default: 5000, description: 'Highlight duration ms' }
        }
      },
      scrollTo: {
        description: 'Scroll to a specific section',
        parameters: {
          target: { type: 'string', required: true, description: 'Element ID or section name' }
        }
      }
    }
  },

  // ── App-Specific Actions ────────────────────────────────────────────────────
  ide: {
    description: 'Control the Code IDE - create files, edit code, run projects',
    actions: {
      createFile: {
        description: 'Create a new file in the IDE',
        parameters: {
          filename: { type: 'string', required: true, description: 'File name with extension' },
          content: { type: 'string', required: false, description: 'Initial file content' },
          language: { type: 'string', required: false, description: 'Programming language' }
        }
      },
      openFile: {
        description: 'Open an existing file',
        parameters: {
          path: { type: 'string', required: true, description: 'File path' }
        }
      },
      editCode: {
        description: 'Edit code at specific location',
        parameters: {
          file: { type: 'string', required: true, description: 'Target file' },
          line: { type: 'number', required: false, description: 'Line number' },
          action: { type: 'string', required: true, enum: ['insert', 'replace', 'delete'], description: 'Edit action' },
          content: { type: 'string', required: true, description: 'Code to insert/replace' }
        }
      },
      run: {
        description: 'Run the current project',
        parameters: {
          command: { type: 'string', required: false, description: 'Custom run command' }
        }
      },
      build: {
        description: 'Build the current project',
        parameters: {
          target: { type: 'string', required: false, description: 'Build target' }
        }
      }
    }
  },

  browser: {
    description: 'Control the AI Browser - navigate, search, scrape',
    actions: {
      navigate: {
        description: 'Navigate to a URL',
        parameters: {
          url: { type: 'string', required: true, description: 'Target URL' }
        }
      },
      search: {
        description: 'Perform a web search',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query' }
        }
      },
      scrape: {
        description: 'Extract data from current page',
        parameters: {
          selector: { type: 'string', required: false, description: 'CSS selector to extract' }
        }
      }
    }
  },

  vertex: {
    description: 'Vertex AI - generate images and videos',
    actions: {
      generateImage: {
        description: 'Generate an image from prompt',
        parameters: {
          prompt: { type: 'string', required: true, description: 'Image description' },
          aspectRatio: { type: 'string', required: false, enum: ['1:1', '16:9', '9:16', '4:3'], default: '1:1' },
          style: { type: 'string', required: false, description: 'Image style' }
        }
      },
      generateVideo: {
        description: 'Generate a video from prompt',
        parameters: {
          prompt: { type: 'string', required: true, description: 'Video description' },
          duration: { type: 'number', required: false, default: 5, description: 'Duration in seconds' }
        }
      },
      editImage: {
        description: 'Edit an existing image',
        parameters: {
          imageUrl: { type: 'string', required: true, description: 'Source image URL' },
          editPrompt: { type: 'string', required: true, description: 'Edit instructions' }
        }
      }
    }
  },

  chat: {
    description: 'AI Chat - manage conversations',
    actions: {
      newConversation: {
        description: 'Start a new chat conversation',
        parameters: {
          provider: { type: 'string', required: false, enum: ['gemini', 'claude', 'openai', 'kimi'], description: 'AI provider' },
          systemPrompt: { type: 'string', required: false, description: 'System instructions' }
        }
      },
      sendMessage: {
        description: 'Send a message in current chat',
        parameters: {
          message: { type: 'string', required: true, description: 'Message content' },
          attachFiles: { type: 'array', required: false, description: 'Files to attach' }
        }
      },
      clearHistory: {
        description: 'Clear chat history',
        parameters: {}
      }
    }
  },

  voice: {
    description: 'Voice Chat - real-time voice conversations',
    actions: {
      startCall: {
        description: 'Start a voice call with AI',
        parameters: {
          voice: { type: 'string', required: false, enum: ['Puck', 'Charon', 'Kore', 'Fenrir'], description: 'Voice persona' }
        }
      },
      endCall: {
        description: 'End the voice call',
        parameters: {}
      },
      mute: {
        description: 'Mute/unmute microphone',
        parameters: {
          muted: { type: 'boolean', required: true, description: 'Mute state' }
        }
      }
    }
  },

  composer: {
    description: 'Music Composer - create music and beats',
    actions: {
      createTrack: {
        description: 'Create a new music track',
        parameters: {
          genre: { type: 'string', required: false, description: 'Music genre' },
          tempo: { type: 'number', required: false, description: 'BPM' },
          key: { type: 'string', required: false, description: 'Musical key' }
        }
      },
      addInstrument: {
        description: 'Add instrument to track',
        parameters: {
          instrument: { type: 'string', required: true, description: 'Instrument name' },
          pattern: { type: 'string', required: false, description: 'Rhythm pattern' }
        }
      },
      generateAI: {
        description: 'Generate music with AI',
        parameters: {
          prompt: { type: 'string', required: true, description: 'Music description' },
          duration: { type: 'number', required: false, default: 30, description: 'Length in seconds' }
        }
      }
    }
  },

  terminal: {
    description: 'Terminal - execute commands',
    actions: {
      execute: {
        description: 'Execute a terminal command',
        parameters: {
          command: { type: 'string', required: true, description: 'Command to execute' },
          cwd: { type: 'string', required: false, description: 'Working directory' }
        }
      },
      clear: {
        description: 'Clear terminal output',
        parameters: {}
      }
    }
  },

  files: {
    description: 'File Manager - manage files and folders',
    actions: {
      navigate: {
        description: 'Navigate to folder',
        parameters: {
          path: { type: 'string', required: true, description: 'Folder path' }
        }
      },
      createFolder: {
        description: 'Create new folder',
        parameters: {
          name: { type: 'string', required: true, description: 'Folder name' },
          path: { type: 'string', required: false, description: 'Parent path' }
        }
      },
      upload: {
        description: 'Upload files',
        parameters: {
          files: { type: 'array', required: true, description: 'Files to upload' },
          destination: { type: 'string', required: false, description: 'Target folder' }
        }
      },
      delete: {
        description: 'Delete files or folders',
        parameters: {
          paths: { type: 'array', required: true, description: 'Paths to delete' }
        }
      }
    }
  },

  // ── System & Settings ───────────────────────────────────────────────────────
  system: {
    description: 'System controls - settings, themes, notifications',
    actions: {
      setTheme: {
        description: 'Change UI theme',
        parameters: {
          theme: { type: 'string', required: true, enum: ['dark', 'light', 'system', 'cyber', 'neon'], description: 'Theme name' }
        }
      },
      setWallpaper: {
        description: 'Change desktop wallpaper',
        parameters: {
          image: { type: 'string', required: true, description: 'Image URL or preset name' }
        }
      },
      showNotification: {
        description: 'Show system notification',
        parameters: {
          title: { type: 'string', required: true, description: 'Notification title' },
          message: { type: 'string', required: true, description: 'Notification body' },
          type: { type: 'string', required: false, enum: ['info', 'success', 'warning', 'error'], default: 'info' }
        }
      },
      getSystemInfo: {
        description: 'Get system status and info',
        parameters: {}
      }
    }
  },

  // ── User Guidance ───────────────────────────────────────────────────────────
  guide: {
    description: 'Guide the user through features and workflows',
    actions: {
      startTour: {
        description: 'Start a guided tour of a feature',
        parameters: {
          tourId: { type: 'string', required: true, description: 'Tour identifier' },
          steps: { type: 'array', required: false, description: 'Custom tour steps' }
        }
      },
      showTip: {
        description: 'Show a contextual tip',
        parameters: {
          title: { type: 'string', required: true, description: 'Tip title' },
          content: { type: 'string', required: true, description: 'Tip content' },
          position: { type: 'string', required: false, enum: ['top', 'bottom', 'left', 'right'], default: 'bottom' }
        }
      },
      explainFeature: {
        description: 'Explain what a feature does',
        parameters: {
          feature: { type: 'string', required: true, description: 'Feature name' },
          detail: { type: 'string', required: false, enum: ['brief', 'full'], default: 'brief' }
        }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WINDOW TYPE DEFINITIONS - For AI to understand available apps
// ═══════════════════════════════════════════════════════════════════════════════

export const WINDOW_TYPES = {
  'ide': {
    name: 'Code IDE',
    description: 'Full-featured code editor with IntelliSense, debugging, and project management',
    icon: 'code',
    category: 'development',
    keywords: ['code', 'ide', 'editor', 'programming', 'develop', 'debug', 'build'],
    defaultProps: {}
  },
  'website-builder': {
    name: 'Website Builder',
    description: 'Visual website builder with drag-and-drop and AI generation',
    icon: 'layout',
    category: 'development',
    keywords: ['website', 'web', 'site', 'builder', 'design', 'page'],
    defaultProps: {}
  },
  'vibe-coding': {
    name: 'Vibe Coding',
    description: 'AI pair programming environment for rapid development',
    icon: 'zap',
    category: 'development',
    keywords: ['vibe', 'coding', 'pair', 'ai coding', 'rapid'],
    defaultProps: {}
  },
  'browser': {
    name: 'AI Browser',
    description: 'Web browser with AI assistance and smart scraping',
    icon: 'globe',
    category: 'productivity',
    keywords: ['browser', 'web', 'internet', 'search', 'surf'],
    defaultProps: {}
  },
  'vertex': {
    name: 'Vertex AI',
    description: 'Generate images and videos with Google Vertex AI',
    icon: 'image',
    category: 'creative',
    keywords: ['image', 'generate', 'ai art', 'picture', 'photo', 'video'],
    defaultProps: {}
  },
  'pixai': {
    name: 'PixAI Art',
    description: 'AI pixel art and image generation studio',
    icon: 'palette',
    category: 'creative',
    keywords: ['pixel', 'art', 'pixai', 'sprite', 'game art'],
    defaultProps: {}
  },
  'art-studio': {
    name: 'Art Studio',
    description: 'Digital drawing and painting with AI assistance',
    icon: 'brush',
    category: 'creative',
    keywords: ['draw', 'paint', 'sketch', 'art', 'canvas'],
    defaultProps: {}
  },
  'chat': {
    name: 'AI Chat',
    description: 'Chat with multiple AI models (Gemini, Claude, GPT, etc.)',
    icon: 'message-square',
    category: 'ai',
    keywords: ['chat', 'talk', 'ai', 'conversation', 'ask'],
    defaultProps: {}
  },
  'voice': {
    name: 'Voice Chat',
    description: 'Real-time voice conversations with AI',
    icon: 'mic',
    category: 'ai',
    keywords: ['voice', 'talk', 'speak', 'call', 'audio'],
    defaultProps: {}
  },
  'voice-studio': {
    name: 'Voice Studio',
    description: 'Professional voice editing and AI voice effects',
    icon: 'mic',
    category: 'creative',
    keywords: ['voice', 'audio', 'record', 'edit', 'podcast'],
    defaultProps: {}
  },
  'composer': {
    name: 'Music Composer',
    description: 'Create music with AI and digital instruments',
    icon: 'music',
    category: 'creative',
    keywords: ['music', 'compose', 'beat', 'song', 'audio', 'melody'],
    defaultProps: {}
  },
  'terminal': {
    name: 'Terminal',
    description: 'Command line interface for power users',
    icon: 'terminal',
    category: 'system',
    keywords: ['terminal', 'command', 'shell', 'cli', 'bash'],
    defaultProps: {}
  },
  'files': {
    name: 'Files',
    description: 'File manager with cloud sync',
    icon: 'folder',
    category: 'system',
    keywords: ['files', 'folder', 'manager', 'explorer', 'documents'],
    defaultProps: {}
  },
  'literature-ide': {
    name: 'Literature IDE',
    description: 'Creative writing environment for novels and stories',
    icon: 'book',
    category: 'creative',
    keywords: ['write', 'novel', 'story', 'book', 'literature', 'author'],
    defaultProps: {}
  },
  'games-arena': {
    name: 'Games Arena',
    description: 'Play games and compete in challenges',
    icon: 'gamepad',
    category: 'entertainment',
    keywords: ['game', 'play', 'fun', 'arcade', 'chess'],
    defaultProps: {}
  },
  'aetherium-tcg': {
    name: 'Aetherium TCG',
    description: 'Trading card game with deck builder',
    icon: 'layers',
    category: 'entertainment',
    keywords: ['card', 'tcg', 'deck', 'game', 'collectible'],
    defaultProps: {}
  },
  'comic-creator': {
    name: 'Comic Creator',
    description: 'Create comic strips and graphic novels',
    icon: 'square',
    category: 'creative',
    keywords: ['comic', 'cartoon', 'strip', 'graphic novel'],
    defaultProps: {}
  },
  'avatar-builder': {
    name: 'Avatar Builder',
    description: 'Create and customize 3D avatars',
    icon: 'user',
    category: 'creative',
    keywords: ['avatar', 'character', '3d', 'model', 'persona'],
    defaultProps: {}
  },
  'dojo': {
    name: 'Dojo',
    description: 'Game development environment for Unreal, Unity, Godot',
    icon: 'sword',
    category: 'development',
    keywords: ['game dev', 'unity', 'unreal', 'godot', 'gamedev'],
    defaultProps: {}
  },
  'appstore': {
    name: 'Marketplace',
    description: 'App store and template marketplace',
    icon: 'shopping-bag',
    category: 'system',
    keywords: ['store', 'market', 'apps', 'templates', 'buy'],
    defaultProps: {}
  },
  'profile': {
    name: 'Profile',
    description: 'User profile and account settings',
    icon: 'user-circle',
    category: 'system',
    keywords: ['profile', 'account', 'settings', 'user'],
    defaultProps: {}
  },
  'billing': {
    name: 'Billing',
    description: 'Subscription and payment management',
    icon: 'credit-card',
    category: 'system',
    keywords: ['billing', 'payment', 'subscription', 'plan', 'credits'],
    defaultProps: {}
  },
  'nova-concierge': {
    name: 'Concierge',
    description: 'AI-powered business and domain manager',
    icon: 'bot',
    category: 'ai',
    keywords: ['concierge', 'business', 'domain', 'nova', 'operator'],
    defaultProps: {}
  },
  'ai-companion': {
    name: 'Nova AI Companion',
    description: 'Persistent AI companion with memory',
    icon: 'heart',
    category: 'ai',
    keywords: ['companion', 'friend', 'nova', 'ai friend'],
    defaultProps: {}
  },
  'business-operator': {
    name: 'Business Operator',
    description: 'Automated business operations and dropshipping',
    icon: 'briefcase',
    category: 'productivity',
    keywords: ['business', 'operator', 'dropship', 'automation', 'store'],
    defaultProps: {}
  },
  'tax-filing': {
    name: 'Tax Filing',
    description: 'Tax preparation and filing assistance',
    icon: 'file-text',
    category: 'productivity',
    keywords: ['tax', 'filing', 'irs', 'taxes', 'return'],
    defaultProps: {}
  },
  'psychometrics': {
    name: 'Psychometrics',
    description: 'Personality assessments and analytics',
    icon: 'brain',
    category: 'productivity',
    keywords: ['psychometric', 'personality', 'assessment', 'quiz'],
    defaultProps: {}
  },
  'challenges': {
    name: 'Challenges',
    description: 'Coding challenges and skill building',
    icon: 'trophy',
    category: 'entertainment',
    keywords: ['challenge', 'coding', 'practice', 'skill', 'learn'],
    defaultProps: {}
  },
  'live-broadcast': {
    name: 'Live Broadcast',
    description: 'Stream to multiple platforms',
    icon: 'radio',
    category: 'creative',
    keywords: ['stream', 'broadcast', 'live', 'twitch', 'youtube'],
    defaultProps: {}
  },
  'collab-writing': {
    name: 'Collaborative Writing',
    description: 'Write together with others in real-time',
    icon: 'users',
    category: 'creative',
    keywords: ['collab', 'write', 'together', 'shared', 'document'],
    defaultProps: {}
  },
  'constructor': {
    name: 'Constructor',
    description: 'Visual component and UI builder',
    icon: 'box',
    category: 'development',
    keywords: ['constructor', 'builder', 'ui', 'component', 'visual'],
    defaultProps: {}
  },
  'creator-studio': {
    name: 'Creator Studio',
    description: 'Project creation and management hub',
    icon: 'sparkles',
    category: 'productivity',
    keywords: ['creator', 'studio', 'project', 'create'],
    defaultProps: {}
  },
  'bg-remover': {
    name: 'Background Remover',
    description: 'AI-powered background removal',
    icon: 'scissors',
    category: 'creative',
    keywords: ['background', 'remove', 'transparent', 'cutout'],
    defaultProps: {}
  },
  'media': {
    name: 'Media Player',
    description: 'Play audio and video files',
    icon: 'play',
    category: 'entertainment',
    keywords: ['media', 'video', 'audio', 'play', 'watch'],
    defaultProps: {}
  },
  'media-library': {
    name: 'Media Library',
    description: 'Organize and manage media files',
    icon: 'film',
    category: 'system',
    keywords: ['media', 'library', 'files', 'videos', 'photos'],
    defaultProps: {}
  },
  'notifications': {
    name: 'Notifications',
    description: 'System notifications and alerts',
    icon: 'bell',
    category: 'system',
    keywords: ['notifications', 'alerts', 'messages'],
    defaultProps: {}
  },
  'settings': {
    name: 'Settings',
    description: 'System configuration and preferences',
    icon: 'settings',
    category: 'system',
    keywords: ['settings', 'config', 'preferences', 'options'],
    defaultProps: {}
  },
  'secrets': {
    name: 'Secrets Manager',
    description: 'Secure API key and credential storage',
    icon: 'lock',
    category: 'system',
    keywords: ['secrets', 'api keys', 'credentials', 'passwords'],
    defaultProps: {}
  },
  'git': {
    name: 'Git',
    description: 'Version control and repository management',
    icon: 'git-branch',
    category: 'development',
    keywords: ['git', 'version control', 'repository', 'commit'],
    defaultProps: {}
  },
  'wallet': {
    name: 'Crypto Wallet',
    description: 'Cryptocurrency wallet and transactions',
    icon: 'wallet',
    category: 'productivity',
    keywords: ['crypto', 'wallet', 'bitcoin', 'ethereum', 'web3'],
    defaultProps: {}
  },
  'social': {
    name: 'Social Network',
    description: 'Connect with other creators',
    icon: 'users',
    category: 'social',
    keywords: ['social', 'network', 'friends', 'community'],
    defaultProps: {}
  },
  'inventory': {
    name: 'Inventory',
    description: 'Asset and resource management',
    icon: 'package',
    category: 'productivity',
    keywords: ['inventory', 'assets', 'resources', 'items'],
    defaultProps: {}
  },
  'weather': {
    name: 'Weather',
    description: 'Weather forecasts and alerts',
    icon: 'cloud',
    category: 'utility',
    keywords: ['weather', 'forecast', 'rain', 'sun'],
    defaultProps: {}
  },
  'calculator': {
    name: 'Calculator',
    description: 'Scientific calculator',
    icon: 'calculator',
    category: 'utility',
    keywords: ['calculator', 'math', 'calculate', 'compute'],
    defaultProps: {}
  },
  'gilded-cage': {
    name: 'The Gilded Cage',
    description: 'AI relationship simulation game',
    icon: 'heart-crack',
    category: 'entertainment',
    keywords: ['game', 'gilded cage', 'relationship', 'simulation'],
    defaultProps: {}
  },
  'imagen': {
    name: 'Imagen',
    description: 'Google Imagen image generation',
    icon: 'image-plus',
    category: 'creative',
    keywords: ['imagen', 'google', 'image', 'generate'],
    defaultProps: {}
  },
  'art-gallery': {
    name: 'Art Gallery',
    description: 'Browse and showcase artwork',
    icon: 'frame',
    category: 'creative',
    keywords: ['gallery', 'art', 'showcase', 'portfolio', 'browse'],
    defaultProps: {}
  },
  'avatar-gallery': {
    name: 'Avatar Gallery',
    description: 'Browse and manage avatars',
    icon: 'users',
    category: 'creative',
    keywords: ['avatar', 'gallery', 'characters', 'browse'],
    defaultProps: {}
  },
  'clothing-creator': {
    name: 'Clothing Creator',
    description: 'Design custom clothing and fashion',
    icon: 'shirt',
    category: 'creative',
    keywords: ['clothing', 'fashion', 'design', 'apparel', 'wear'],
    defaultProps: {}
  },
  'outfit-generator': {
    name: 'Outfit Generator',
    description: 'AI outfit recommendations',
    icon: 'sparkles',
    category: 'creative',
    keywords: ['outfit', 'fashion', 'style', 'clothes', 'wear'],
    defaultProps: {}
  },
  'outfit-manager': {
    name: 'Outfit Manager',
    description: 'Wardrobe and outfit management',
    icon: 'shirt',
    category: 'creative',
    keywords: ['outfit', 'manager', 'wardrobe', 'clothes'],
    defaultProps: {}
  },
  'business-card': {
    name: 'Business Card Designer',
    description: 'Create professional business cards',
    icon: 'id-card',
    category: 'productivity',
    keywords: ['business card', 'card', 'design', 'professional'],
    defaultProps: {}
  },
  'poems': {
    name: 'Poems Creator',
    description: 'AI poetry generation and editing',
    icon: 'feather',
    category: 'creative',
    keywords: ['poem', 'poetry', 'write', 'verse', 'creative'],
    defaultProps: {}
  },
  'script-fusion': {
    name: 'Script Fusion',
    description: 'Script writing and automation',
    icon: 'file-code',
    category: 'development',
    keywords: ['script', 'automation', 'code', 'fusion'],
    defaultProps: {}
  },
  'writing-library': {
    name: 'Writing Library',
    description: 'Organize writing projects',
    icon: 'library',
    category: 'creative',
    keywords: ['writing', 'library', 'documents', 'projects'],
    defaultProps: {}
  },
  'workspace': {
    name: 'Workspace',
    description: 'Project workspace management',
    icon: 'layout-template',
    category: 'productivity',
    keywords: ['workspace', 'project', 'organization', 'files'],
    defaultProps: {}
  },
  'personalization': {
    name: 'Personalization',
    description: 'Customize your OS experience',
    icon: 'palette',
    category: 'system',
    keywords: ['personalize', 'customize', 'theme', 'appearance'],
    defaultProps: {}
  },
  'admin-panel': {
    name: 'Admin Panel',
    description: 'System administration dashboard',
    icon: 'shield',
    category: 'system',
    keywords: ['admin', 'dashboard', 'system', 'manage'],
    defaultProps: {}
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTICS ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class SemanticsEngine {
  constructor() {
    this._kernel = null;
    this._windowManager = null;
    this._ipc = null;
    this._actionHandlers = new Map();
    this._sessionContext = new Map();
    this._guidedTour = null;
    
    // Bind all semantic actions
    this._registerDefaultHandlers();
  }

  init(kernel) {
    this._kernel = kernel;
    this._windowManager = kernel.windowManager;
    this._ipc = kernel.ipc;
    
    // Update registry with dynamic window types
    this._updateWindowTypeEnum();
    
    console.log('[SemanticsEngine] Initialized with', Object.keys(WINDOW_TYPES).length, 'window types');
  }

  // ── Registration ────────────────────────────────────────────────────────────

  _updateWindowTypeEnum() {
    // Update the enum in SEMANTIC_REGISTRY.window.actions.open.parameters.type.enum
    const windowTypes = Object.keys(WINDOW_TYPES);
    SEMANTIC_REGISTRY.window.actions.open.parameters.type.enum = windowTypes;
  }

  _registerDefaultHandlers() {
    // Window actions
    this.registerHandler('window', 'open', this._handleWindowOpen.bind(this));
    this.registerHandler('window', 'close', this._handleWindowClose.bind(this));
    this.registerHandler('window', 'closeAll', this._handleWindowCloseAll.bind(this));
    this.registerHandler('window', 'focus', this._handleWindowFocus.bind(this));
    this.registerHandler('window', 'minimize', this._handleWindowMinimize.bind(this));
    this.registerHandler('window', 'maximize', this._handleWindowMaximize.bind(this));
    this.registerHandler('window', 'restore', this._handleWindowRestore.bind(this));
    this.registerHandler('window', 'list', this._handleWindowList.bind(this));

    // Navigation actions
    this.registerHandler('navigate', 'toApp', this._handleNavigateToApp.bind(this));
    this.registerHandler('navigate', 'highlight', this._handleHighlight.bind(this));

    // System actions
    this.registerHandler('system', 'showNotification', this._handleShowNotification.bind(this));
    this.registerHandler('system', 'setTheme', this._handleSetTheme.bind(this));
    this.registerHandler('system', 'getSystemInfo', this._handleGetSystemInfo.bind(this));

    // Guide actions
    this.registerHandler('guide', 'startTour', this._handleStartTour.bind(this));
    this.registerHandler('guide', 'showTip', this._handleShowTip.bind(this));
    this.registerHandler('guide', 'explainFeature', this._handleExplainFeature.bind(this));
  }

  registerHandler(domain, action, handler) {
    const key = `${domain}:${action}`;
    this._actionHandlers.set(key, handler);
  }

  // ── Intent Processing ───────────────────────────────────────────────────────

  /**
   * Process a natural language intent and execute the appropriate action
   * @param {string} intent - Natural language command
   * @param {object} context - Additional context
   * @returns {Promise<object>} Execution result
   */
  async processIntent(intent, context = {}) {
    const sessionId = context.sessionId || generateId();
    
    // Parse the intent
    const parsed = this._parseIntent(intent);
    
    // Build function call from intent
    const functionCall = this._buildFunctionCall(parsed);
    
    if (!functionCall) {
      return {
        success: false,
        error: 'Could not understand intent',
        intent,
        suggestion: this._suggestSimilar(intent)
      };
    }

    // Execute the function call
    return this.executeFunction(functionCall.domain, functionCall.action, {
      ...functionCall.parameters,
      _sessionId: sessionId,
      _context: context
    });
  }

  /**
   * Execute a function call directly
   * @param {string} domain - Function domain (e.g., 'window', 'ide')
   * @param {string} action - Action name
   * @param {object} parameters - Action parameters
   */
  async executeFunction(domain, action, parameters = {}) {
    const key = `${domain}:${action}`;
    const handler = this._actionHandlers.get(key);

    if (!handler) {
      console.error(`[SemanticsEngine] No handler for ${key}`);
      return {
        success: false,
        error: `Unknown action: ${domain}.${action}`
      };
    }

    try {
      const result = await handler(parameters);
      
      // Emit event for UI updates
      this._ipc?.emit('semantics:action:completed', {
        domain,
        action,
        parameters,
        result,
        timestamp: Date.now()
      });

      return {
        success: true,
        domain,
        action,
        result
      };
    } catch (error) {
      console.error(`[SemanticsEngine] Error executing ${key}:`, error);
      return {
        success: false,
        domain,
        action,
        error: error.message
      };
    }
  }

  // ── Intent Parsing ──────────────────────────────────────────────────────────

  _parseIntent(intent) {
    const lower = intent.toLowerCase().trim();
    
    // Extract action type
    let actionType = 'unknown';
    let target = null;
    let parameters = {};

    // Window operations
    if (/\b(open|launch|start)\b/.test(lower)) {
      actionType = 'open';
      target = this._extractWindowType(lower);
    } else if (/\b(close|exit|quit)\b/.test(lower)) {
      actionType = 'close';
      if (/\b(all|everything)\b/.test(lower)) {
        actionType = 'closeAll';
      } else {
        target = this._extractWindowType(lower);
      }
    } else if (/\b(focus|switch to|go to|bring)\b/.test(lower)) {
      actionType = 'focus';
      target = this._extractWindowType(lower);
    } else if (/\b(minimize|hide)\b/.test(lower)) {
      actionType = 'minimize';
      target = this._extractWindowType(lower);
    } else if (/\b(maximize|fullscreen)\b/.test(lower)) {
      actionType = 'maximize';
      target = this._extractWindowType(lower);
    }

    // Generate operations
    else if (/\b(generate|create|make)\b.*\b(image|picture|photo)\b/.test(lower)) {
      actionType = 'generateImage';
      parameters.prompt = intent.replace(/\b(generate|create|make)\b.*\b(image|picture|photo)\b/i, '').trim();
    } else if (/\b(generate|create|make)\b.*\b(video)\b/.test(lower)) {
      actionType = 'generateVideo';
      parameters.prompt = intent.replace(/\b(generate|create|make)\b.*\b(video)\b/i, '').trim();
    }

    // Navigation
    else if (/\b(navigate|go to|visit|browse)\b/.test(lower)) {
      actionType = 'navigate';
      const urlMatch = lower.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[\w-]+\.(com|org|net|io|dev|ai))/);
      if (urlMatch) {
        parameters.url = urlMatch[0];
      }
    }

    // Help/Guidance
    else if (/\b(help|how do i|how to|guide|show me|tutorial)\b/.test(lower)) {
      actionType = 'guide';
      target = this._extractWindowType(lower);
    }

    // System
    else if (/\b(theme|change theme|set theme|dark mode|light mode)\b/.test(lower)) {
      actionType = 'setTheme';
      if (/dark/.test(lower)) parameters.theme = 'dark';
      else if (/light/.test(lower)) parameters.theme = 'light';
      else if (/cyber/.test(lower)) parameters.theme = 'cyber';
      else if (/neon/.test(lower)) parameters.theme = 'neon';
    }

    return {
      original: intent,
      actionType,
      target,
      parameters
    };
  }

  _extractWindowType(text) {
    const lower = text.toLowerCase();
    
    for (const [type, config] of Object.entries(WINDOW_TYPES)) {
      // Check name match
      if (lower.includes(config.name.toLowerCase())) {
        return type;
      }
      // Check keywords
      for (const keyword of config.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return type;
        }
      }
    }
    
    return null;
  }

  _buildFunctionCall(parsed) {
    const { actionType, target, parameters } = parsed;

    switch (actionType) {
      case 'open':
        if (!target) return null;
        return {
          domain: 'window',
          action: 'open',
          parameters: { type: target, ...parameters }
        };
      
      case 'close':
        if (!target) return null;
        return {
          domain: 'window',
          action: 'close',
          parameters: { type: target, ...parameters }
        };
      
      case 'closeAll':
        return {
          domain: 'window',
          action: 'closeAll',
          parameters: {}
        };
      
      case 'focus':
        if (!target) return null;
        return {
          domain: 'navigate',
          action: 'toApp',
          parameters: { appType: target, ...parameters }
        };
      
      case 'generateImage':
        return {
          domain: 'vertex',
          action: 'generateImage',
          parameters
        };
      
      case 'generateVideo':
        return {
          domain: 'vertex',
          action: 'generateVideo',
          parameters
        };
      
      case 'setTheme':
        return {
          domain: 'system',
          action: 'setTheme',
          parameters
        };
      
      case 'guide':
        if (target) {
          return {
            domain: 'guide',
            action: 'explainFeature',
            parameters: { feature: target }
          };
        }
        return null;
      
      default:
        return null;
    }
  }

  _suggestSimilar(intent) {
    // Simple suggestion based on keyword matching
    const suggestions = [];
    const lower = intent.toLowerCase();
    
    for (const [type, config] of Object.entries(WINDOW_TYPES)) {
      const matchScore = config.keywords.filter(kw => lower.includes(kw)).length;
      if (matchScore > 0) {
        suggestions.push({ type, name: config.name, score: matchScore });
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.name);
  }

  // ── Function Call Schema for AI ─────────────────────────────────────────────

  /**
   * Get function definitions for AI function calling
   * @returns {array} Function definitions in OpenAI/Gemini format
   */
  getFunctionDefinitions() {
    const definitions = [];

    for (const [domain, config] of Object.entries(SEMANTIC_REGISTRY)) {
      for (const [action, actionConfig] of Object.entries(config.actions)) {
        const properties = {};
        const required = [];

        for (const [paramName, paramConfig] of Object.entries(actionConfig.parameters)) {
          properties[paramName] = {
            type: paramConfig.type,
            description: paramConfig.description,
            enum: paramConfig.enum
          };
          if (paramConfig.required) {
            required.push(paramName);
          }
        }

        definitions.push({
          name: `${domain}_${action}`,
          description: `${config.description} - ${actionConfig.description}`,
          parameters: {
            type: 'object',
            properties,
            required
          }
        });
      }
    }

    return definitions;
  }

  /**
   * Get available window types for AI context
   * @returns {object} Window type descriptions
   */
  getAvailableApps() {
    return Object.entries(WINDOW_TYPES).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      category: config.category,
      keywords: config.keywords
    }));
  }

  /**
   * Get current system state for AI context
   * @returns {object} System state
   */
  getSystemState() {
    return {
      openWindows: this._windowManager?.getAll().map(w => ({
        id: w.id,
        type: w.type,
        title: w.title,
        state: w.state
      })) || [],
      timestamp: Date.now()
    };
  }

  // ── Action Handlers ─────────────────────────────────────────────────────────

  async _handleWindowOpen(params) {
    const { type, title, props } = params;
    const windowConfig = WINDOW_TYPES[type];
    
    if (!windowConfig) {
      throw new Error(`Unknown window type: ${type}`);
    }

    const windowTitle = title || windowConfig.name;
    const windowId = this._windowManager.open(type, windowTitle, props || windowConfig.defaultProps);
    
    // Show notification
    this._ipc?.emit('notification', {
      title: 'Window Opened',
      message: `${windowTitle} is now open`,
      type: 'info'
    });

    return { windowId, type, title: windowTitle };
  }

  async _handleWindowClose(params) {
    const { windowId, type } = params;

    if (windowId) {
      this._windowManager.close(windowId);
      return { closed: windowId };
    }

    if (type) {
      const windows = this._windowManager.getByType(type);
      windows.forEach(w => this._windowManager.close(w.id));
      return { closed: windows.map(w => w.id) };
    }

    throw new Error('Must specify windowId or type to close');
  }

  async _handleWindowCloseAll() {
    const count = this._windowManager.getAll().length;
    this._windowManager.closeAll();
    return { closedCount: count };
  }

  async _handleWindowFocus(params) {
    const { windowId } = params;
    this._windowManager.focus(windowId);
    return { focused: windowId };
  }

  async _handleWindowMinimize(params) {
    const { windowId } = params;
    this._windowManager.minimize(windowId);
    return { minimized: windowId };
  }

  async _handleWindowMaximize(params) {
    const { windowId } = params;
    this._windowManager.maximize(windowId);
    return { maximized: windowId };
  }

  async _handleWindowRestore(params) {
    const { windowId } = params;
    this._windowManager.restore(windowId);
    return { restored: windowId };
  }

  async _handleWindowList() {
    return {
      windows: this._windowManager.getAll()
    };
  }

  async _handleNavigateToApp(params) {
    const { appType, context, highlight } = params;
    
    // Check if window is already open
    const existing = this._windowManager.getByType(appType);
    if (existing.length > 0) {
      this._windowManager.focus(existing[0].id);
    } else {
      this._handleWindowOpen({ type: appType });
    }

    // Emit navigation event for potential tour/highlight
    this._ipc?.emit('semantics:navigate', {
      appType,
      context,
      highlightElement: highlight
    });

    return { navigated: appType, context };
  }

  async _handleHighlight(params) {
    const { selector, message, duration } = params;
    
    this._ipc?.emit('semantics:highlight', {
      selector,
      message,
      duration: duration || 5000
    });

    return { highlighted: selector };
  }

  async _handleShowNotification(params) {
    const { title, message, type } = params;
    
    this._ipc?.emit('notification', {
      title,
      message,
      type: type || 'info'
    });

    return { shown: true };
  }

  async _handleSetTheme(params) {
    const { theme } = params;
    
    this._ipc?.emit('settings:theme', { theme });
    
    return { theme };
  }

  async _handleGetSystemInfo() {
    return {
      windows: this._windowManager.getAll().length,
      uptime: Date.now(),
      version: '2.0.0'
    };
  }

  async _handleStartTour(params) {
    const { tourId, steps } = params;
    
    this._guidedTour = {
      id: tourId,
      steps: steps || [],
      currentStep: 0
    };

    this._ipc?.emit('semantics:tour:start', this._guidedTour);

    return { tour: this._guidedTour };
  }

  async _handleShowTip(params) {
    const { title, content, position } = params;
    
    this._ipc?.emit('semantics:tip', {
      title,
      content,
      position: position || 'bottom'
    });

    return { shown: true };
  }

  async _handleExplainFeature(params) {
    const { feature, detail } = params;
    
    const windowConfig = WINDOW_TYPES[feature];
    if (!windowConfig) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    const explanation = detail === 'full' 
      ? `${windowConfig.name}: ${windowConfig.description}. Keywords: ${windowConfig.keywords.join(', ')}.`
      : windowConfig.description;

    return {
      feature,
      name: windowConfig.name,
      explanation,
      category: windowConfig.category
    };
  }

  // ── Session Management ──────────────────────────────────────────────────────

  startSession(userId) {
    const sessionId = generateId();
    this._sessionContext.set(sessionId, {
      userId,
      startedAt: Date.now(),
      history: []
    });
    return sessionId;
  }

  endSession(sessionId) {
    this._sessionContext.delete(sessionId);
  }

  getSession(sessionId) {
    return this._sessionContext.get(sessionId);
  }

  addToSessionHistory(sessionId, action, result) {
    const session = this._sessionContext.get(sessionId);
    if (session) {
      session.history.push({
        action,
        result,
        timestamp: Date.now()
      });
    }
  }
}

// Singleton instance
let _instance = null;

export function getSemanticsEngine() {
  if (!_instance) {
    _instance = new SemanticsEngine();
  }
  return _instance;
}

export { SemanticsEngine, SEMANTIC_REGISTRY };
export default getSemanticsEngine();
