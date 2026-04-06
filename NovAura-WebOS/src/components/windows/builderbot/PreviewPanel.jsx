import React, { useMemo, useState, useRef, useEffect } from 'react';
import { RefreshCw, Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react';
import useBuilderStore from './useBuilderStore';

const VIEWPORTS = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
];

export default function PreviewPanel() {
  const { flattenFiles, tree, runKey, pushIframeError, clearIframeErrors } = useBuilderStore();
  const [viewport, setViewport] = useState('desktop');
  const [localKey, setLocalKey] = useState(0);
  const iframeRef = useRef(null);

  // Combined key: manual refresh + run button both trigger reload
  const key = localKey + runKey;

  const files = useMemo(() => flattenFiles(), [tree]);

  // Capture console errors from the live preview iframe and feed them to the agent loop
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || e.data.type !== 'cybeni-console') return;
      if (e.data.level === 'error' || e.data.level === 'warn') {
        pushIframeError({ level: e.data.level, text: e.data.text, ts: Date.now() });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [pushIframeError]);

  // Clear errors every time the preview reloads so stale errors don't confuse the agent
  useEffect(() => {
    clearIframeErrors();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the preview document from project files
  const srcdoc = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html'));
    const cssFiles = files.filter((f) => f.name.endsWith('.css'));
    const jsFiles = files.filter((f) => f.name.endsWith('.js') && !f.name.endsWith('.test.js'));

    if (!htmlFile) {
      // No HTML file — create a basic runner for JS
      const allJs = jsFiles.map((f) => f.content || '').join('\n\n');
      const allCss = cssFiles.map((f) => f.content || '').join('\n\n');
      return `<!DOCTYPE html>
<html><head>
<style>${allCss}</style>
</head><body>
<pre id="output" style="font-family:monospace;padding:1rem;color:#e0e0e0;background:#0a0a0f;min-height:100vh;margin:0;white-space:pre-wrap;"></pre>
<script>
const _out = document.getElementById('output');
const _origLog = console.log;
console.log = (...args) => {
  _out.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
  _origLog.apply(console, args);
};
console.error = (...args) => {
  const line = document.createElement('span');
  line.style.color = '#ff5555';
  line.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
  _out.appendChild(line);
};
try {
${allJs}
} catch(e) { console.error(e.message); }
</script>
</body></html>`;
    }

    // Parse the HTML and inject CSS/JS files that are referenced
    let html = htmlFile.content || '';

    // Replace stylesheet links with inline CSS
    cssFiles.forEach((cssFile) => {
      const linkPattern = new RegExp(`<link[^>]*href=["']${cssFile.name}["'][^>]*/?>`, 'gi');
      if (linkPattern.test(html)) {
        html = html.replace(linkPattern, `<style>/* ${cssFile.name} */\n${cssFile.content || ''}</style>`);
      } else {
        // If not explicitly linked, inject before </head>
        const styleTag = `<style>/* ${cssFile.name} */\n${cssFile.content || ''}</style>`;
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${styleTag}\n</head>`);
        } else {
          html = styleTag + '\n' + html;
        }
      }
    });

    // Replace script src with inline JS
    jsFiles.forEach((jsFile) => {
      const scriptPattern = new RegExp(`<script[^>]*src=["']${jsFile.name}["'][^>]*>\\s*</script>`, 'gi');
      if (scriptPattern.test(html)) {
        html = html.replace(scriptPattern, `<script>/* ${jsFile.name} */\n${jsFile.content || ''}</script>`);
      }
    });

    // Inject console bridge — captures all console output and sends to parent terminal
    const consoleCapture = `
<script>
(function() {
  const _send = (level, args) => {
    try {
      const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      parent.postMessage({ type: 'cybeni-console', level, text }, '*');
    } catch(e) {}
  };

  const _log = console.log, _warn = console.warn, _err = console.error, _info = console.info;
  console.log   = (...a) => { _log.apply(console, a);  _send('log', a); };
  console.warn  = (...a) => { _warn.apply(console, a); _send('warn', a); };
  console.error = (...a) => { _err.apply(console, a);  _send('error', a); };
  console.info  = (...a) => { _info.apply(console, a); _send('info', a); };

  window.onerror = function(msg, url, line) {
    _send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1a0000;color:#ff5555;padding:8px 12px;font-family:monospace;font-size:11px;z-index:99999;border-top:1px solid #ff3333;';
    el.textContent = msg + (line ? ' (line ' + line + ')' : '');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  };

  window.addEventListener('unhandledrejection', (e) => {
    _send('error', ['Unhandled Promise: ' + (e.reason?.message || e.reason || 'unknown')]);
  });
})();
</script>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${consoleCapture}\n</head>`);
    } else {
      html = consoleCapture + '\n' + html;
    }

    return html;
  }, [files, key]);

  const activeViewport = VIEWPORTS.find((v) => v.id === viewport);

  const handleOpenExternal = () => {
    const blob = new Blob([srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d1a] cybeni-toolbar">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Preview</span>
        <div className="flex items-center gap-1">
          {VIEWPORTS.map((vp) => (
            <button
              key={vp.id}
              onClick={() => setViewport(vp.id)}
              className={`p-1 rounded transition-colors ${viewport === vp.id ? 'text-primary bg-primary/15' : 'text-gray-500 hover:text-gray-300'}`}
              title={vp.label}
            >
              <vp.icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={() => setLocalKey((k) => k + 1)} className="p-1 rounded text-gray-500 hover:text-gray-300" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleOpenExternal} className="p-1 rounded text-gray-500 hover:text-gray-300" title="Open in new tab">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#1a1a2a] p-2">
        <div
          className="bg-white rounded-sm overflow-hidden shadow-lg transition-all duration-200"
          style={{
            width: activeViewport?.width || '100%',
            maxWidth: '100%',
            height: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            key={key}
            srcDoc={srcdoc}
            title="Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
