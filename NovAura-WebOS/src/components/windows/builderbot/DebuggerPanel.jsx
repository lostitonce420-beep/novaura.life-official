import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, SkipForward, SkipBack, RotateCcw,
  Bug, Eye, EyeOff, ChevronRight, ChevronDown, Terminal,
  AlertCircle, CheckCircle, Layers, Hash, Type, Box
} from 'lucide-react';

export default function DebuggerPanel({ 
  isDebugging = false,
  onStartDebug,
  onPauseDebug,
  onStopDebug,
  onStepOver,
  onStepInto,
  onStepOut,
  currentFile,
  breakpoints = [],
  callStack = [],
  variables = {},
  consoleOutput = []
}) {
  const [activeTab, setActiveTab] = useState('variables'); // variables, callstack, breakpoints, console
  const [expandedVars, setExpandedVars] = useState({});
  const [selectedBreakpoint, setSelectedBreakpoint] = useState(null);

  const toggleVarExpand = (path) => {
    setExpandedVars(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getValueType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueIcon = (type) => {
    switch (type) {
      case 'string': return <Type className="w-3 h-3 text-green-400" />;
      case 'number': return <Hash className="w-3 h-3 text-blue-400" />;
      case 'boolean': return <CheckCircle className="w-3 h-3 text-yellow-400" />;
      case 'object': 
      case 'array': return <Box className="w-3 h-3 text-purple-400" />;
      case 'function': return <Play className="w-3 h-3 text-pink-400" />;
      default: return <Box className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderValue = (value, path = '') => {
    const type = getValueType(value);
    
    if (type === 'object' || type === 'array') {
      const isExpanded = expandedVars[path];
      const entries = type === 'array' 
        ? value.map((v, i) => [i, v])
        : Object.entries(value);
      
      return (
        <div>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-white/5"
            onClick={() => toggleVarExpand(path)}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {getValueIcon(type)}
            <span className="text-[10px] text-gray-400">{type === 'array' ? `Array(${value.length})` : `Object`}</span>
          </div>
          {isExpanded && (
            <div className="pl-4 border-l border-gray-700 ml-1.5">
              {entries.map(([key, val]) => (
                <div key={key} className="flex items-start gap-2 py-0.5">
                  <span className="text-[10px] text-gray-500">{key}:</span>
                  {renderValue(val, `${path}.${key}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {getValueIcon(type)}
        <span className={`text-[10px] ${
          type === 'string' ? 'text-green-400' :
          type === 'number' ? 'text-blue-400' :
          type === 'boolean' ? 'text-yellow-400' :
          'text-gray-400'
        }`}>
          {type === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#2a2a4a]">
        {!isDebugging ? (
          <button
            onClick={onStartDebug}
            className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] hover:bg-green-500/30"
          >
            <Play className="w-3 h-3" /> Start Debugging
          </button>
        ) : (
          <>
            <button
              onClick={onPauseDebug}
              className="p-1 rounded hover:bg-white/10 text-yellow-400"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStopDebug}
              className="p-1 rounded hover:bg-white/10 text-red-400"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button
              onClick={onStepOver}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
              title="Step Over"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStepInto}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
              title="Step Into"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStepOut}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
              title="Step Out"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStartDebug}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a4a]">
        {[
          { id: 'variables', label: 'Variables', icon: Box },
          { id: 'callstack', label: 'Call Stack', icon: Layers },
          { id: 'breakpoints', label: 'Breakpoints', icon: AlertCircle },
          { id: 'console', label: 'Debug Console', icon: Terminal },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'variables' && (
          <div className="space-y-1">
            {Object.entries(variables).length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No variables</p>
                <p className="text-[10px] text-gray-700">
                  Start debugging to see variables
                </p>
              </div>
            ) : (
              Object.entries(variables).map(([name, value]) => (
                <div key={name} className="py-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-300 font-medium min-w-[80px]">{name}</span>
                    {renderValue(value, name)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'callstack' && (
          <div className="space-y-1">
            {callStack.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No call stack</p>
                <p className="text-[10px] text-gray-700">
                  Start debugging to see call stack
                </p>
              </div>
            ) : (
              callStack.map((frame, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-[10px] ${
                    i === 0 ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="font-medium">{frame.functionName || '(anonymous)'}</div>
                  <div className="text-gray-500 text-[9px]">
                    {frame.fileName}:{frame.lineNumber}:{frame.columnNumber}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'breakpoints' && (
          <div className="space-y-1">
            {breakpoints.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No breakpoints</p>
                <p className="text-[10px] text-gray-700">
                  Click in the gutter to set breakpoints
                </p>
              </div>
            ) : (
              breakpoints.map((bp, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedBreakpoint(bp)}
                  className={`p-2 rounded text-[10px] cursor-pointer ${
                    selectedBreakpoint === bp ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bp.enabled ? 'bg-red-400' : 'bg-gray-500'}`} />
                    <span className="flex-1 truncate">{bp.file}:{bp.line}</span>
                  </div>
                  {bp.condition && (
                    <div className="text-gray-500 text-[9px] mt-0.5 pl-4">
                      Condition: {bp.condition}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="font-mono text-[10px]">
            {consoleOutput.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">Debug console</p>
                <p className="text-[10px] text-gray-700">
                  Output will appear here
                </p>
              </div>
            ) : (
              consoleOutput.map((log, i) => (
                <div
                  key={i}
                  className={`py-0.5 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-yellow-400' :
                    log.type === 'info' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  {log.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
