import { create } from 'zustand';
import { kernelStorage } from '../../../kernel/kernelStorage.js';

// ── Storage keys ────────────────────────────────────────────
const STORAGE_PROJECT = 'novaura_builder_project';
const STORAGE_PERSONAS = 'novaura_builder_personas';
const STORAGE_RULES = 'novaura_builder_rules';
const STORAGE_AI_CONFIG = 'novaura_builder_ai_config';
const STORAGE_PROMPT_LIBRARY = 'novaura_prompt_library';
const STORAGE_AURA_HISTORY = 'novaura_aura_history';
const STORAGE_CODE_LIBRARIES = 'novaura_code_libraries';


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

function defaultCodeLibraries() {
  return [
    { id: 'lib-ui', name: 'UI Component Kit', description: 'Reusable frontend components (buttons, cards, forms, modals).', snippets: ['button', 'card', 'form', 'modal'] },
    { id: 'lib-auth', name: 'Auth Flow Template', description: 'Email/password sign-in/signup with validation and token handling.', snippets: ['login', 'register', 'logout', 'auth-api'] },
    { id: 'lib-data', name: 'Data Layer Utilities', description: 'Fetch/resilient data access helpers, caching, and error boundaries.', snippets: ['fetcher', 'retry', 'cache', 'api-client'] },
  ];
}

function loadCodeLibraries() {
  try {
    const raw = kernelStorage.getItem(STORAGE_CODE_LIBRARIES);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultCodeLibraries();
}

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
    const raw = kernelStorage.getItem(STORAGE_AI_CONFIG);
    if (raw) return { ...defaultAIConfig(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultAIConfig();
}

function loadPromptLibrary() {
  try {
    const raw = kernelStorage.getItem(STORAGE_PROMPT_LIBRARY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function loadAuraHistory() {
  try {
    const raw = kernelStorage.getItem(STORAGE_AURA_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

// ── Persistence ─────────────────────────────────────────────
function loadProject() {
  try {
    const raw = kernelStorage.getItem(STORAGE_PROJECT);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultProject();
}

function loadPersonas() {
  try {
    const raw = kernelStorage.getItem(STORAGE_PERSONAS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultPersonas();
}

function loadRules() {
  try {
    const raw = kernelStorage.getItem(STORAGE_RULES);
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
    codeLibraries: loadCodeLibraries(),
    activeCodeLibraryId: 'lib-ui',


    // ── Terminal state ──
    terminalLines: [{ type: 'system', text: 'Cybeni Terminal v1.0 — Type JavaScript or use AI commands' }],

    // ── Run / compile state ──
    runKey: 0,

    // ── Agentic loop state ──
    iframeErrors: [],       // errors captured from live preview iframe
    agentRunning: false,    // true while the agent build loop is active

    // ── UI state ──
    sidebarPanel: 'explorer', // explorer | search | ai | collab | settings
    showPreview: false,
    showTerminal: false,

    // ── Agentic loop actions ──
    pushIframeError(err) {
      set((s) => ({ iframeErrors: [...s.iframeErrors, err] }));
    },
    clearIframeErrors() {
      set({ iframeErrors: [] });
    },
    setAgentRunning(val) {
      set({ agentRunning: val });
    },

    // ── Persist helper ──
    _persist() {
      const { projectName, tree } = get();
      kernelStorage.setItem(STORAGE_PROJECT, JSON.stringify({ name: projectName, tree }));
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
      kernelStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    addPersona(persona) {
      set((s) => ({ personas: [...s.personas, { ...persona, id: uid() }] }));
      kernelStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    updatePersona(id, updates) {
      set((s) => ({
        personas: s.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      kernelStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    removePersona(id) {
      set((s) => ({ personas: s.personas.filter((p) => p.id !== id) }));
      kernelStorage.setItem(STORAGE_PERSONAS, JSON.stringify(get().personas));
    },

    setPreprompt(text) {
      set({ preprompt: text });
    },

    toggleRule(id) {
      set((s) => ({
        rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      }));
      kernelStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
    },

    addRule(rule) {
      set((s) => ({ rules: [...s.rules, { ...rule, id: uid() }] }));
      kernelStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
    },

    removeRule(id) {
      set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
      kernelStorage.setItem(STORAGE_RULES, JSON.stringify(get().rules));
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
      kernelStorage.setItem(STORAGE_AI_CONFIG, JSON.stringify(config));
    },

    // ── Aura History & Prompt Library ──
    addAuraMessage(message) {
      set((s) => {
        const newHistory = [...s.auraHistory, { ...message, id: Date.now().toString() }];
        kernelStorage.setItem(STORAGE_AURA_HISTORY, JSON.stringify(newHistory));
        return { auraHistory: newHistory };
      });
    },

    clearAuraHistory() {
      set({ auraHistory: [] });
      kernelStorage.removeItem(STORAGE_AURA_HISTORY);
    },

    savePrompt(prompt) {
      set((s) => {
        // Check if prompt already exists
        const exists = s.promptLibrary.some(p => p.text === prompt.text);
        if (exists) return {};
        
        const newLibrary = [...s.promptLibrary, prompt];
        kernelStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
        return { promptLibrary: newLibrary };
      });
    },

    deletePrompt(promptId) {
      set((s) => {
        const newLibrary = s.promptLibrary.filter(p => p.id !== promptId);
        kernelStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
        return { promptLibrary: newLibrary };
      });
    },

    incrementPromptUsage(promptId) {
      set((s) => {
        const newLibrary = s.promptLibrary.map(p => 
          p.id === promptId ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p
        );
        kernelStorage.setItem(STORAGE_PROMPT_LIBRARY, JSON.stringify(newLibrary));
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
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // NEW TEMPLATES - Full Stack & Advanced
        // ═══════════════════════════════════════════════════════════════════════════════
        
        nextjs: {
          name: 'Next.js App Router',
          tree: {
            id: 'root', name: 'nextjs-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'app/layout.jsx', type: 'file', content: "export const metadata = {\n  title: 'Next.js App',\n  description: 'Built with Cybeni',\n};\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang=\"en\">\n      <body style={{ margin: 0, fontFamily: 'system-ui' }}>{children}</body>\n    </html>\n  );\n}\n" },
              { id: uid(), name: 'app/page.jsx', type: 'file', content: "export default function Home() {\n  return (\n    <main style={{ padding: '2rem', textAlign: 'center' }}>\n      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>\n        Welcome to Next.js\n      </h1>\n      <p style={{ color: '#666' }}>\n        Built with Cybeni IDE\n      </p>\n      <a href=\"/about\" style={{ color: '#0070f3' }}>About →</a>\n    </main>\n  );\n}\n" },
              { id: uid(), name: 'app/about/page.jsx', type: 'file', content: "export default function About() {\n  return (\n    <main style={{ padding: '2rem', textAlign: 'center' }}>\n      <h1>About</h1>\n      <p>This is a Next.js app built with Cybeni.</p>\n      <a href=\"/\" style={{ color: '#0070f3' }}>← Home</a>\n    </main>\n  );\n}\n" },
              { id: uid(), name: 'app/api/hello/route.js', type: 'file', content: "export async function GET() {\n  return Response.json({ message: 'Hello from Cybeni!' });\n}\n" },
              { id: uid(), name: 'package.json', type: 'file', content: '{\n  "name": "nextjs-app",\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "14.x",\n    "react": "^18",\n    "react-dom": "^18"\n  }\n}\n' },
            ],
          },
        },
        
        vue: {
          name: 'Vue 3 + Vite',
          tree: {
            id: 'root', name: 'vue-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Vue App</title>\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="/src/main.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'src/main.js', type: 'file', content: "import { createApp } from 'vue';\nimport App from './App.vue';\ncreateApp(App).mount('#app');\n" },
              { id: uid(), name: 'src/App.vue', type: 'file', content: '<template>\n  <div class="app">\n    <h1>{{ message }}</h1>\n    <button @click="increment">Count: {{ count }}</button>\n  </div>\n</template>\n\n<script setup>\nimport { ref } from \'vue\';\nconst message = ref(\'Hello Vue 3!\');\nconst count = ref(0);\nconst increment = () => count.value++;\n</script>\n\n<style>\n.app { text-align: center; padding: 2rem; }\nh1 { color: #42b883; }\nbutton {\n  background: #42b883; color: white;\n  border: none; padding: 0.5rem 1rem;\n  border-radius: 4px; cursor: pointer;\n}\n</style>\n' },
              { id: uid(), name: 'package.json', type: 'file', content: '{\n  "name": "vue-app",\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "vue": "^3.3"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-vue": "^4",\n    "vite": "^5"\n  }\n}\n' },
            ],
          },
        },
        
        threejs: {
          name: 'Three.js 3D Scene',
          tree: {
            id: 'root', name: 'threejs-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Three.js Scene</title>\n  <style>\n    body { margin: 0; overflow: hidden; background: #000; }\n    canvas { display: block; }\n    #info {\n      position: absolute; top: 10px; left: 10px;\n      color: white; font-family: monospace;\n      background: rgba(0,0,0,0.5); padding: 10px;\n    }\n  </style>\n</head>\n<body>\n  <div id="info">Three.js Demo - Drag to rotate</div>\n  <script type="module" src="main.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'main.js', type: 'file', content: "import * as THREE from 'https://esm.sh/three@0.160.0';\n\n// Scene setup\nconst scene = new THREE.Scene();\nscene.background = new THREE.Color(0x0a0a0f);\n\nconst camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);\ncamera.position.z = 5;\n\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\nrenderer.setSize(innerWidth, innerHeight);\ndocument.body.appendChild(renderer.domElement);\n\n// Create cube\nconst geometry = new THREE.BoxGeometry();\nconst material = new THREE.MeshStandardMaterial({ \n  color: 0x00f0ff,\n  roughness: 0.3,\n  metalness: 0.8\n});\nconst cube = new THREE.Mesh(geometry, material);\nscene.add(cube);\n\n// Lighting\nconst light = new THREE.DirectionalLight(0xffffff, 1);\nlight.position.set(5, 5, 5);\nscene.add(light);\nscene.add(new THREE.AmbientLight(0x404040));\n\n// Animation loop\nfunction animate() {\n  requestAnimationFrame(animate);\n  cube.rotation.x += 0.01;\n  cube.rotation.y += 0.01;\n  renderer.render(scene, camera);\n}\nanimate();\n\n// Resize handler\naddEventListener('resize', () => {\n  camera.aspect = innerWidth / innerHeight;\n  camera.updateProjectionMatrix();\n  renderer.setSize(innerWidth, innerHeight);\n});\n" },
            ],
          },
        },
        
        chat_app: {
          name: 'Real-time Chat App',
          tree: {
            id: 'root', name: 'chat-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Chat App</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: system-ui;\n      background: #0a0a0f;\n      color: #e0e0e0;\n      height: 100vh;\n      display: flex;\n      flex-direction: column;\n    }\n    #chat { flex: 1; overflow-y: auto; padding: 1rem; }\n    .message { margin-bottom: 1rem; padding: 0.5rem 1rem; background: #1a1a2e; border-radius: 8px; }\n    .message.me { background: #00f0ff22; margin-left: 20%; }\n    .message .user { font-weight: bold; color: #00f0ff; margin-bottom: 0.25rem; }\n    #input-area { display: flex; padding: 1rem; border-top: 1px solid #333; }\n    #message-input { flex: 1; padding: 0.75rem; background: #1a1a2e; border: 1px solid #333; color: white; border-radius: 8px; }\n    #send-btn { margin-left: 0.5rem; padding: 0.75rem 1.5rem; background: #00f0ff; color: #0a0a0f; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }\n  </style>\n</head>\n<body>\n  <div id="chat"></div>\n  <div id="input-area">\n    <input type="text" id="message-input" placeholder="Type a message..." />\n    <button id="send-btn">Send</button>\n  </div>\n  <script src="chat.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'chat.js', type: 'file', content: "const chat = document.getElementById('chat');\nconst input = document.getElementById('message-input');\nconst sendBtn = document.getElementById('send-btn');\n\nconst username = 'User' + Math.floor(Math.random() * 1000);\n\nfunction addMessage(user, text, isMe = false) {\n  const div = document.createElement('div');\n  div.className = 'message ' + (isMe ? 'me' : '');\n  div.innerHTML = `<div class=\"user\">${user}</div><div>${text}</div>`;\n  chat.appendChild(div);\n  chat.scrollTop = chat.scrollHeight;\n}\n\nfunction sendMessage() {\n  const text = input.value.trim();\n  if (!text) return;\n  addMessage(username, text, true);\n  input.value = '';\n  \n  // Simulate reply\n  setTimeout(() => {\n    const replies = [\n      'Interesting! Tell me more.',\n      'I see what you mean.',\n      'That\\'s cool! 🎉',\n      'Thanks for sharing!',\n      'Could you elaborate?'\n    ];\n    const reply = replies[Math.floor(Math.random() * replies.length)];\n    addMessage('Bot', reply);\n  }, 1000 + Math.random() * 2000);\n}\n\nsendBtn.addEventListener('click', sendMessage);\ninput.addEventListener('keypress', (e) => {\n  if (e.key === 'Enter') sendMessage();\n});\n\n// Welcome message\naddMessage('System', 'Welcome to the chat! Start typing to send messages.');\n" },
            ],
          },
        },
        
        todo_app: {
          name: 'Todo App with LocalStorage',
          tree: {
            id: 'root', name: 'todo-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Todo App</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: system-ui;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      min-height: 100vh;\n      padding: 2rem;\n    }\n    .container {\n      max-width: 500px;\n      margin: 0 auto;\n      background: white;\n      border-radius: 16px;\n      padding: 2rem;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n    }\n    h1 { text-align: center; color: #333; margin-bottom: 1.5rem; }\n    .input-group { display: flex; gap: 0.5rem; margin-bottom: 1rem; }\n    #todo-input { flex: 1; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }\n    #add-btn { padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }\n    #add-btn:hover { background: #5a67d8; }\n    .filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center; }\n    .filter { padding: 0.5rem 1rem; background: #f0f0f0; border: none; border-radius: 20px; cursor: pointer; }\n    .filter.active { background: #667eea; color: white; }\n    #todo-list { list-style: none; }\n    .todo-item {\n      display: flex; align-items: center;\n      padding: 1rem;\n      background: #f8f9fa;\n      border-radius: 8px;\n      margin-bottom: 0.5rem;\n    }\n    .todo-item.completed { opacity: 0.6; }\n    .todo-item.completed span { text-decoration: line-through; }\n    .todo-item input[type=\"checkbox\"] { margin-right: 1rem; width: 20px; height: 20px; }\n    .todo-item span { flex: 1; }\n    .delete-btn {\n      background: #ff6b6b; color: white;\n      border: none; padding: 0.5rem 1rem;\n      border-radius: 6px; cursor: pointer;\n    }\n    .stats { text-align: center; color: #666; margin-top: 1rem; font-size: 0.9rem; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>✅ Todo List</h1>\n    <div class="input-group">\n      <input type="text" id="todo-input" placeholder="What needs to be done?" />\n      <button id="add-btn">Add</button>\n    </div>\n    <div class="filters">\n      <button class="filter active" data-filter="all">All</button>\n      <button class="filter" data-filter="active">Active</button>\n      <button class="filter" data-filter="completed">Completed</button>\n    </div>\n    <ul id="todo-list"></ul>\n    <div class="stats"><span id="stats">0 items left</span></div>\n  </div>\n  <script src="todo.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'todo.js', type: 'file', content: "let todos = JSON.parse(kernelStorage.getItem('todos') || '[]');\nlet filter = 'all';\n\nconst todoInput = document.getElementById('todo-input');\nconst addBtn = document.getElementById('add-btn');\nconst todoList = document.getElementById('todo-list');\nconst stats = document.getElementById('stats');\nconst filterBtns = document.querySelectorAll('.filter');\n\nfunction save() {\n  kernelStorage.setItem('todos', JSON.stringify(todos));\n  render();\n}\n\nfunction render() {\n  todoList.innerHTML = '';\n  \n  const filtered = todos.filter(t => {\n    if (filter === 'active') return !t.completed;\n    if (filter === 'completed') return t.completed;\n    return true;\n  });\n  \n  filtered.forEach((todo, index) => {\n    const li = document.createElement('li');\n    li.className = 'todo-item ' + (todo.completed ? 'completed' : '');\n    li.innerHTML = `\n      <input type=\"checkbox\" ${todo.completed ? 'checked' : ''} onchange=\"toggle(${index})\" />\n      <span>${escapeHtml(todo.text)}</span>\n      <button class=\"delete-btn\" onclick=\"remove(${index})\">Delete</button>\n    `;\n    todoList.appendChild(li);\n  });\n  \n  const active = todos.filter(t => !t.completed).length;\n  stats.textContent = `${active} item${active !== 1 ? 's' : ''} left`;\n}\n\nfunction escapeHtml(text) {\n  const div = document.createElement('div');\n  div.textContent = text;\n  return div.innerHTML;\n}\n\nfunction add() {\n  const text = todoInput.value.trim();\n  if (!text) return;\n  todos.push({ text, completed: false, id: Date.now() });\n  todoInput.value = '';\n  save();\n}\n\nfunction toggle(index) {\n  todos[index].completed = !todos[index].completed;\n  save();\n}\n\nfunction remove(index) {\n  todos.splice(index, 1);\n  save();\n}\n\n// Event listeners\naddBtn.addEventListener('click', add);\ntodoInput.addEventListener('keypress', e => { if (e.key === 'Enter') add(); });\n\nfilterBtns.forEach(btn => {\n  btn.addEventListener('click', () => {\n    filterBtns.forEach(b => b.classList.remove('active'));\n    btn.classList.add('active');\n    filter = btn.dataset.filter;\n    render();\n  });\n});\n\n// Initial render\nrender();\n" },
            ],
          },
        },
        
        weather_app: {
          name: 'Weather Dashboard',
          tree: {
            id: 'root', name: 'weather-app', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Weather App</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: system-ui;\n      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);\n      min-height: 100vh;\n      padding: 2rem;\n      color: white;\n    }\n    .container { max-width: 600px; margin: 0 auto; }\n    h1 { text-align: center; margin-bottom: 2rem; font-size: 2.5rem; }\n    .search-box {\n      display: flex;\n      gap: 0.5rem;\n      margin-bottom: 2rem;\n    }\n    #city-input {\n      flex: 1;\n      padding: 1rem;\n      border: none;\n      border-radius: 12px;\n      font-size: 1.1rem;\n      background: rgba(255,255,255,0.2);\n      color: white;\n    }\n    #city-input::placeholder { color: rgba(255,255,255,0.7); }\n    #search-btn {\n      padding: 1rem 2rem;\n      background: rgba(255,255,255,0.2);\n      color: white;\n      border: none;\n      border-radius: 12px;\n      cursor: pointer;\n      font-weight: bold;\n    }\n    .weather-card {\n      background: rgba(255,255,255,0.1);\n      border-radius: 24px;\n      padding: 2rem;\n      backdrop-filter: blur(10px);\n      text-align: center;\n    }\n    .city-name { font-size: 2rem; margin-bottom: 0.5rem; }\n    .temperature { font-size: 4rem; font-weight: bold; margin: 1rem 0; }\n    .description { font-size: 1.2rem; opacity: 0.9; text-transform: capitalize; }\n    .details {\n      display: grid;\n      grid-template-columns: repeat(3, 1fr);\n      gap: 1rem;\n      margin-top: 2rem;\n    }\n    .detail {\n      background: rgba(255,255,255,0.1);\n      padding: 1rem;\n      border-radius: 12px;\n    }\n    .detail-label { font-size: 0.9rem; opacity: 0.7; }\n    .detail-value { font-size: 1.3rem; font-weight: bold; margin-top: 0.25rem; }\n    .loading { text-align: center; font-size: 1.2rem; }\n    .error { text-align: center; color: #ff6b6b; padding: 1rem; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>🌤️ Weather</h1>\n    <div class="search-box">\n      <input type="text" id="city-input" placeholder="Enter city name..." />\n      <button id="search-btn">Search</button>\n    </div>\n    <div id="weather-result"></div>\n  </div>\n  <script src="weather.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'weather.js', type: 'file', content: "const API_KEY = 'YOUR_API_KEY'; // Get from openweathermap.org\n\nconst cityInput = document.getElementById('city-input');\nconst searchBtn = document.getElementById('search-btn');\nconst result = document.getElementById('weather-result');\n\nasync function getWeather(city) {\n  // For demo, show mock data\n  const mockData = {\n    name: city,\n    main: { temp: 22, humidity: 65, feels_like: 21 },\n    weather: [{ description: 'partly cloudy', main: 'Clouds' }],\n    wind: { speed: 5.5 }\n  };\n  \n  renderWeather(mockData);\n  \n  // Real API call (uncomment when you have API key):\n  // const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;\n  // const res = await fetch(url);\n  // const data = await res.json();\n  // renderWeather(data);\n}\n\nfunction renderWeather(data) {\n  const icon = getWeatherIcon(data.weather[0].main);\n  result.innerHTML = `\n    <div class=\"weather-card\">\n      <div class=\"city-name\">${data.name} ${icon}</div>\n      <div class=\"temperature\">${Math.round(data.main.temp)}°C</div>\n      <div class=\"description\">${data.weather[0].description}</div>\n      <div class=\"details\">\n        <div class=\"detail\">\n          <div class=\"detail-label\">Feels Like</div>\n          <div class=\"detail-value\">${Math.round(data.main.feels_like)}°C</div>\n        </div>\n        <div class=\"detail\">\n          <div class=\"detail-label\">Humidity</div>\n          <div class=\"detail-value\">${data.main.humidity}%</div>\n        </div>\n        <div class=\"detail\">\n          <div class=\"detail-label\">Wind</div>\n          <div class=\"detail-value\">${data.wind.speed} m/s</div>\n        </div>\n      </div>\n    </div>\n  `;\n}\n\nfunction getWeatherIcon(condition) {\n  const icons = {\n    'Clear': '☀️',\n    'Clouds': '☁️',\n    'Rain': '🌧️',\n    'Snow': '❄️',\n    'Thunderstorm': '⛈️',\n    'Drizzle': '🌦️',\n    'Mist': '🌫️'\n  };\n  return icons[condition] || '🌡️';\n}\n\nsearchBtn.addEventListener('click', () => {\n  const city = cityInput.value.trim();\n  if (city) getWeather(city);\n});\n\ncityInput.addEventListener('keypress', e => {\n  if (e.key === 'Enter') searchBtn.click();\n});\n\n// Load default\ngetWeather('London');\n" },
            ],
          },
        },
        
        portfolio: {
          name: 'Developer Portfolio',
          tree: {
            id: 'root', name: 'portfolio', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Portfolio</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: system-ui, -apple-system, sans-serif;\n      background: #0a0a0f;\n      color: #e0e0e0;\n      line-height: 1.6;\n    }\n    nav {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      padding: 1rem 5%;\n      position: fixed;\n      width: 100%;\n      top: 0;\n      background: rgba(10, 10, 15, 0.9);\n      backdrop-filter: blur(10px);\n      z-index: 100;\n    }\n    .logo { font-size: 1.5rem; font-weight: bold; color: #00f0ff; }\n    nav ul { display: flex; gap: 2rem; list-style: none; }\n    nav a { color: #888; text-decoration: none; transition: color 0.3s; }\n    nav a:hover { color: #00f0ff; }\n    \n    .hero {\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      padding: 2rem;\n    }\n    .hero h1 {\n      font-size: 4rem;\n      margin-bottom: 1rem;\n      background: linear-gradient(135deg, #00f0ff, #8b5cf6);\n      -webkit-background-clip: text;\n      -webkit-text-fill-color: transparent;\n    }\n    .hero p { font-size: 1.25rem; color: #888; margin-bottom: 2rem; }\n    .btn {\n      display: inline-block;\n      padding: 1rem 2rem;\n      background: linear-gradient(135deg, #00f0ff, #8b5cf6);\n      color: #0a0a0f;\n      text-decoration: none;\n      border-radius: 8px;\n      font-weight: bold;\n    }\n    \n    section { padding: 5rem 10%; }\n    h2 { font-size: 2.5rem; margin-bottom: 2rem; text-align: center; }\n    \n    .projects {\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n      gap: 2rem;\n    }\n    .project-card {\n      background: #14141f;\n      border-radius: 16px;\n      overflow: hidden;\n      border: 1px solid #1f1f2e;\n    }\n    .project-card h3 { padding: 1.5rem 1.5rem 0.5rem; }\n    .project-card p { padding: 0 1.5rem 1.5rem; color: #888; }\n    .tags { display: flex; gap: 0.5rem; padding: 0 1.5rem 1.5rem; flex-wrap: wrap; }\n    .tag {\n      background: rgba(0, 240, 255, 0.1);\n      color: #00f0ff;\n      padding: 0.25rem 0.75rem;\n      border-radius: 20px;\n      font-size: 0.85rem;\n    }\n    \n    .skills {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 1rem;\n      justify-content: center;\n    }\n    .skill {\n      background: #14141f;\n      padding: 1rem 2rem;\n      border-radius: 8px;\n      border: 1px solid #1f1f2e;\n    }\n    \n    footer {\n      text-align: center;\n      padding: 3rem;\n      color: #666;\n      border-top: 1px solid #1f1f2e;\n    }\n    \n    @media (max-width: 768px) {\n      .hero h1 { font-size: 2.5rem; }\n      nav ul { display: none; }\n      section { padding: 3rem 5%; }\n    }\n  </style>\n</head>\n<body>\n  <nav>\n    <div class="logo">Portfolio</div>\n    <ul>\n      <li><a href="#home">Home</a></li>\n      <li><a href="#projects">Projects</a></li>\n      <li><a href="#skills">Skills</a></li>\n      <li><a href="#contact">Contact</a></li>\n    </ul>\n  </nav>\n\n  <section class="hero" id="home">\n    <div>\n      <h1>Hello, I\'m a Developer</h1>\n      <p>I build modern web applications with cutting-edge technologies</p>\n      <a href="#projects" class="btn">View My Work</a>\n    </div>\n  </section>\n\n  <section id="projects">\n    <h2>Featured Projects</h2>\n    <div class="projects">\n      <div class="project-card">\n        <h3>E-Commerce Platform</h3>\n        <p>A full-stack online store with real-time inventory and payments</p>\n        <div class="tags">\n          <span class="tag">React</span>\n          <span class="tag">Node.js</span>\n          <span class="tag">Stripe</span>\n        </div>\n      </div>\n      <div class="project-card">\n        <h3>AI Chat Application</h3>\n        <p>Real-time messaging app with AI-powered smart replies</p>\n        <div class="tags">\n          <span class="tag">Vue.js</span>\n          <span class="tag">Firebase</span>\n          <span class="tag">OpenAI</span>\n        </div>\n      </div>\n      <div class="project-card">\n        <h3>Data Dashboard</h3>\n        <p>Interactive analytics dashboard with real-time data visualization</p>\n        <div class="tags">\n          <span class="tag">D3.js</span>\n          <span class="tag">Python</span>\n          <span class="tag">PostgreSQL</span>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <section id="skills">\n    <h2>Skills & Technologies</h2>\n    <div class="skills">\n      <span class="skill">JavaScript</span>\n      <span class="skill">React</span>\n      <span class="skill">Node.js</span>\n      <span class="skill">Python</span>\n      <span class="skill">SQL</span>\n      <span class="skill">Git</span>\n      <span class="skill">AWS</span>\n      <span class="skill">Docker</span>\n    </div>\n  </section>\n\n  <section id="contact">\n    <h2>Get In Touch</h2>\n    <div style="text-align: center;">\n      <p style="color: #888; margin-bottom: 2rem;">I\'m always open to discussing new projects and opportunities</p>\n      <a href="mailto:hello@example.com" class="btn">hello@example.com</a>\n    </div>\n  </section>\n\n  <footer>\n    <p>&copy; 2024 Built with Cybeni IDE</p>\n  </footer>\n</body>\n</html>\n' },
            ],
          },
        },
        
        snake_game: {
          name: 'Snake Game',
          tree: {
            id: 'root', name: 'snake-game', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Snake Game</title>\n  <style>\n    body {\n      margin: 0;\n      background: #0a0a0f;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      height: 100vh;\n      font-family: system-ui;\n      color: white;\n    }\n    canvas {\n      border: 2px solid #00f0ff;\n      box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);\n    }\n    .score {\n      font-size: 1.5rem;\n      margin-bottom: 1rem;\n    }\n    .controls {\n      margin-top: 1rem;\n      color: #888;\n    }\n    .game-over {\n      position: absolute;\n      background: rgba(0,0,0,0.9);\n      padding: 2rem;\n      border-radius: 12px;\n      text-align: center;\n      display: none;\n    }\n    .game-over h2 {\n      color: #ff6b6b;\n      margin-bottom: 1rem;\n    }\n    .game-over button {\n      padding: 0.75rem 2rem;\n      background: #00f0ff;\n      color: #0a0a0f;\n      border: none;\n      border-radius: 8px;\n      font-weight: bold;\n      cursor: pointer;\n    }\n  </style>\n</head>\n<body>\n  <div class="score">Score: <span id="score">0</span></div>\n  <canvas id="game" width="400" height="400"></canvas>\n  <div class="controls">Use arrow keys to move</div>\n  <div class="game-over" id="gameOver">\n    <h2>Game Over!</h2>\n    <p>Final Score: <span id="finalScore">0</span></p>\n    <button onclick="resetGame()">Play Again</button>\n  </div>\n  <script src="snake.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'snake.js', type: 'file', content: "const canvas = document.getElementById('game');\nconst ctx = canvas.getContext('2d');\nconst scoreEl = document.getElementById('score');\nconst gameOverEl = document.getElementById('gameOver');\nconst finalScoreEl = document.getElementById('finalScore');\n\nconst gridSize = 20;\nconst tileCount = canvas.width / gridSize;\n\nlet snake = [{ x: 10, y: 10 }];\nlet food = { x: 15, y: 15 };\nlet dx = 0;\nlet dy = 0;\nlet score = 0;\nlet gameRunning = true;\n\nfunction drawGame() {\n  if (!gameRunning) return;\n\n  // Clear canvas\n  ctx.fillStyle = '#0a0a0f';\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n  // Move snake\n  const head = { x: snake[0].x + dx, y: snake[0].y + dy };\n  \n  // Check wall collision\n  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {\n    gameOver();\n    return;\n  }\n\n  // Check self collision\n  if (snake.some(s => s.x === head.x && s.y === head.y)) {\n    gameOver();\n    return;\n  }\n\n  snake.unshift(head);\n\n  // Check food collision\n  if (head.x === food.x && head.y === food.y) {\n    score += 10;\n    scoreEl.textContent = score;\n    placeFood();\n  } else {\n    snake.pop();\n  }\n\n  // Draw snake\n  ctx.fillStyle = '#00f0ff';\n  snake.forEach((seg, i) => {\n    ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize - 2, gridSize - 2);\n    if (i === 0) {\n      ctx.fillStyle = '#00f0ff88';\n    }\n  });\n\n  // Draw food\n  ctx.fillStyle = '#ff006e';\n  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);\n}\n\nfunction placeFood() {\n  food = {\n    x: Math.floor(Math.random() * tileCount),\n    y: Math.floor(Math.random() * tileCount)\n  };\n  // Make sure food doesn't spawn on snake\n  if (snake.some(s => s.x === food.x && s.y === food.y)) {\n    placeFood();\n  }\n}\n\nfunction gameOver() {\n  gameRunning = false;\n  finalScoreEl.textContent = score;\n  gameOverEl.style.display = 'block';\n}\n\nfunction resetGame() {\n  snake = [{ x: 10, y: 10 }];\n  food = { x: 15, y: 15 };\n  dx = 0;\n  dy = 0;\n  score = 0;\n  scoreEl.textContent = score;\n  gameRunning = true;\n  gameOverEl.style.display = 'none';\n}\n\n// Controls\ndocument.addEventListener('keydown', e => {\n  if (!gameRunning) return;\n  \n  switch(e.key) {\n    case 'ArrowUp':\n      if (dy === 0) { dx = 0; dy = -1; }\n      break;\n    case 'ArrowDown':\n      if (dy === 0) { dx = 0; dy = 1; }\n      break;\n    case 'ArrowLeft':\n      if (dx === 0) { dx = -1; dy = 0; }\n      break;\n    case 'ArrowRight':\n      if (dx === 0) { dx = 1; dy = 0; }\n      break;\n  }\n});\n\n// Game loop\nsetInterval(drawGame, 100);\n" },
            ],
          },
        },
        
        blog: {
          name: 'Markdown Blog',
          tree: {
            id: 'root', name: 'blog', type: 'folder', expanded: true,
            children: [
              { id: uid(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Blog</title>\n  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n      background: #fafafa;\n      color: #333;\n      line-height: 1.6;\n    }\n    header {\n      background: white;\n      border-bottom: 1px solid #e0e0e0;\n      padding: 1.5rem 2rem;\n    }\n    header h1 { font-size: 1.5rem; }\n    .container {\n      max-width: 800px;\n      margin: 0 auto;\n      padding: 2rem;\n    }\n    .post-list { list-style: none; }\n    .post-item {\n      background: white;\n      padding: 2rem;\n      margin-bottom: 1.5rem;\n      border-radius: 8px;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n    .post-item h2 { margin-bottom: 0.5rem; }\n    .post-item h2 a { color: #333; text-decoration: none; }\n    .post-item h2 a:hover { color: #0070f3; }\n    .post-meta {\n      color: #666;\n      font-size: 0.9rem;\n      margin-bottom: 1rem;\n    }\n    .post-excerpt { color: #555; }\n    .read-more { color: #0070f3; text-decoration: none; }\n    \n    article {\n      background: white;\n      padding: 3rem;\n      border-radius: 8px;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n    article h1 { font-size: 2.5rem; margin-bottom: 1rem; }\n    article .meta {\n      color: #666;\n      margin-bottom: 2rem;\n      padding-bottom: 1rem;\n      border-bottom: 1px solid #e0e0e0;\n    }\n    article img { max-width: 100%; border-radius: 8px; }\n    article pre {\n      background: #f4f4f4;\n      padding: 1rem;\n      border-radius: 8px;\n      overflow-x: auto;\n    }\n    article code {\n      background: #f4f4f4;\n      padding: 0.2rem 0.4rem;\n      border-radius: 4px;\n      font-family: monospace;\n    }\n    article pre code { padding: 0; background: none; }\n    .back {\n      display: inline-block;\n      margin-bottom: 1rem;\n      color: #666;\n      text-decoration: none;\n    }\n    .back:hover { color: #0070f3; }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>📖 My Blog</h1>\n  </header>\n  <div class="container" id="app"></div>\n  <script src="blog.js"></script>\n</body>\n</html>\n' },
              { id: uid(), name: 'blog.js', type: 'file', content: "const posts = [\n  {\n    id: 1,\n    title: 'Getting Started with Web Development',\n    date: '2024-01-15',\n    author: 'Jane Doe',\n    excerpt: 'Learn the fundamentals of HTML, CSS, and JavaScript...',\n    content: `\n# Getting Started with Web Development\n\nWeb development is an exciting field that combines creativity with technical skills. In this post, we\'ll explore the three pillars of web development.\n\n## HTML: The Structure\n\nHTML (HyperText Markup Language) provides the structure for web pages.\n\n\\`\\`\\`html\n<h1>Hello, World!</h1>\n<p>This is a paragraph.</p>\n\\`\\`\\`\n\n## CSS: The Style\n\nCSS (Cascading Style Sheets) controls the appearance of your web pages.\n\n## JavaScript: The Behavior\n\nJavaScript adds interactivity to your websites.\n\nStay tuned for more tutorials!\n`\n  },\n  {\n    id: 2,\n    title: 'Why I Love React',\n    date: '2024-01-10',\n    author: 'Jane Doe',\n    excerpt: 'React has revolutionized how we build user interfaces...',\n    content: `\n# Why I Love React\n\nReact is a JavaScript library for building user interfaces. Here are my favorite features:\n\n- **Components**: Reusable pieces of UI\n- **Virtual DOM**: Efficient updates\n- **Hooks**: Manage state and side effects\n\n\\`\\`\\`jsx\nfunction App() {\n  return <h1>Hello, React!</h1>;\n}\n\\`\\`\\`\n\nGive React a try!\n`\n  }\n];\n\nfunction renderPostList() {\n  const app = document.getElementById('app');\n  app.innerHTML = \`\n    <ul class=\"post-list\">\n      \${posts.map(post => \`\n        <li class=\"post-item\">\n          <h2><a href=\"#\" onclick=\"renderPost(${post.id})\">${post.title}</a></h2>\n          <div class=\"post-meta\">\n            ${post.date} • by ${post.author}\n          </div>\n          <p class=\"post-excerpt\">${post.excerpt}</p>\n          <a href=\"#\" class=\"read-more\" onclick=\"renderPost(${post.id})\">Read more →</a>\n        </li>\n      \`).join('')}\n    </ul>\n  \`;\n}\n\nfunction renderPost(id) {\n  const post = posts.find(p => p.id === id);\n  if (!post) return;\n  \n  const app = document.getElementById('app');\n  app.innerHTML = \`\n    <a href=\"#\" class=\"back\" onclick=\"renderPostList()\">← Back to posts</a>\n    <article>\n      <h1>${post.title}</h1>\n      <div class=\"meta\">${post.date} • by ${post.author}</div>\n      <div class=\"content\">${marked.parse(post.content)}</div>\n    </article>\n  \`;\n}\n\n// Initial render\nrenderPostList();\n" },
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
      const codeLibraries = get().codeLibraries || [];
      const selectedLibrary = get().codeLibraries.find((lib) => lib.id === get().activeCodeLibraryId);
      if (codeLibraries.length > 0) {
        parts.push('\n## Code Library Templates');
        codeLibraries.forEach((lib) => {
          const marker = lib.id === get().activeCodeLibraryId ? ' (selected)' : '';
          parts.push(`- ${lib.name}${marker}: ${lib.description || ''}`);
        });
        if (selectedLibrary) {
          parts.push('\n### Selected Library Guidance');
          parts.push(`Use the selected library: ${selectedLibrary.name}. Prefer its patterns when generating or refactoring code.`);
        }
      }

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
