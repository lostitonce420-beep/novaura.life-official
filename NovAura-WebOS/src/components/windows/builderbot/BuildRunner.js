/**
 * Cybeni Build Runner — Multi-Language Execution Engine
 *
 * Strategies:
 *   HTML/CSS/JS  → iframe preview (handled by PreviewPanel, no action here)
 *   Python       → Pyodide WASM (loaded on demand, runs 100% in browser)
 *   C/C++/Rust/Go/Java/Ruby/PHP/etc → Piston API (free, 50+ languages)
 *
 * Returns { stdout, stderr, exitCode, language, duration }
 */

// ── Language detection from file extension ─────────────────
const EXT_TO_PISTON = {
  py: { language: 'python', version: '3.10.0' },
  c: { language: 'c', version: '10.2.0' },
  cpp: { language: 'c++', version: '10.2.0' },
  rs: { language: 'rust', version: '1.68.2' },
  go: { language: 'go', version: '1.16.2' },
  java: { language: 'java', version: '15.0.2' },
  rb: { language: 'ruby', version: '3.0.1' },
  php: { language: 'php', version: '8.2.3' },
  cs: { language: 'csharp', version: '6.12.0' },
  ts: { language: 'typescript', version: '5.0.3' },
  kt: { language: 'kotlin', version: '1.8.20' },
  swift: { language: 'swift', version: '5.3.3' },
  lua: { language: 'lua', version: '5.4.4' },
  dart: { language: 'dart', version: '2.19.6' },
  sh: { language: 'bash', version: '5.2.0' },
  bash: { language: 'bash', version: '5.2.0' },
};

// Languages the iframe preview handles (no Build Runner needed)
const WEB_LANGUAGES = new Set(['html', 'css', 'js', 'jsx', 'vue', 'scss', 'less', 'svg', 'xml']);

// ── Detect project's primary language ─────────────────────
export function detectProjectLanguage(files) {
  const extCounts = {};
  for (const f of files) {
    const ext = f.name?.split('.').pop()?.toLowerCase();
    if (ext && !WEB_LANGUAGES.has(ext)) {
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
  }
  // Most common non-web extension
  let best = null, bestCount = 0;
  for (const [ext, count] of Object.entries(extCounts)) {
    if (count > bestCount) { best = ext; bestCount = count; }
  }
  return best;
}

export function isWebProject(files) {
  return files.some(f => f.name?.endsWith('.html'));
}

export function getLanguageConfig(ext) {
  return EXT_TO_PISTON[ext] || null;
}

// ── Pyodide (Python in WASM) ─────────────────────────────
let pyodideInstance = null;
let pyodideLoading = false;

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) {
    // Wait for existing load
    while (pyodideLoading) await new Promise(r => setTimeout(r, 200));
    return pyodideInstance;
  }

  pyodideLoading = true;
  try {
    // Load Pyodide from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    document.head.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Pyodide'));
    });

    // Initialize
    pyodideInstance = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    });
    return pyodideInstance;
  } finally {
    pyodideLoading = false;
  }
}

async function runPython(code, onLog) {
  const start = Date.now();
  try {
    onLog?.({ level: 'system', text: 'Loading Python runtime (Pyodide WASM)...' });
    const pyodide = await loadPyodide();
    onLog?.({ level: 'system', text: 'Python ready. Executing...' });

    // Capture stdout/stderr
    pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    let result;
    try {
      result = pyodide.runPython(code);
    } catch (pyErr) {
      const stderr = pyodide.runPython('sys.stderr.getvalue()') || '';
      return {
        stdout: pyodide.runPython('sys.stdout.getvalue()') || '',
        stderr: stderr || pyErr.message,
        exitCode: 1,
        language: 'python',
        duration: Date.now() - start,
      };
    }

    const stdout = pyodide.runPython('sys.stdout.getvalue()') || '';
    const stderr = pyodide.runPython('sys.stderr.getvalue()') || '';

    return {
      stdout: result !== undefined && result !== null
        ? stdout + (stdout ? '\n' : '') + String(result)
        : stdout,
      stderr,
      exitCode: 0,
      language: 'python',
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err.message || 'Failed to initialize Python runtime',
      exitCode: 1,
      language: 'python',
      duration: Date.now() - start,
    };
  }
}

// ── Piston API (compiled languages) ──────────────────────
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

async function runPiston(files, langConfig, onLog) {
  const start = Date.now();
  onLog?.({ level: 'system', text: `Compiling ${langConfig.language} via cloud compiler...` });

  try {
    const response = await fetch(PISTON_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: files.map((f, i) => ({
          name: f.name || `main${i}`,
          content: f.content || '',
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Compiler returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const run = data.run || {};
    const compile = data.compile || {};

    // Compile errors
    if (compile.stderr) {
      return {
        stdout: compile.stdout || '',
        stderr: compile.stderr,
        exitCode: compile.code ?? 1,
        language: langConfig.language,
        duration: Date.now() - start,
      };
    }

    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      exitCode: run.code ?? 0,
      language: langConfig.language,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err.message || 'Compilation failed',
      exitCode: 1,
      language: langConfig.language,
      duration: Date.now() - start,
    };
  }
}

// ── Main entry point ─────────────────────────────────────
/**
 * Run project files.
 * @param {Array<{name, content, path}>} files - Project files
 * @param {Function} onLog - Callback for streaming log output { level, text }
 * @returns {Promise<{stdout, stderr, exitCode, language, duration}>}
 */
export async function runBuild(files, onLog) {
  // Web project → handled by PreviewPanel, just signal it
  if (isWebProject(files)) {
    onLog?.({ level: 'info', text: 'Web project detected → rendering in preview panel.' });
    return { stdout: '', stderr: '', exitCode: 0, language: 'web', duration: 0 };
  }

  // Detect language
  const ext = detectProjectLanguage(files);
  if (!ext) {
    return {
      stdout: '',
      stderr: 'Could not detect project language. Add source files to run.',
      exitCode: 1,
      language: 'unknown',
      duration: 0,
    };
  }

  // Python → Pyodide WASM (in-browser, free, fast)
  if (ext === 'py') {
    const pyFiles = files.filter(f => f.name?.endsWith('.py'));
    // Find main.py or first .py file
    const main = pyFiles.find(f => f.name === 'main.py') || pyFiles[0];
    if (!main) {
      return { stdout: '', stderr: 'No Python files found.', exitCode: 1, language: 'python', duration: 0 };
    }
    return runPython(main.content || '', onLog);
  }

  // Compiled languages → Piston API
  const langConfig = EXT_TO_PISTON[ext];
  if (!langConfig) {
    return {
      stdout: '',
      stderr: `Language ".${ext}" is not yet supported for execution. Supported: Python, C, C++, Rust, Go, Java, Ruby, PHP, C#, TypeScript, Kotlin, Swift, Lua, Dart, Bash.`,
      exitCode: 1,
      language: ext,
      duration: 0,
    };
  }

  // Filter to relevant source files
  const sourceFiles = files.filter(f => f.name?.endsWith(`.${ext}`));
  return runPiston(sourceFiles, langConfig, onLog);
}

// ── Supported languages list (for UI) ────────────────────
export const SUPPORTED_LANGUAGES = [
  { ext: 'js', name: 'JavaScript', runtime: 'Browser sandbox', icon: '🟨' },
  { ext: 'py', name: 'Python', runtime: 'Pyodide WASM (in-browser)', icon: '🐍' },
  { ext: 'c', name: 'C', runtime: 'GCC via cloud', icon: '⚙️' },
  { ext: 'cpp', name: 'C++', runtime: 'G++ via cloud', icon: '⚙️' },
  { ext: 'rs', name: 'Rust', runtime: 'rustc via cloud', icon: '🦀' },
  { ext: 'go', name: 'Go', runtime: 'go via cloud', icon: '🔵' },
  { ext: 'java', name: 'Java', runtime: 'JDK via cloud', icon: '☕' },
  { ext: 'rb', name: 'Ruby', runtime: 'Ruby via cloud', icon: '💎' },
  { ext: 'php', name: 'PHP', runtime: 'PHP via cloud', icon: '🐘' },
  { ext: 'cs', name: 'C#', runtime: 'Mono via cloud', icon: '🔷' },
  { ext: 'ts', name: 'TypeScript', runtime: 'ts-node via cloud', icon: '🔷' },
  { ext: 'kt', name: 'Kotlin', runtime: 'kotlinc via cloud', icon: '🟣' },
  { ext: 'swift', name: 'Swift', runtime: 'swiftc via cloud', icon: '🍎' },
  { ext: 'lua', name: 'Lua', runtime: 'Lua via cloud', icon: '🌙' },
  { ext: 'dart', name: 'Dart', runtime: 'Dart via cloud', icon: '🎯' },
  { ext: 'sh', name: 'Bash', runtime: 'Bash via cloud', icon: '🐚' },
];
