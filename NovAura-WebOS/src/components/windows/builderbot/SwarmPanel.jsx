import React, { useState, useEffect } from 'react';
import { 
  Bot, Play, Pause, RotateCcw, CheckCircle, AlertCircle, 
  Clock, FileCode, Users, Zap, Download, FolderOpen,
  ChevronDown, ChevronRight, Terminal, Cpu, Sparkles
} from 'lucide-react';
import { SwarmEngine, AGENT_TYPES } from './SwarmEngine';

export default function SwarmPanel({ onFilesGenerated }) {
  const [swarm] = useState(() => new SwarmEngine());
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedAgents, setExpandedAgents] = useState({});

  // Poll status while running
  useEffect(() => {
    if (!isRunning || !currentProject) return;

    const interval = setInterval(() => {
      const currentStatus = swarm.getProjectStatus(currentProject.projectId);
      setStatus(currentStatus);

      if (currentStatus && currentStatus.working === 0 && currentStatus.pending === 0) {
        // Project complete
        const files = swarm.getProjectFiles(currentProject.projectId);
        setGeneratedFiles(Object.entries(files).map(([path, content]) => ({
          path,
          content,
          size: content.length
        })));
        setIsRunning(false);
        
        if (onFilesGenerated) {
          onFilesGenerated(files);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentProject, swarm, onFilesGenerated]);

  const startSwarm = async () => {
    if (!prompt.trim()) return;

    setIsRunning(true);
    setLogs([]);
    setGeneratedFiles([]);

    addLog('🚀 Initializing Agent Swarm...', 'system');

    try {
      const project = await swarm.startProject(prompt, {
        name: prompt.substring(0, 30) + '...'
      });

      setCurrentProject(project);
      addLog(`✅ Project created: ${project.projectId}`, 'success');
      addLog(`🤖 Spawning agents...`, 'info');
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error');
      setIsRunning(false);
    }
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      type
    }]);
  };

  const toggleAgentExpand = (agentType) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentType]: !prev[agentType]
    }));
  };

  const exportFiles = () => {
    if (generatedFiles.length === 0) return;

    const files = {};
    generatedFiles.forEach(f => {
      files[f.path] = f.content;
    });

    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swarm-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAgentIcon = (type) => {
    switch (type) {
      case 'frontend': return <FileCode className="w-4 h-4" />;
      case 'backend': return <Cpu className="w-4 h-4" />;
      case 'designer': return <Sparkles className="w-4 h-4" />;
      case 'content': return <Terminal className="w-4 h-4" />;
      case 'qa': return <CheckCircle className="w-4 h-4" />;
      case 'art': return <Zap className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Agent Swarm</span>
        </div>
        
        {status && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400">
              {status.agents} agents
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-400/20 text-green-400">
              {status.completed} done
            </span>
            {status.working > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
                {status.working} working
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div className="p-2 border-b border-[#2a2a4a]">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build... e.g., 'Build me a todo app with React and Firebase'"
          disabled={isRunning}
          className="w-full bg-[#252540] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none resize-none h-20 disabled:opacity-50"
        />
        <button
          onClick={startSwarm}
          disabled={isRunning || !prompt.trim()}
          className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-400/20 text-purple-400 rounded text-[10px] hover:bg-purple-400/30 disabled:opacity-50"
        >
          {isRunning ? (
            <><RotateCcw className="w-3 h-3 animate-spin" /> Swarm Working...</>
          ) : (
            <><Play className="w-3 h-3" /> Start Agent Swarm</>
          )}
        </button>
      </div>

      {/* Progress / Logs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isRunning && status && (
          <div className="p-2 bg-[#252540] border-b border-[#2a2a4a]">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-gray-400">Progress</span>
              <span className="text-purple-400">
                {Math.round((status.completed / status.totalTasks) * 100)}%
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded overflow-hidden">
              <div 
                className="h-full bg-purple-400 transition-all duration-300"
                style={{ width: `${(status.completed / status.totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Agent Status */}
        {isRunning && (
          <div className="p-2 border-b border-[#2a2a4a] max-h-32 overflow-y-auto">
            <p className="text-[9px] text-gray-500 mb-1">Active Agents</p>
            {Object.entries(AGENT_TYPES).map(([type, config]) => (
              <div 
                key={type}
                onClick={() => toggleAgentExpand(type)}
                className="flex items-center gap-2 p-1 rounded hover:bg-white/5 cursor-pointer"
              >
                <span className="text-purple-400">{getAgentIcon(type)}</span>
                <span className="text-[10px] flex-1">{config.name}</span>
                <span className="text-[9px] text-gray-500">{config.specialty}</span>
              </div>
            ))}
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[9px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Agent swarm ready</p>
              <p className="text-gray-700">Enter a prompt to start</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i}
                className={`py-0.5 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'system' ? 'text-purple-400' :
                  'text-gray-400'
                }`}
              >
                <span className="text-gray-600">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Generated Files */}
      {generatedFiles.length > 0 && (
        <div className="border-t border-[#2a2a4a] max-h-48 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
            <span className="text-[10px] text-gray-500">Generated Files ({generatedFiles.length})</span>
            <button
              onClick={exportFiles}
              className="flex items-center gap-1 text-[9px] text-purple-400 hover:text-purple-300"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {generatedFiles.map((file, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedFile(selectedFile === file ? null : file)}
                  className={`p-1.5 rounded cursor-pointer ${
                    selectedFile === file ? 'bg-purple-400/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] truncate flex-1">{file.path}</span>
                    <span className="text-[8px] text-gray-600">
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                  
                  {selectedFile === file && (
                    <div className="mt-2 p-2 bg-[#0a0a14] rounded">
                      <pre className="text-[8px] text-gray-400 overflow-x-auto">
                        {file.content.substring(0, 500)}
                        {file.content.length > 500 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
