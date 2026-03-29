import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Zap, Send, Code, MessageSquare, SplitSquareHorizontal, Play, Copy, Download, 
  GitBranch, CheckSquare, Layout, Lightbulb, Save, FolderOpen, Sparkles,
  ChevronRight, ChevronDown, Plus, Trash2, Edit3, Eye, FileArchive, Cloud
} from 'lucide-react';
import ReactFlow, { 
  Background, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge,
  Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN-FIRST VIBE CODING
// Conversation-driven architecture with visual logic mapping
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_MESSAGES = [
  { 
    role: 'system', 
    content: "👋 Welcome to Design-First Vibe Coding!\n\nI'll help you architect your project before writing any code. We'll:\n1️⃣ Discover what you want to build\n2️⃣ Map out the logic visually\n3️⃣ Create a feature checklist\n4️⃣ Generate clean, structured code\n\nWhat would you like to create today?"
  }
];

const CONVERSATION_TEMPLATES = {
  web_app: {
    name: "Web Application",
    icon: "🌐",
    questions: [
      {
        id: "auth",
        question: "Do users need to log in?",
        type: "single",
        options: [
          { value: "none", label: "No auth - public access", description: "Everyone sees the same content" },
          { value: "simple", label: "Simple login (email/password)", description: "Basic user accounts" },
          { value: "oauth", label: "Social login (Google/GitHub)", description: "Quick signup with existing accounts" },
          { value: "full", label: "Full auth system", description: "Login, signup, password reset, email verification" }
        ]
      },
      {
        id: "data_storage",
        question: "How should data be stored?",
        type: "single",
        options: [
          { value: "local", label: "Local storage only", description: "Data stays in user's browser" },
          { value: "firebase", label: "Firebase (real-time)", description: "Cloud database with live sync" },
          { value: "api", label: "Custom API", description: "Your own backend server" },
          { value: "none", label: "No data storage", description: "Static content only" }
        ]
      },
      {
        id: "ui_complexity",
        question: "What's the UI complexity?",
        type: "single",
        options: [
          { value: "simple", label: "Simple - few pages", description: "Landing page, about, contact" },
          { value: "dashboard", label: "Dashboard-style", description: "Sidebar navigation, data tables, charts" },
          { value: "complex", label: "Complex application", description: "Multi-step forms, real-time updates, rich interactions" }
        ]
      }
    ]
  },
  game: {
    name: "Game",
    icon: "🎮",
    questions: [
      {
        id: "game_type",
        question: "What type of game?",
        type: "single",
        options: [
          { value: "puzzle", label: "Puzzle/Logic", description: "Sudoku, matching, word games" },
          { value: "action", label: "Action/Arcade", description: "Platformer, shooter, rhythm" },
          { value: "rpg", label: "RPG/Adventure", description: "Story-driven, character progression" },
          { value: "strategy", label: "Strategy", description: "Turn-based, tower defense, simulation" }
        ]
      },
      {
        id: "multiplayer",
        question: "Multiplayer support?",
        type: "single",
        options: [
          { value: "single", label: "Single player only", description: "One player, local experience" },
          { value: "local", label: "Local multiplayer", description: "Multiple players on same device" },
          { value: "online", label: "Online multiplayer", description: "Players connect over internet" }
        ]
      },
      {
        id: "persistence",
        question: "Save progress?",
        type: "single",
        options: [
          { value: "none", label: "No saving", description: "Fresh start every time" },
          { value: "local", label: "Local save", description: "Progress saved in browser" },
          { value: "cloud", label: "Cloud save", description: "Progress synced across devices" }
        ]
      }
    ]
  },
  tool: {
    name: "Utility Tool",
    icon: "🛠️",
    questions: [
      {
        id: "tool_type",
        question: "What kind of tool?",
        type: "single",
        options: [
          { value: "converter", label: "File Converter", description: "Convert between formats" },
          { value: "calculator", label: "Calculator", description: "Math, finance, scientific" },
          { value: "generator", label: "Generator", description: "Passwords, names, colors, etc" },
          { value: "organizer", label: "Organizer", description: "Tasks, notes, bookmarks" }
        ]
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIC GRAPH COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const nodeTypes = {
  start: ({ data }) => (
    <div className="px-4 py-2 bg-green-600 rounded-full text-white text-sm font-medium border-2 border-green-400 shadow-lg">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      🚀 {data.label}
    </div>
  ),
  decision: ({ data }) => (
    <div className="px-4 py-3 bg-amber-600 rounded-lg text-white text-sm font-medium border-2 border-amber-400 shadow-lg transform rotate-0">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" className="w-3 h-3 !bg-green-400" />
      <Handle type="source" position={Position.Right} id="no" className="w-3 h-3 !bg-red-400" />
    </div>
  ),
  action: ({ data }) => (
    <div className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium border-2 border-blue-400 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  ),
  page: ({ data }) => (
    <div className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-medium border-2 border-purple-400 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Layout className="w-4 h-4" />
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  ),
  end: ({ data }) => (
    <div className="px-4 py-2 bg-red-600 rounded-full text-white text-sm font-medium border-2 border-red-400 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      🏁 {data.label}
    </div>
  )
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function VibeCodingWindow({ onAIChat }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [view, setView] = useState('design'); // design | code | chat | split
  const [code, setCode] = useState('// Your code will appear here after design approval...\n');
  const [language, setLanguage] = useState('javascript');
  
  // Design phase state
  const [designPhase, setDesignPhase] = useState('discovery'); // discovery | mapping | checklist | implementation
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [features, setFeatures] = useState([]);
  const [logicGraph, setLogicGraph] = useState({ nodes: [], edges: [] });
  const [designApproved, setDesignApproved] = useState(false);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Design Logic Generation ─────────────────────────────────────────────────
  
  const generateLogicGraph = useCallback((templateId, userAnswers) => {
    const newNodes = [
      { id: 'start', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start' } }
    ];
    const newEdges = [];
    let yOffset = 100;
    let lastNodeId = 'start';

    // Generate nodes based on answers
    if (userAnswers.auth && userAnswers.auth !== 'none') {
      newNodes.push({
        id: 'auth-check',
        type: 'decision',
        position: { x: 250, y: yOffset },
        data: { label: 'Authenticated?' }
      });
      newEdges.push({ id: `e-${lastNodeId}-auth-check`, source: lastNodeId, target: 'auth-check' });
      
      // Yes branch
      newNodes.push({
        id: 'dashboard',
        type: 'page',
        position: { x: 150, y: yOffset + 100 },
        data: { label: 'Dashboard' }
      });
      newEdges.push({ 
        id: 'e-auth-check-dashboard', 
        source: 'auth-check', 
        target: 'dashboard', 
        sourceHandle: 'yes',
        label: 'Yes',
        style: { stroke: '#4ade80' }
      });
      
      // No branch
      newNodes.push({
        id: 'login',
        type: 'page',
        position: { x: 350, y: yOffset + 100 },
        data: { label: 'Login Page' }
      });
      newEdges.push({ 
        id: 'e-auth-check-login', 
        source: 'auth-check', 
        target: 'login', 
        sourceHandle: 'no',
        label: 'No',
        style: { stroke: '#f87171' }
      });
      
      yOffset += 200;
      lastNodeId = 'dashboard';
    }

    // Add data storage node if applicable
    if (userAnswers.data_storage && userAnswers.data_storage !== 'none') {
      newNodes.push({
        id: 'data-fetch',
        type: 'action',
        position: { x: 250, y: yOffset },
        data: { label: `Fetch from ${userAnswers.data_storage}` }
      });
      newEdges.push({ id: `e-${lastNodeId}-data-fetch`, source: lastNodeId, target: 'data-fetch' });
      yOffset += 100;
      lastNodeId = 'data-fetch';
    }

    // End node
    newNodes.push({
      id: 'end',
      type: 'end',
      position: { x: 250, y: yOffset },
      data: { label: 'Complete' }
    });
    newEdges.push({ id: `e-${lastNodeId}-end`, source: lastNodeId, target: 'end' });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const generateFeatures = useCallback((templateId, userAnswers) => {
    const newFeatures = [];
    
    // Auth features
    if (userAnswers.auth === 'simple') {
      newFeatures.push(
        { id: 'auth-login', category: 'Core', name: 'Login form with validation', priority: 'high', checked: true },
        { id: 'auth-signup', category: 'Core', name: 'Registration form', priority: 'high', checked: true },
        { id: 'auth-jwt', category: 'Core', name: 'JWT token management', priority: 'high', checked: true }
      );
    } else if (userAnswers.auth === 'oauth') {
      newFeatures.push(
        { id: 'auth-google', category: 'Core', name: 'Google OAuth integration', priority: 'high', checked: true },
        { id: 'auth-github', category: 'Core', name: 'GitHub OAuth integration', priority: 'medium', checked: false },
        { id: 'auth-session', category: 'Core', name: 'Session management', priority: 'high', checked: true }
      );
    } else if (userAnswers.auth === 'full') {
      newFeatures.push(
        { id: 'auth-login', category: 'Core', name: 'Login/Register forms', priority: 'high', checked: true },
        { id: 'auth-verify', category: 'Core', name: 'Email verification', priority: 'high', checked: true },
        { id: 'auth-reset', category: 'Core', name: 'Password reset flow', priority: 'high', checked: true },
        { id: 'auth-2fa', category: 'Security', name: 'Two-factor authentication', priority: 'low', checked: false }
      );
    }

    // Data features
    if (userAnswers.data_storage === 'firebase') {
      newFeatures.push(
        { id: 'db-firebase', category: 'Backend', name: 'Firebase configuration', priority: 'high', checked: true },
        { id: 'db-realtime', category: 'Backend', name: 'Real-time sync', priority: 'medium', checked: false }
      );
    }

    // UI features
    if (userAnswers.ui_complexity === 'dashboard') {
      newFeatures.push(
        { id: 'ui-sidebar', category: 'UI', name: 'Sidebar navigation', priority: 'high', checked: true },
        { id: 'ui-responsive', category: 'UI', name: 'Responsive layout', priority: 'high', checked: true }
      );
    }

    setFeatures(newFeatures);
  }, []);

  // ── Export Functions ───────────────────────────────────────────────────────
  
  const exportAsZip = async () => {
    const zip = new JSZip();
    
    // Add code file
    const ext = { javascript: 'js', typescript: 'ts', python: 'py', html: 'html' }[language] || 'txt';
    zip.file(`project/main.${ext}`, code);
    
    // Add design document
    const designDoc = {
      template: selectedTemplate,
      answers: answers,
      features: features,
      generatedAt: new Date().toISOString()
    };
    zip.file('design.json', JSON.stringify(designDoc, null, 2));
    
    // Add README
    zip.file('README.md', `# Generated Project

## Design Overview
- Template: ${CONVERSATION_TEMPLATES[selectedTemplate]?.name || 'Custom'}
- Features: ${features.length}
- Generated: ${new Date().toLocaleDateString()}

## Getting Started
1. Extract this ZIP
2. Open main.${ext} in your editor
3. Run the project according to your setup

## Features
${features.map(f => `- [${f.checked ? 'x' : ' '}] ${f.name}`).join('\n')}
`);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `vibe-project-${Date.now()}.zip`);
  };

  const exportToGoogleDrive = async () => {
    // This would integrate with Google Drive API
    // For now, show a message about the feature
    alert('Google Drive integration coming soon!\n\nFor now, download the ZIP and upload manually.');
  };

  const saveDesignJson = () => {
    const designData = {
      version: '1.0',
      created: new Date().toISOString(),
      template: selectedTemplate,
      answers: answers,
      features: features,
      code: code,
      language: language
    };
    
    const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' });
    saveAs(blob, `vibe-design-${Date.now()}.json`);
  };

  const loadDesignJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setSelectedTemplate(data.template);
        setAnswers(data.answers || {});
        setFeatures(data.features || []);
        setCode(data.code || '');
        setLanguage(data.language || 'javascript');
        setDesignPhase('implementation');
        alert('Design loaded successfully!');
      } catch (err) {
        alert('Invalid design file');
      }
    };
    reader.readAsText(file);
  };

  // ── Chat Handlers ───────────────────────────────────────────────────────────

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setAnswers({});
    setDesignPhase('discovery');
    
    const template = CONVERSATION_TEMPLATES[templateId];
    setMessages(prev => [...prev, 
      { role: 'user', content: `I want to build a ${template.name}` },
      { role: 'system', content: `Great choice! Let's design your ${template.name.toLowerCase()}. I'll ask a few questions to understand what you need.\n\n${template.questions[0].question}`, question: template.questions[0] }
    ]);
  };

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    const template = CONVERSATION_TEMPLATES[selectedTemplate];
    const currentQuestionIndex = template.questions.findIndex(q => q.id === questionId);
    const nextQuestion = template.questions[currentQuestionIndex + 1];
    
    if (nextQuestion) {
      setMessages(prev => [...prev,
        { role: 'user', content: template.questions[currentQuestionIndex].options.find(o => o.value === value)?.label },
        { role: 'system', content: nextQuestion.question, question: nextQuestion }
      ]);
    } else {
      // All questions answered - generate design
      setMessages(prev => [...prev,
        { role: 'user', content: template.questions[currentQuestionIndex].options.find(o => o.value === value)?.label },
        { role: 'system', content: '🎉 Design discovery complete! I\'ve generated a logic map and feature checklist. Switch to the **Design** tab to review and approve before we build.' }
      ]);
      generateLogicGraph(selectedTemplate, newAnswers);
      generateFeatures(selectedTemplate, newAnswers);
      setDesignPhase('mapping');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (onAIChat && designApproved) {
      setMessages(prev => [...prev, { role: 'system', content: 'Thinking...', loading: true }]);
      try {
        const context = `Project design:\nTemplate: ${CONVERSATION_TEMPLATES[selectedTemplate]?.name}\nFeatures: ${features.map(f => f.name).join(', ')}\n\nCurrent code:\n${code}`;
        const result = await onAIChat(`${context}\n\nUser request: ${input.trim()}`, 'coding');
        
        setMessages(prev => [...prev.slice(0, -1), { 
          role: 'assistant', 
          content: result?.response || 'I\'ve updated the code based on your request.' 
        }]);
        
        // Extract code if present
        if (result?.code) {
          setCode(result.code);
        }
      } catch (err) {
        setMessages(prev => [...prev.slice(0, -1), { 
          role: 'assistant', 
          content: 'Sorry, I had trouble processing that. Please try again.' 
        }]);
      }
    } else if (!designApproved) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Please complete the design phase first! Answer the questions above, then review the logic map and feature checklist in the Design tab before we start coding.' 
      }]);
    }
  };

  const handleApproveDesign = async () => {
    setDesignApproved(true);
    setDesignPhase('implementation');
    setView('code');
    
    // Generate initial code
    if (onAIChat) {
      const featureList = features.filter(f => f.checked).map(f => f.name).join(', ');
      const prompt = `Generate a complete ${language} project with these features: ${featureList}. 
        Template: ${CONVERSATION_TEMPLATES[selectedTemplate]?.name}.
        Include proper file structure, comments, and best practices.`;
      
      try {
        const result = await onAIChat(prompt, 'coding');
        if (result?.code || result?.response) {
          setCode(result.code || result.response);
        }
      } catch (err) {
        console.error('Code generation failed:', err);
      }
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────

  const CodePanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0 flex items-center gap-2">
        <Code className="w-4 h-4 text-lime-400" />
        <select 
          value={language} 
          onChange={e => setLanguage(e.target.value)}
          className="bg-transparent border-none text-xs text-slate-300 focus:outline-none"
        >
          {['javascript', 'typescript', 'python', 'html', 'css', 'react'].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{code.split('\n').length} lines</span>
        <button onClick={() => navigator.clipboard.writeText(code)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400" title="Copy">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={exportAsZip} className="p-1.5 hover:bg-slate-800 rounded text-slate-400" title="Export ZIP">
          <FileArchive className="w-4 h-4" />
        </button>
        <button onClick={exportToGoogleDrive} className="p-1.5 hover:bg-slate-800 rounded text-slate-400" title="Save to Google Drive">
          <Cloud className="w-4 h-4" />
        </button>
      </div>
      <textarea 
        value={code} 
        onChange={e => setCode(e.target.value)}
        className="flex-1 p-4 bg-transparent font-mono text-sm text-lime-100 resize-none focus:outline-none leading-relaxed"
        spellCheck={false}
        placeholder="// Your code will appear here after design approval..."
      />
    </div>
  );

  const ChatPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Template Selector - Only show at start */}
        {!selectedTemplate && (
          <div className="grid grid-cols-1 gap-3">
            <p className="text-sm text-slate-400 mb-2">What would you like to build?</p>
            {Object.entries(CONVERSATION_TEMPLATES).map(([id, template]) => (
              <button
                key={id}
                onClick={() => handleTemplateSelect(id)}
                className="flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-lime-500/50 transition-all text-left group"
              >
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-lime-400">{template.name}</div>
                  <div className="text-xs text-slate-500">{template.questions.length} questions</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 ml-auto group-hover:text-lime-400" />
              </button>
            ))}
          </div>
        )}
        
        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-lime-600/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-lime-400" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-lime-600/20 text-lime-100'
                : m.loading
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-800 text-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              
              {/* Question options */}
              {m.question && (
                <div className="mt-3 space-y-2">
                  {m.question.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(m.question.id, opt.value)}
                      className="w-full text-left p-3 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-lime-500/50 transition-all"
                    >
                      <div className="font-medium text-slate-200">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                <span className="text-xs">You</span>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={designApproved ? "Ask me to modify the code..." : "Select a template above to start..."}
            disabled={!selectedTemplate}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-500/50 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !selectedTemplate}
            className="px-4 bg-lime-600 hover:bg-lime-500 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const DesignPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Design Phase Tabs */}
      <div className="flex items-center px-4 py-2 bg-slate-900 border-b border-slate-800 gap-1">
        {['discovery', 'mapping', 'checklist', 'implementation'].map((phase) => (
          <button
            key={phase}
            onClick={() => setDesignPhase(phase)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              designPhase === phase
                ? 'bg-lime-600/20 text-lime-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {phase === 'discovery' && <Lightbulb className="w-3 h-3 inline mr-1" />}
            {phase === 'mapping' && <GitBranch className="w-3 h-3 inline mr-1" />}
            {phase === 'checklist' && <CheckSquare className="w-3 h-3 inline mr-1" />}
            {phase === 'implementation' && <Code className="w-3 h-3 inline mr-1" />}
            {phase}
          </button>
        ))}
        
        <div className="flex-1" />
        
        {/* Import/Export Design */}
        <button onClick={saveDesignJson} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400" title="Save Design">
          <Save className="w-4 h-4" />
        </button>
        <label className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer" title="Load Design">
          <FolderOpen className="w-4 h-4" />
          <input type="file" accept=".json" onChange={loadDesignJson} className="hidden" />
        </label>
        
        {!designApproved && features.length > 0 && (
          <button
            onClick={handleApproveDesign}
            className="px-4 py-1.5 bg-lime-600 hover:bg-lime-500 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Approve & Build
          </button>
        )}
      </div>

      {/* Phase Content */}
      <div className="flex-1 overflow-auto">
        {designPhase === 'discovery' && (
          <div className="p-6 text-center">
            <Lightbulb className="w-16 h-16 text-lime-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Discovery Phase</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Answer a few questions about what you want to build. This helps me understand your requirements before we design the architecture.
            </p>
            {!selectedTemplate && (
              <p className="text-lime-400 mt-4">Select a template in the Chat tab to get started!</p>
            )}
          </div>
        )}

        {designPhase === 'mapping' && (
          <div className="h-full">
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background color="#334155" gap={16} />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
              </ReactFlow>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <GitBranch className="w-12 h-12 mb-3 opacity-50" />
                <p>Complete the discovery phase to generate the logic map</p>
              </div>
            )}
          </div>
        )}

        {designPhase === 'checklist' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-lime-400" />
              Feature Checklist
            </h3>
            {features.length > 0 ? (
              <div className="space-y-4">
                {['Core', 'Security', 'Backend', 'UI', 'Polish'].map(category => {
                  const categoryFeatures = features.filter(f => f.category === category);
                  if (categoryFeatures.length === 0) return null;
                  return (
                    <div key={category} className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">{category}</h4>
                      <div className="space-y-2">
                        {categoryFeatures.map(feature => (
                          <label key={feature.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.checked}
                              onChange={() => {
                                setFeatures(features.map(f => 
                                  f.id === feature.id ? { ...f, checked: !f.checked } : f
                                ));
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-lime-600 focus:ring-lime-500"
                            />
                            <span className={`flex-1 ${feature.checked ? 'text-slate-300' : 'text-slate-500'}`}>
                              {feature.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              feature.priority === 'high' ? 'bg-red-900/50 text-red-400' :
                              feature.priority === 'medium' ? 'bg-amber-900/50 text-amber-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {feature.priority}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500">Complete discovery to generate feature checklist</p>
            )}
          </div>
        )}

        {designPhase === 'implementation' && (
          <CodePanel />
        )}
      </div>
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-lime-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-600/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Vibe Coding</h1>
            <p className="text-xs text-slate-500">Design-first AI development</p>
          </div>
          {designApproved && (
            <span className="px-2 py-0.5 bg-lime-600/20 text-lime-400 text-xs rounded-full border border-lime-600/30">
              ✓ Design Approved
            </span>
          )}
        </div>
        
        {/* View Toggles */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
          <button
            onClick={() => setView('design')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              view === 'design' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            Design
          </button>
          <button
            onClick={() => setView('code')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              view === 'code' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
          <button
            onClick={() => setView('chat')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              view === 'chat' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setView('split')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
              view === 'split' ? 'bg-lime-600/30 text-lime-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            Split
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {(view === 'design' || view === 'split') && <DesignPanel />}
        {view === 'split' && <div className="w-px bg-slate-800" />}
        {(view === 'chat' || view === 'split') && <ChatPanel />}
        {view === 'code' && <CodePanel />}
      </div>
    </div>
  );
}
