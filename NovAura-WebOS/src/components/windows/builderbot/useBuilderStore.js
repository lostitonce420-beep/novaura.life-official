import { create } from 'zustand';

// ── Storage keys ────────────────────────────────────────────
const STORAGE_PROJECT = 'novaura_builder_project';
const STORAGE_PERSONAS = 'novaura_builder_personas';
const STORAGE_RULES = 'novaura_builder_rules';
const STORAGE_AI_CONFIG = 'novaura_builder_ai_config';
const STORAGE_PROMPT_LIBRARY = 'novaura_prompt_library';
const STORAGE_AURA_HISTORY = 'novaura_aura_history';

// ── Helpers ─────────────────────────────────────────────────
let _nextId = Date.now();
const uid = () => `f${_nextId++}`;

function findNode(tree, id) {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

function findParent(tree, id) {
  if (tree.children) {
    for (const child of tree.children) {
      if (child.id === id) return tree;
      const found = findParent(child, id);
      if (found) return found;
    }
  }
  return null;
}

function removeNode(tree, id) {
  if (!tree.children) return tree;
  return {
    ...tree,
    children: tree.children
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  };
}

function updateNode(tree, id, updater) {
  if (tree.id === id) return updater(tree);
  if (tree.children) {
    return { ...tree, children: tree.children.map((c) => updateNode(c, id, updater)) };
  }
  return tree;
}

function flattenFiles(tree, path = '') {
  const results = [];
  const fullPath = path ? `${path}/${tree.name}` : tree.name;
  if (tree.type === 'file') results.push({ ...tree, path: fullPath });
  if (tree.children) tree.children.forEach((c) => results.push(...flattenFiles(c, fullPath)));
  return results;
}

function detectLang(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
    rs: 'rust', go: 'go', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
    rb: 'ruby', php: 'php', sql: 'sql', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', svg: 'xml', sh: 'shell', bash: 'shell', toml: 'toml',
    lua: 'lua', dart: 'dart', swift: 'swift', kt: 'kotlin', vue: 'html',
    scss: 'scss', less: 'less', graphql: 'graphql', env: 'plaintext',
  };
  return map[ext] || 'plaintext';
}

// ── Default project ─────────────────────────────────────────
function defaultProject() {
  return {
    name: 'Untitled Project',
    tree: {
      id: 'root', name: 'project', type: 'folder', expanded: true,
      children: [
        { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div id="app">\n    <h1>Hello Cybeni</h1>\n    <p>Start building something amazing.</p>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>' },
        { id: uid(), name: 'style.css', type: 'file', content: '* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  background: #0a0a0f;\n  color: #e0e0e0;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n#app {\n  text-align: center;\n}\n\nh1 {\n  font-size: 2.5rem;\n  background: linear-gradient(135deg, #00f0ff, #8b5cf6);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  margin-bottom: 0.5rem;\n}\n\np { color: #888; }' },
        { id: uid(), name: 'main.js', type: 'file', content: '// Cybeni — main.js\n\nconsole.log(\'App initialized\');\n\ndocument.addEventListener(\'DOMContentLoaded\', () => {\n  const app = document.getElementById(\'app\');\n  console.log(\'DOM ready, app element:\', app);\n});\n' },
      ],
    },
  };
}

// ── Default personas ────────────────────────────────────────
function defaultPersonas() {
  return [
    {
      id: 'architect',
      name: 'Architect',
      icon: '🏗️',
      systemPrompt: 'You are a senior software architect. Focus on clean architecture, scalability, and best practices. When generating code, prefer modular patterns, separation of concerns, and clear abstractions. Explain your architectural decisions.',
      temperature: 0.4,
      active: false,
    },
    {
      id: 'fullstack',
      name: 'Full-Stack Dev',
      icon: '⚡',
      systemPrompt: 'You are an expert full-stack developer. Write production-ready code with proper error handling, security, and performance. Use modern frameworks and patterns. Include inline comments for complex logic.',
      temperature: 0.5,
      active: true,
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      icon: '🎨',
      systemPrompt: 'You are a creative frontend designer and developer. Focus on beautiful, modern UI/UX with smooth animations, rich gradients, and polished aesthetics. Use CSS custom properties, flexbox/grid, and modern web APIs. Make everything look stunning.',
      temperature: 0.7,
      active: false,
    },
    {
      id: 'debugger',
      name: 'Debugger',
      icon: '🔍',
      systemPrompt: 'You are a debugging specialist. Analyze code for bugs, performance issues, security vulnerabilities, and anti-patterns. Explain the root cause, provide a fix, and suggest preventive measures. Be thorough and systematic.',
      temperature: 0.2,
      active: false,
    },
    {
      id: 'rapid',
      name: 'Rapid Prototyper',
      icon: '🚀',
      systemPrompt: 'You are a rapid prototyper. Build functional prototypes as fast as possible. Favor inline styles and simple patterns over perfect architecture. Get things working first, optimize later. Output complete, runnable code.',
      temperature: 0.8,
      active: false,
    },
  ];
}

// ── Default rules ───────────────────────────────────────────
function defaultRules() {
  return [
    { id: 'r1', name: 'Code Style', enabled: true, rule: 'Use 2-space indentation. Prefer const over let. Use arrow functions for callbacks. Add semicolons.' },
    { id: 'r2', name: 'Security', enabled: true, rule: 'Never use eval(). Sanitize all user inputs. Use parameterized queries for any database operations. Escape HTML output.' },
    { id: 'r3', name: 'Accessibility', enabled: false, rule: 'Include proper ARIA labels, semantic HTML elements, keyboard navigation support, and sufficient color contrast.' },
    { id: 'r4', name: 'Performance', enabled: false, rule: 'Lazy load non-critical resources. Minimize DOM manipulation. Use requestAnimationFrame for animations. Debounce event handlers.' },
  ];
}

// ── Default AI config ───────────────────────────────────────
function defaultAIConfig() {
  return {
    mode: 'coder',
    temperature: 0.5,
    restrictionLevel: 'moderate',
    traits: ['autoFix'],
    filters: { explicit: true, violence: true, security: true, copyright: false },
  };
}

function loadAIConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_AI_CONFIG);
    if (raw) return { ...defaultAIConfig(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultAIConfig();
}

function loadPromptLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_PROMPT_LIBRARY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function loadAuraHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_AURA_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

// ── Persistence ─────────────────────────────────────────────
function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECT);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultProject();
}

function loadPersonas() {
  try {
    const raw = localStorage.getItem(STORAGE_PERSONAS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultPersonas();
}

function loadRules() {
  try {
    const raw = localStorage.getItem(STORAGE_RULES);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultRules();
}

// ── Store ───────────────────────────────────────────────────
const useBuilderStore = create((set, get) => {
  const project = loadProject();
  const allFiles = flattenFiles(project.tree);
  const firstFile = allFiles[0];

  return {
    // ── Project state ──
    projectName: project.name,
    tree: project.tree,
    openTabs: firstFile ? [firstFile.id] : [],
    activeTab: firstFile?.id || null,
    dirty: {},

    // ── AI state ──
    personas: loadPersonas(),
    rules: loadRules(),
    aiConfig: loadAIConfig(),
    preprompt: '',
    chatHistory: [],
    aiLoading: false,
    
    // ── Aura Memory & Prompt Library ──
    auraHistory: loadAuraHistory(),
    promptLibrary: loadPromptLibrary(),

    // ── Terminal state ──
    terminalLines: [{ type: 'system', text: 'Cybeni Terminal v1.0 — Type JavaScript or use AI commands' }],

    // ── Run / compile state ──
    runKey: 0,

    // ── UI state ──
    sidebarPanel: 'explorer', // explorer | search | ai | collab | settings
    showPreview: false,
    showTerminal: false,

    // ── Persist helper ──
    _persist() {
      const { projectName, tree } = get();
      localStorage.setItem(STORAGE_PROJECT, JSON.stringify({ name: projectName, tree }));
    },

    // ── Project actions ──
    setProjectName(name) {
      set({ projectName: name });
      get()._persist();
    },

    // ── File tree actions ──
    createFile(parentId, name, type = 'file') {
      const newNode = type === 'folder'
        ? { id: uid(), name, type: 'folder', expanded: true, children: [] }
        : { id: uid(), name, type: 'file', content: '' };

      set((s) => {
        const tree = updateNode(s.tree, parentId, (node) => ({
          ...node,
          expanded: true,
          children: [...(node.children || []), newNode],
        }));
        return { tree };
      });
      get()._persist();

      if (type === 'file') {
        get().openFile(newNode.id);
      }
      return newNode.id;
    },

    renameNode(id, newName) {
      set((s) => ({
        tree: updateNode(s.tree, id, (n) => ({ ...n, name: newName })),
      }));
      get()._persist();
    },

    deleteNode(id) {
      set((s) => ({
        tree: removeNode(s.tree, id),
        openTabs: s.openTabs.filter((t) => t !== id),
        activeTab: s.activeTab === id ? (s.openTabs.find((t) => t !== id) || null) : s.activeTab,
      }));
      get()._persist();
    },

    toggleFolder(id) {
      set((s) => ({
        tree: updateNode(s.tree, id, (n) => ({ ...n, expanded: !n.expanded })),
      }));
    },

    updateFileContent(id, content) {
      set((s) => ({
        tree: updateNode(s.tree, id, (n) => ({ ...n, content })),
        dirty: { ...s.dirty, [id]: true },
      }));
    },

    saveFile(id) {
      set((s) => ({ dirty: { ...s.dirty, [id]: false } }));
      get()._persist();
    },

    saveAll() {
      set({ dirty: {} });
      get()._persist();
    },

    // ── Tab actions ──
    openFile(id) {
      set((s) => {
        const tabs = s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id];
        return { openTabs: tabs, activeTab: id };
      });
    },

    closeTab(id) {
      set((s) => {
        const tabs = s.openTabs.filter((t) => t !== id);
        const active = s.activeTab === id ? (tabs[tabs.length - 1] || null) : s.activeTab;
        return { openTabs: tabs, activeTab: active };
      });
    },

    setActiveTab(id) {
      set({ activeTab: id });
    },

    // ── AI actions ──
    setActivePersona(personaId) {
      set((s) => ({
        personas: s.personas.map((p) => ({ ...p, active: p.id === personaId })),
      }));
      localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    addPersona(persona) {
      set((s) => ({ personas: [...s.personas, { ...persona, id: uid() }] }));
      localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    updatePersona(id, updates) {
      set((s) => ({
        personas: s.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    removePersona(id) {
      set((s) => ({ personas: s.personas.filter((p) => p.id !== id) }));
      localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    setPreprompt(text) {
      set({ preprompt: text });
    },

    toggleRule(id) {
      set((s) => ({
        rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      }));
      localStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
    },

    addRule(rule) {
      set((s) => ({ rules: [...s.rules, { ...rule, id: uid() }] }));
      localStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
    },

    removeRule(id) {
      set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
      localStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
    },

    addChatMessage(msg) {
      set((s) => ({ chatHistory: [...s.chatHistory, msg] }));
    },

    clearChat() {
      set({ chatHistory: [] });
    },

    setAiLoading(val) {
      set({ aiLoading: val });
    },

    setAIConfig(config) {
      set({ aiConfig: config });
      localStorage.setItem(STORAGE_AI_CONFIG, JSON.stringify(config));
    },

    // ── Aura History & Prompt Library ──
    addAuraMessage(message) {
      set((s) => {
        const newHistory = [...s.auraHistory, { ...message, id: Date.now().toString() }];
        localStorage.setItem(STORAGE_AURA_HISTORY, JSON.stringify(newHistory));
        return { auraHistory: newHistory };
      });
    },

    clearAuraHistory() {
      set({ auraHistory: [] });
      localStorage.removeItem(STORAGE_AURA_HISTORY);
    },

    savePrompt(prompt) {
      set((s) => {
        // Check if prompt already exists
        const exists = s.promptLibrary.some(p => p.text === prompt.text);
        if (exists) return {};
        
        const newLibrary = [...s.promptLibrary, prompt];
        localStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
        return { promptLibrary: newLibrary };
      });
    },

    deletePrompt(promptId) {
      set((s) => {
        const newLibrary = s.promptLibrary.filter(p => p.id !== promptId);
        localStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
        return { promptLibrary: newLibrary };
      });
    },

    incrementPromptUsage(promptId) {
      set((s) => {
        const newLibrary = s.promptLibrary.map(p => 
          p.id === promptId ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p
        );
        localStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
        return { promptLibrary: newLibrary };
      });
    },

    // ── Terminal actions ──
    addTerminalLine(line) {
      set((s) => ({ terminalLines: [...s.terminalLines, line] }));
    },

    clearTerminal() {
      set({ terminalLines: [{ type: 'system', text: 'Terminal cleared.' }] });
    },

    runProject() {
      const { flattenFiles, projectName } = get();
      const files = flattenFiles();
      const jsCount = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.jsx') || f.name.endsWith('.ts')).length;
      const htmlCount = files.filter(f => f.name.endsWith('.html')).length;
      const cssCount = files.filter(f => f.name.endsWith('.css')).length;

      set((s) => ({
        runKey: s.runKey + 1,
        showTerminal: true,
        terminalLines: [
          ...s.terminalLines,
          { type: 'system', text: `── Running ${projectName} ──` },
          { type: 'info', text: `Compiling ${files.length} files (${htmlCount} HTML, ${cssCount} CSS, ${jsCount} JS)...` },
          { type: 'system', text: 'Output rendered in preview. Console output below.' },
        ],
      }));
    },

    // ── UI actions ──
    setSidebarPanel(panel) {
      set({ sidebarPanel: panel });
    },

    togglePreview() {
      set((s) => ({ showPreview: !s.showPreview }));
    },

    toggleTerminal() {
      set((s) => ({ showTerminal: !s.showTerminal }));
    },

    // ── Project templates ──
    loadTemplate(templateId) {
      const templates = {
        blank: {
          name: 'Blank Project',
          tree: {
            id: 'root', name: 'project', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head><title>New Project</title></head>\n<body>\n\n</body>\n</html>' },
            ],
          },
        },
        react: {
          name: 'React App',
          tree: {
            id: 'root', name: 'react-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="App.jsx"></script>\n</body>\n</html>' },
              { id: uid(), name: 'App.jsx', type: 'file', content: 'import React, { useState } from \'react\';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div style={{ textAlign: \'center\', padding: \'2rem\' }}>\n      <h1>React App</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  );\n}\n' },
              { id: uid(), name: 'styles.css', type: 'file', content: ':root {\n  --primary: #00f0ff;\n  --bg: #0a0a0f;\n  --text: #e0e0e0;\n}\n\nbody {\n  background: var(--bg);\n  color: var(--text);\n  font-family: system-ui, sans-serif;\n}\n\nbutton {\n  background: var(--primary);\n  color: var(--bg);\n  border: none;\n  padding: 0.5rem 1.5rem;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 600;\n}\n' },
            ],
          },
        },
        landing: {
          name: 'Landing Page',
          tree: {
            id: 'root', name: 'landing-page', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Landing Page</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header>\n    <nav>\n      <div class="logo">Brand</div>\n      <ul>\n        <li><a href="#features">Features</a></li>\n        <li><a href="#pricing">Pricing</a></li>\n        <li><a href="#contact">Contact</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <section class="hero">\n    <h1>Build Something Amazing</h1>\n    <p>The platform for creators who want more.</p>\n    <button class="cta">Get Started</button>\n  </section>\n\n  <section id="features" class="features">\n    <h2>Features</h2>\n    <div class="grid">\n      <div class="card"><h3>Fast</h3><p>Lightning quick performance</p></div>\n      <div class="card"><h3>Secure</h3><p>Enterprise-grade security</p></div>\n      <div class="card"><h3>Scalable</h3><p>Grows with your needs</p></div>\n    </div>\n  </section>\n\n  <script src="main.js"></script>\n</body>\n</html>' },
              { id: uid(), name: 'style.css', type: 'file', content: '* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  background: #0a0a0f;\n  color: #e0e0e0;\n}\n\nnav {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem 2rem;\n  border-bottom: 1px solid rgba(255,255,255,0.1);\n}\n\n.logo { font-size: 1.5rem; font-weight: 700; color: #00f0ff; }\n\nnav ul { display: flex; gap: 2rem; list-style: none; }\nnav a { color: #aaa; text-decoration: none; }\nnav a:hover { color: #fff; }\n\n.hero {\n  text-align: center;\n  padding: 8rem 2rem;\n}\n\n.hero h1 {\n  font-size: 3.5rem;\n  background: linear-gradient(135deg, #00f0ff, #8b5cf6, #ff006e);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  margin-bottom: 1rem;\n}\n\n.hero p { color: #888; font-size: 1.25rem; margin-bottom: 2rem; }\n\n.cta {\n  background: linear-gradient(135deg, #00f0ff, #8b5cf6);\n  color: #0a0a0f;\n  border: none;\n  padding: 0.75rem 2rem;\n  border-radius: 8px;\n  font-size: 1rem;\n  font-weight: 700;\n  cursor: pointer;\n}\n\n.features { padding: 4rem 2rem; text-align: center; }\n.features h2 { font-size: 2rem; margin-bottom: 2rem; }\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1.5rem;\n  max-width: 900px;\n  margin: 0 auto;\n}\n\n.card {\n  background: rgba(255,255,255,0.05);\n  border: 1px solid rgba(255,255,255,0.1);\n  border-radius: 12px;\n  padding: 2rem;\n}\n\n.card h3 { color: #00f0ff; margin-bottom: 0.5rem; }\n' },
              { id: uid(), name: 'main.js', type: 'file', content: 'document.querySelector(\'.cta\')?.addEventListener(\'click\', () => {\n  alert(\'Let\\\'s get started!\');\n});\n' },
            ],
          },
        },
        api: {
          name: 'API Server',
          tree: {
            id: 'root', name: 'api-server', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'server.js', type: 'file', content: '// Express API Server\nconst express = require(\'express\');\nconst cors = require(\'cors\');\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\nconst PORT = process.env.PORT || 3000;\n\n// Routes\napp.get(\'/api/health\', (req, res) => {\n  res.json({ status: \'ok\', timestamp: Date.now() });\n});\n\napp.get(\'/api/items\', (req, res) => {\n  res.json({ items: [] });\n});\n\napp.post(\'/api/items\', (req, res) => {\n  const { name, description } = req.body;\n  if (!name) return res.status(400).json({ error: \'Name required\' });\n  res.status(201).json({ id: Date.now(), name, description });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});\n' },
              { id: uid(), name: 'package.json', type: 'file', content: '{\n  "name": "api-server",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node server.js",\n    "dev": "nodemon server.js"\n  },\n  "dependencies": {\n    "express": "^4.18.2",\n    "cors": "^2.8.5"\n  }\n}\n' },
              { id: uid(), name: '.env', type: 'file', content: 'PORT=3000\nNODE_ENV=development\n' },
            ],
          },
        },
        game: {
          name: 'Canvas Game',
          tree: {
            id: 'root', name: 'canvas-game', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Canvas Game</title>\n  <style>\n    body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }\n    canvas { border: 1px solid #333; }\n  </style>\n</head>\n<body>\n  <canvas id="game" width="800" height="600"></canvas>\n  <script src="game.js"></script>\n</body>\n</html>' },
              { id: uid(), name: 'game.js', type: 'file', content: 'const canvas = document.getElementById(\'game\');\nconst ctx = canvas.getContext(\'2d\');\n\nlet player = { x: 400, y: 500, w: 40, h: 40, speed: 5, color: \'#00f0ff\' };\nlet keys = {};\n\ndocument.addEventListener(\'keydown\', (e) => keys[e.key] = true);\ndocument.addEventListener(\'keyup\', (e) => keys[e.key] = false);\n\nfunction update() {\n  if (keys[\'ArrowLeft\'] || keys[\'a\']) player.x -= player.speed;\n  if (keys[\'ArrowRight\'] || keys[\'d\']) player.x += player.speed;\n  if (keys[\'ArrowUp\'] || keys[\'w\']) player.y -= player.speed;\n  if (keys[\'ArrowDown\'] || keys[\'s\']) player.y += player.speed;\n\n  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));\n  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));\n}\n\nfunction draw() {\n  ctx.fillStyle = \'#0a0a0f\';\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n  ctx.fillStyle = player.color;\n  ctx.shadowColor = player.color;\n  ctx.shadowBlur = 15;\n  ctx.fillRect(player.x, player.y, player.w, player.h);\n  ctx.shadowBlur = 0;\n\n  ctx.fillStyle = \'#666\';\n  ctx.font = \'14px monospace\';\n  ctx.fillText(\'WASD or Arrow Keys to move\', 10, 20);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();\n' },
            ],
          },
        },
        python: {
          name: 'Python App',
          tree: {
            id: 'root', name: 'python-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'main.py', type: 'file', content: '#!/usr/bin/env python3\n"""Cybeni Python Project"""\nimport math\nimport json\nfrom datetime import datetime\n\n\ndef greet(name: str) -> str:\n    return f"Hello, {name}! Welcome to Cybeni."\n\n\ndef fibonacci(n: int) -> list[int]:\n    """Generate first n Fibonacci numbers."""\n    fib = [0, 1]\n    for _ in range(2, n):\n        fib.append(fib[-1] + fib[-2])\n    return fib[:n]\n\n\ndef main():\n    print(greet("Developer"))\n    print(f"\\nFibonacci sequence (10): {fibonacci(10)}")\n    print(f"Pi to 6 decimals: {math.pi:.6f}")\n    print(f"Timestamp: {datetime.now().isoformat()}")\n\n    data = {"project": "Cybeni", "language": "Python", "version": "3.10"}\n    print(f"\\nProject info: {json.dumps(data, indent=2)}")\n\n\nif __name__ == "__main__":\n    main()\n' },
              { id: uid(), name: 'utils.py', type: 'file', content: '"""Utility functions."""\n\n\ndef clamp(value, min_val, max_val):\n    return max(min_val, min(max_val, value))\n\n\ndef flatten(nested_list):\n    result = []\n    for item in nested_list:\n        if isinstance(item, list):\n            result.extend(flatten(item))\n        else:\n            result.append(item)\n    return result\n\n\ndef chunk(lst, size):\n    return [lst[i:i + size] for i in range(0, len(lst), size)]\n' },
              { id: uid(), name: 'README.md', type: 'file', content: '# Python App\n\nCreated with Cybeni IDE.\n\n## Run\n```bash\npython main.py\n```\n' },
            ],
          },
        },
        c_app: {
          name: 'C Program',
          tree: {
            id: 'root', name: 'c-program', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'main.c', type: 'file', content: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\ntypedef struct {\n    char name[50];\n    int score;\n} Player;\n\nvoid print_banner(void) {\n    printf("╔══════════════════════╗\\n");\n    printf("║   Cybeni C Program   ║\\n");\n    printf("╚══════════════════════╝\\n\\n");\n}\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main(void) {\n    print_banner();\n\n    Player p = {"Developer", 100};\n    printf("Player: %s, Score: %d\\n\\n", p.name, p.score);\n\n    for (int i = 1; i <= 10; i++) {\n        printf("%2d! = %d\\n", i, factorial(i));\n    }\n\n    printf("\\nsqrt(2) = %.6f\\n", sqrt(2.0));\n    printf("PI = %.6f\\n", M_PI);\n\n    return 0;\n}\n' },
            ],
          },
        },
        rust: {
          name: 'Rust Program',
          tree: {
            id: 'root', name: 'rust-program', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'main.rs', type: 'file', content: '/// Cybeni Rust Project\nuse std::collections::HashMap;\n\nfn fibonacci(n: u32) -> Vec<u64> {\n    let mut fib = vec![0u64, 1];\n    for i in 2..n as usize {\n        let next = fib[i - 1] + fib[i - 2];\n        fib.push(next);\n    }\n    fib.truncate(n as usize);\n    fib\n}\n\nfn word_count(text: &str) -> HashMap<&str, usize> {\n    let mut counts = HashMap::new();\n    for word in text.split_whitespace() {\n        *counts.entry(word).or_insert(0) += 1;\n    }\n    counts\n}\n\nfn main() {\n    println!("╔══════════════════════════╗");\n    println!("║  Cybeni Rust Program     ║");\n    println!("╚══════════════════════════╝");\n    println!();\n\n    let fib = fibonacci(15);\n    println!("Fibonacci (15): {:?}", fib);\n\n    let text = "the quick brown fox jumps over the lazy dog the fox";\n    let counts = word_count(text);\n    println!("\\nWord counts:");\n    for (word, count) in &counts {\n        println!("  {}: {}", word, count);\n    }\n\n    // Ownership demo\n    let greeting = String::from("Hello from Cybeni!");\n    let len = calculate_length(&greeting);\n    println!("\\n\\\"{}\\\" has {} characters", greeting, len);\n}\n\nfn calculate_length(s: &String) -> usize {\n    s.len()\n}\n' },
            ],
          },
        },
        go_app: {
          name: 'Go Program',
          tree: {
            id: 'root', name: 'go-program', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'main.go', type: 'file', content: 'package main\n\nimport (\n\t"fmt"\n\t"math"\n\t"strings"\n\t"sort"\n)\n\ntype Task struct {\n\tName     string\n\tPriority int\n\tDone     bool\n}\n\nfunc fibonacci(n int) []int {\n\tfib := make([]int, n)\n\tfib[0], fib[1] = 0, 1\n\tfor i := 2; i < n; i++ {\n\t\tfib[i] = fib[i-1] + fib[i-2]\n\t}\n\treturn fib\n}\n\nfunc main() {\n\tfmt.Println("╔══════════════════════╗")\n\tfmt.Println("║  Cybeni Go Program   ║")\n\tfmt.Println("╚══════════════════════╝")\n\tfmt.Println()\n\n\t// Fibonacci\n\tfmt.Println("Fibonacci (12):", fibonacci(12))\n\n\t// Tasks\n\ttasks := []Task{\n\t\t{"Build UI", 1, true},\n\t\t{"Write tests", 2, false},\n\t\t{"Deploy", 3, false},\n\t\t{"Code review", 1, true},\n\t}\n\n\tsort.Slice(tasks, func(i, j int) bool {\n\t\treturn tasks[i].Priority < tasks[j].Priority\n\t})\n\n\tfmt.Println("\\nTasks (sorted by priority):")\n\tfor _, t := range tasks {\n\t\tstatus := "[ ]"\n\t\tif t.Done {\n\t\t\tstatus = "[x]"\n\t\t}\n\t\tfmt.Printf("  %s P%d: %s\\n", status, t.Priority, t.Name)\n\t}\n\n\tfmt.Printf("\\nPi: %.6f\\n", math.Pi)\n\tfmt.Printf("Uppercase: %s\\n", strings.ToUpper("cybeni ide"))\n}\n' },
            ],
          },
        },
        java: {
          name: 'Java Program',
          tree: {
            id: 'root', name: 'java-program', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'Main.java', type: 'file', content: 'import java.util.*;\nimport java.util.stream.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("╔══════════════════════════╗");\n        System.out.println("║  Cybeni Java Program     ║");\n        System.out.println("╚══════════════════════════╝");\n        System.out.println();\n\n        // Collections\n        List<String> languages = Arrays.asList("Java", "Python", "Rust", "Go", "C++");\n        System.out.println("Languages: " + languages);\n\n        // Streams\n        String filtered = languages.stream()\n            .filter(l -> l.length() <= 4)\n            .collect(Collectors.joining(", "));\n        System.out.println("Short names: " + filtered);\n\n        // Fibonacci\n        System.out.println("\\nFibonacci (10): " + fibonacci(10));\n\n        // Map\n        Map<String, Integer> scores = new HashMap<>();\n        scores.put("Alice", 95);\n        scores.put("Bob", 87);\n        scores.put("Charlie", 92);\n\n        scores.entrySet().stream()\n            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())\n            .forEach(e -> System.out.printf("  %s: %d\\n", e.getKey(), e.getValue()));\n    }\n\n    static List<Integer> fibonacci(int n) {\n        List<Integer> fib = new ArrayList<>(Arrays.asList(0, 1));\n        for (int i = 2; i < n; i++) {\n            fib.add(fib.get(i - 1) + fib.get(i - 2));\n        }\n        return fib;\n    }\n}\n' },
            ],
          },
        },
      };

      const template = templates[templateId];
      if (!template) return;

      set({
        projectName: template.name,
        tree: template.tree,
        openTabs: [],
        activeTab: null,
        dirty: {},
        chatHistory: [],
        terminalLines: [{ type: 'system', text: `Loaded template: ${template.name}` }],
      });
      get()._persist();

      // Open first file
      const files = flattenFiles(template.tree);
      if (files[0]) get().openFile(files[0].id);
    },

    // ── Utilities exposed ──
    findNode: (id) => findNode(get().tree, id),
    flattenFiles: () => flattenFiles(get().tree),
    detectLang,

    // ── Build system prompt from active persona + rules + preprompt ──
    buildSystemPrompt() {
      const { personas, rules, preprompt, tree } = get();
      const active = personas.find((p) => p.active);
      const enabledRules = rules.filter((r) => r.enabled);

      const parts = [];

      if (active?.systemPrompt) {
        parts.push(active.systemPrompt);
      }

      if (enabledRules.length > 0) {
        parts.push('\n## Active Rules');
        enabledRules.forEach((r) => parts.push(`- **${r.name}**: ${r.rule}`));
      }

      // Inject current project context
      const files = flattenFiles(tree);
      if (files.length > 0) {
        parts.push('\n## Current Project Files');
        files.forEach((f) => parts.push(`- ${f.path} (${f.content?.length || 0} chars)`));
      }

      if (preprompt) {
        parts.push(`\n## Additional Instructions\n${preprompt}`);
      }

      parts.push('\n## Response Format\nWhen generating code, wrap each file in a code block with the filename: ```filename.ext\\n...code...\\n```. This allows the IDE to parse and apply changes automatically.');

      return parts.join('\n');
    },

    // ── Parse AI response for code blocks ──
    parseCodeBlocks(text) {
      const blocks = [];
      const regex = /```(\S+)\n([\s\S]*?)```/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const filename = match[1];
        const code = match[2].trim();
        if (filename && !['javascript', 'typescript', 'html', 'css', 'json', 'python', 'jsx', 'tsx'].includes(filename.toLowerCase())) {
          blocks.push({ filename, code });
        } else {
          blocks.push({ filename: null, code, language: filename });
        }
      }
      return blocks;
    },

    // ── Apply code blocks from AI to project ──
    applyCodeBlocks(blocks) {
      const { tree, openFile } = get();
      const allFiles = flattenFiles(tree);

      blocks.forEach(({ filename, code }) => {
        if (!filename) return;
        const existing = allFiles.find((f) => f.name === filename || f.path?.endsWith(filename));
        if (existing) {
          get().updateFileContent(existing.id, code);
          get().saveFile(existing.id);
          openFile(existing.id);
        } else {
          get().createFile('root', filename, 'file');
          // Find the newly created file
          const newFiles = flattenFiles(get().tree);
          const newFile = newFiles.find((f) => f.name === filename);
          if (newFile) {
            get().updateFileContent(newFile.id, code);
            get().saveFile(newFile.id);
          }
        }
      });
    },
  };
});

export default useBuilderStore;
