import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Zap } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const initialOutput = [
  { type: 'system', content: 'AI Terminal v1.0.0' },
  { type: 'system', content: 'Type "help" for available commands' },
  { type: 'prompt', content: '' },
];

const commands = {
  help: 'Available commands: help, clear, ls, pwd, whoami, date, echo, ai',
  clear: '__CLEAR__',
  ls: 'Desktop\nDocuments\nDownloads\nprojects\nscripts',
  pwd: '/home/user',
  whoami: 'ai-developer',
  date: () => new Date().toString(),
  ai: 'AI command processor ready. In full version, this would execute AI-controlled actions.',
};

export default function TerminalWindow() {
  const [output, setOutput] = useState(initialOutput);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to history
    setHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Add command to output
    setOutput(prev => [
      ...prev.filter(item => item.type !== 'prompt'),
      { type: 'command', content: `$ ${trimmedCmd}` },
    ]);

    // Parse command
    const [baseCmd, ...args] = trimmedCmd.split(' ');

    if (baseCmd === 'clear') {
      setOutput([{ type: 'prompt', content: '' }]);
      return;
    }

    // Execute command
    let result;
    if (baseCmd === 'echo') {
      result = args.join(' ');
    } else if (commands[baseCmd]) {
      result = typeof commands[baseCmd] === 'function' 
        ? commands[baseCmd]() 
        : commands[baseCmd];
    } else {
      result = `Command not found: ${baseCmd}. Type "help" for available commands.`;
    }

    // Add result and new prompt
    setOutput(prev => [
      ...prev,
      { type: 'output', content: result },
      { type: 'prompt', content: '' },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e14] text-[#b3b1ad] font-mono" onClick={() => inputRef.current?.focus()}>
      {/* Terminal Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#0d1117] border-b border-primary/20">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
        </div>
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">AI Terminal</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-success" />
          <span>Ready</span>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea ref={scrollRef} className="flex-1 scrollbar-custom">
        <div className="p-4 space-y-1">
          {output.map((item, index) => {
            if (item.type === 'system') {
              return (
                <div key={index} className="text-primary">
                  {item.content}
                </div>
              );
            }
            if (item.type === 'command') {
              return (
                <div key={index} className="text-success">
                  {item.content}
                </div>
              );
            }
            if (item.type === 'output') {
              return (
                <div key={index} className="whitespace-pre-wrap text-[#b3b1ad]">
                  {item.content}
                </div>
              );
            }
            return null;
          })}

          {/* Input Line */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-success">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-[#b3b1ad] caret-primary"
              autoFocus
              spellCheck={false}
            />
          </form>
        </div>
      </ScrollArea>
    </div>
  );
}
