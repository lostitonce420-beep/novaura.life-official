import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import useBuilderStore from './useBuilderStore';
import { runBuild } from './BuildRunner';
import { packageAsDesktopApp, packageAsZip } from './ExePackager';

// ── Sandboxed JS executor using hidden iframe ───────────────
// This creates a real isolated JavaScript execution environment
function createSandbox() {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.sandbox = 'allow-scripts';
  document.body.appendChild(iframe);
  return iframe;
}

function executeSandboxed(code, timeout = 5000) {
  return new Promise((resolve) => {
    const logs = [];
    const errors = [];

    const iframe = createSandbox();

    // Timeout guard
    const timer = setTimeout(() => {
      document.body.removeChild(iframe);
      resolve({ logs, errors: [...errors, 'Execution timed out (5s limit)'], result: undefined });
    }, timeout);

    // Listen for results from the sandbox
    const handler = (e) => {
      if (e.source !== iframe.contentWindow) return;
      const data = e.data;
      if (data?.type === 'sandbox-result') {
        clearTimeout(timer);
        window.removeEventListener('message', handler);
        document.body.removeChild(iframe);
        resolve({
          logs: data.logs || [],
          errors: data.errors || [],
          result: data.result,
        });
      }
    };
    window.addEventListener('message', handler);

    // Build the sandboxed execution script
    const wrappedCode = `
      <script>
        const __logs = [];
        const __errors = [];
        const __origConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info };

        console.log = (...args) => __logs.push({ level: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        console.warn = (...args) => __logs.push({ level: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        console.error = (...args) => __logs.push({ level: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        console.info = (...args) => __logs.push({ level: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });

        let __result;
        try {
          __result = eval(${JSON.stringify(code)});
          if (__result !== undefined) {
            __logs.push({ level: 'result', text: typeof __result === 'object' ? JSON.stringify(__result, null, 2) : String(__result) });
          }
        } catch (err) {
          __errors.push(err.message);
        }

        parent.postMessage({
          type: 'sandbox-result',
          logs: __logs,
          errors: __errors,
          result: __result !== undefined ? String(__result) : undefined,
        }, '*');
      </script>
    `;

    iframe.srcdoc = wrappedCode;
  });
}

// ── Line colors ─────────────────────────────────────────────
const lineColors = {
  system: 'text-gray-500',
  input: 'text-gray-300',
  log: 'text-gray-300',
  info: 'text-cyan-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  result: 'text-green-400',
};

export default function TerminalPanel() {
  const { terminalLines, addTerminalLine, clearTerminal } = useBuilderStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [terminalLines]);

  const handleRun = useCallback(async (cmd) => {
    if (!cmd.trim()) return;

    setHistory((prev) => [cmd, ...prev.slice(0, 50)]);
    setHistoryIdx(-1);
    addTerminalLine({ type: 'input', text: `> ${cmd}` });

    // Special commands
    if (cmd.trim() === 'clear') {
      clearTerminal();
      return;
    }
    if (cmd.trim() === 'help') {
      addTerminalLine({ type: 'system', text: 'Commands:' });
      addTerminalLine({ type: 'info', text: '  clear          Clear terminal' });
      addTerminalLine({ type: 'info', text: '  files          List project files' });
      addTerminalLine({ type: 'info', text: '  run            Run project (web → preview, other → compile)' });
      addTerminalLine({ type: 'info', text: '  run <file>     Run a specific file' });
      addTerminalLine({ type: 'info', text: '  build          Compile & run non-web project (Python/C/Rust/Go/...)' });
      addTerminalLine({ type: 'info', text: '  export         Download project as ZIP' });
      addTerminalLine({ type: 'info', text: '  package        Package as desktop app (Electron .exe)' });
      addTerminalLine({ type: 'system', text: 'Or type any JavaScript expression to execute it.' });
      return;
    }
    if (cmd.trim() === 'files') {
      const files = useBuilderStore.getState().flattenFiles();
      files.forEach((f) => addTerminalLine({ type: 'info', text: `  ${f.path}` }));
      return;
    }
    if (cmd.trim() === 'run') {
      useBuilderStore.getState().runProject();
      return;
    }
    if (cmd.trim().startsWith('run ')) {
      // Run a specific file's content in the sandbox
      const fileName = cmd.trim().slice(4);
      const files = useBuilderStore.getState().flattenFiles();
      const target = files.find(f => f.name === fileName || f.path === fileName);
      if (target) {
        addTerminalLine({ type: 'system', text: `Running ${target.path}...` });
        const result = await executeSandboxed(target.content || '');
        result.logs.forEach((log) => addTerminalLine({ type: log.level, text: log.text }));
        result.errors.forEach((err) => addTerminalLine({ type: 'error', text: err }));
        return;
      } else {
        addTerminalLine({ type: 'error', text: `File not found: ${fileName}` });
        return;
      }
    }

    if (cmd.trim() === 'build') {
      const files = useBuilderStore.getState().flattenFiles();
      addTerminalLine({ type: 'system', text: 'Building project...' });
      const result = await runBuild(files, (log) => addTerminalLine(log));
      if (result.stdout) result.stdout.split('\n').forEach(l => l && addTerminalLine({ type: 'log', text: l }));
      if (result.stderr) result.stderr.split('\n').forEach(l => l && addTerminalLine({ type: 'error', text: l }));
      addTerminalLine({ type: result.exitCode === 0 ? 'info' : 'error', text: `Exit code ${result.exitCode} (${result.duration}ms)` });
      return;
    }
    if (cmd.trim() === 'export') {
      const { flattenFiles: ff, projectName: pn } = useBuilderStore.getState();
      const res = packageAsZip(ff(), pn);
      addTerminalLine({ type: 'info', text: `Exported ${res.fileCount} files → ${res.fileName}` });
      return;
    }
    if (cmd.trim() === 'package') {
      const { flattenFiles: ff, projectName: pn } = useBuilderStore.getState();
      const res = packageAsDesktopApp(ff(), pn);
      addTerminalLine({ type: 'info', text: `Desktop package downloaded: ${res.fileName} (${res.fileCount} files)` });
      addTerminalLine({ type: 'system', text: 'Extract ZIP → npm install → npm run package → .exe in /dist' });
      return;
    }

    // Execute JS in sandbox
    const result = await executeSandboxed(cmd);

    result.logs.forEach((log) => {
      addTerminalLine({ type: log.level, text: log.text });
    });
    result.errors.forEach((err) => {
      addTerminalLine({ type: 'error', text: err });
    });
  }, [addTerminalLine, clearTerminal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRun(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const idx = historyIdx - 1;
        setHistoryIdx(idx);
        setInput(history[idx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] font-mono" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d1a] cybeni-toolbar">
        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /> Terminal
        </span>
        <button onClick={clearTerminal} className="text-gray-500 hover:text-gray-300 p-0.5" title="Clear">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {terminalLines.map((line, i) => (
          <div key={i} className={`text-[11px] leading-relaxed whitespace-pre-wrap ${lineColors[line.type] || 'text-gray-400'}`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input line */}
      <div className="flex items-center px-3 py-1.5 cybeni-statusbar">
        <span className="text-primary text-[11px] mr-2">{'>'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-[11px] text-gray-200 outline-none placeholder-gray-600"
          placeholder="Type JavaScript..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
