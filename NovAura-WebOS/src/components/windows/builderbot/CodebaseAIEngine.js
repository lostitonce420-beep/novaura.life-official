/**
 * CodebaseAIEngine - Multi-file AI refactoring and codebase understanding
 * 
 * Features:
 * - Index entire codebase for AI context
 * - Cross-file refactoring
 * - Architecture analysis
 * - Dependency graph
 * - Code quality audit
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export class CodebaseAIEngine {
  constructor(files = []) {
    this.files = files;
    this.index = null;
    this.dependencyGraph = null;
    this.lastIndexed = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Codebase Indexing
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Build index of entire codebase
   */
  async indexCodebase() {
    const index = {
      files: {},
      symbols: {},
      dependencies: {},
      exports: {},
      imports: {},
      entryPoints: [],
      components: [],
      functions: [],
      classes: [],
      summary: {
        totalFiles: this.files.length,
        totalLines: 0,
        languages: {},
        frameworks: new Set()
      }
    };

    for (const file of this.files) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      const language = this.detectLanguage(file.name);
      
      index.files[file.path || file.name] = {
        path: file.path || file.name,
        language,
        lines: lines.length,
        size: file.content.length,
        lastModified: file.lastModified || Date.now()
      };

      index.summary.totalLines += lines.length;
      index.summary.languages[language] = (index.summary.languages[language] || 0) + 1;

      // Extract symbols based on language
      const symbols = this.extractSymbols(file.content, language);
      index.symbols[file.path || file.name] = symbols;

      // Extract imports/exports
      const { imports, exports } = this.extractImportsExports(file.content, language);
      index.imports[file.path || file.name] = imports;
      index.exports[file.path || file.name] = exports;

      // Find entry points
      if (this.isEntryPoint(file, language)) {
        index.entryPoints.push(file.path || file.name);
      }

      // Extract components (React/Vue/Angular)
      if (['jsx', 'tsx', 'vue', 'svelte'].includes(language)) {
        const components = this.extractComponents(file.content, language);
        index.components.push(...components.map(c => ({ ...c, file: file.path || file.name })));
      }

      // Extract functions
      index.functions.push(...symbols.functions.map(f => ({ ...f, file: file.path || file.name })));

      // Extract classes
      index.classes.push(...symbols.classes.map(c => ({ ...c, file: file.path || file.name })));

      // Detect frameworks
      const frameworks = this.detectFrameworks(file.content);
      frameworks.forEach(f => index.summary.frameworks.add(f));
    }

    index.summary.frameworks = Array.from(index.summary.frameworks);
    this.index = index;
    this.lastIndexed = Date.now();

    // Build dependency graph
    this.dependencyGraph = this.buildDependencyGraph(index);

    return index;
  }

  /**
   * Detect programming language from filename
   */
  detectLanguage(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript', 'jsx': 'jsx',
      'ts': 'typescript', 'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp', 'c': 'c',
      'html': 'html',
      'css': 'css', 'scss': 'scss', 'sass': 'sass',
      'json': 'json',
      'md': 'markdown',
      'vue': 'vue',
      'svelte': 'svelte',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    return map[ext] || 'unknown';
  }

  /**
   * Extract symbols (functions, classes, variables)
   */
  extractSymbols(content, language) {
    const symbols = {
      functions: [],
      classes: [],
      variables: [],
      exports: []
    };

    // Language-specific extraction
    if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
      // Function declarations
      const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)\s*=>|function)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        symbols.functions.push({
          name: match[1] || match[2],
          line: content.substring(0, match.index).split('\n').length,
          async: match[0].includes('async'),
          exported: match[0].includes('export')
        });
      }

      // Class declarations
      const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
      while ((match = classRegex.exec(content)) !== null) {
        symbols.classes.push({
          name: match[1],
          extends: match[2],
          line: content.substring(0, match.index).split('\n').length,
          exported: match[0].includes('export')
        });
      }

      // Variable declarations
      const varRegex = /(?:const|let|var)\s+(\w+)/g;
      while ((match = varRegex.exec(content)) !== null) {
        symbols.variables.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }

    return symbols;
  }

  /**
   * Extract imports and exports
   */
  extractImportsExports(content, language) {
    const imports = [];
    const exports = [];

    if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
      // ES6 imports
      const importRegex = /import\s+(?:(\{[^}]*\})|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push({
          names: match[1] ? match[1].replace(/[{}\s]/g, '').split(',') : 
                 match[2] ? [match[2]] : 
                 match[3] ? [match[3]] : [],
          source: match[4],
          line: content.substring(0, match.index).split('\n').length
        });
      }

      // ES6 exports
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)?\s*(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push({
          name: match[1],
          default: match[0].includes('default'),
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }

    return { imports, exports };
  }

  /**
   * Check if file is an entry point
   */
  isEntryPoint(file, language) {
    const entryNames = ['index', 'main', 'app', 'server', 'entry'];
    const baseName = file.name.split('.')[0].toLowerCase();
    return entryNames.includes(baseName) || file.path?.includes('pages/');
  }

  /**
   * Extract React/Vue components
   */
  extractComponents(content, language) {
    const components = [];

    if (['jsx', 'tsx'].includes(language)) {
      // React function components
      const componentRegex = /(?:export\s+)?(?:const|function)\s+(\w+)\s*(?:[=\(])[^]*?(?:return\s+\(|=>\s*\()/g;
      let match;
      while ((match = componentRegex.exec(content)) !== null) {
        // Check if it returns JSX-like content
        const afterMatch = content.substring(match.index + match[0].length, match.index + match[0].length + 200);
        if (afterMatch.includes('<') && afterMatch.includes('/>')) {
          components.push({
            name: match[1],
            type: 'function',
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }

    return components;
  }

  /**
   * Detect frameworks used
   */
  detectFrameworks(content) {
    const frameworks = [];
    const checks = [
      { name: 'React', pattern: /import\s+React|from\s+['"]react['"]|useState|useEffect/ },
      { name: 'Vue', pattern: /import\s+.*from\s+['"]vue['"]|createApp|defineComponent/ },
      { name: 'Angular', pattern: /@Component|@Injectable|@NgModule/ },
      { name: 'Express', pattern: /require\(['"]express['"]|from\s+['"]express['"]/ },
      { name: 'Next.js', pattern: /from\s+['"]next['"]|getStaticProps|getServerSideProps/ },
      { name: 'Tailwind', pattern: /className="[^"]*(?:flex|grid|p-|m-|text-)/ },
      { name: 'Bootstrap', pattern: /className="[^"]*(?:container|row|col)/ },
      { name: 'Material-UI', pattern: /@mui\/material|makeStyles|createTheme/ }
    ];

    checks.forEach(({ name, pattern }) => {
      if (pattern.test(content)) frameworks.push(name);
    });

    return frameworks;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Dependency Graph
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Build dependency graph
   */
  buildDependencyGraph(index) {
    const graph = {
      nodes: [],
      edges: []
    };

    // Add all files as nodes
    Object.keys(index.files).forEach(path => {
      graph.nodes.push({
        id: path,
        type: 'file',
        language: index.files[path].language
      });
    });

    // Add import relationships as edges
    Object.entries(index.imports).forEach(([path, imports]) => {
      imports.forEach(imp => {
        // Resolve relative imports
        if (imp.source.startsWith('.')) {
          const resolved = this.resolveImportPath(path, imp.source);
          if (resolved && index.files[resolved]) {
            graph.edges.push({
              from: path,
              to: resolved,
              type: 'imports',
              names: imp.names
            });
          }
        }
      });
    });

    return graph;
  }

  /**
   * Resolve relative import path
   */
  resolveImportPath(fromPath, importPath) {
    if (!importPath.startsWith('.')) return null;
    
    const fromDir = fromPath.split('/').slice(0, -1).join('/');
    const segments = importPath.split('/');
    
    let resolved = fromDir;
    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved = resolved.split('/').slice(0, -1).join('/');
      } else {
        resolved = resolved ? `${resolved}/${seg}` : seg;
      }
    }

    // Try common extensions
    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.vue', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      const test = resolved + ext;
      if (this.files.find(f => (f.path || f.name) === test)) {
        return test;
      }
    }

    return resolved;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Multi-file Refactoring
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Rename symbol across all files
   */
  async renameSymbol(oldName, newName, filePath) {
    if (!this.index) await this.indexCodebase();

    const affectedFiles = [];
    const changes = [];

    // Find all references
    for (const file of this.files) {
      if (!file.content) continue;

      const refs = this.findSymbolReferences(file.content, oldName, file.path || file.name);
      if (refs.length > 0) {
        affectedFiles.push(file.path || file.name);
        
        let newContent = file.content;
        // Replace from end to start to preserve indices
        refs.sort((a, b) => b.index - a.index).forEach(ref => {
          newContent = newContent.substring(0, ref.index) + newName + newContent.substring(ref.index + oldName.length);
        });

        changes.push({
          file: file.path || file.name,
          oldContent: file.content,
          newContent,
          references: refs.length
        });
      }
    }

    return {
      success: true,
      affectedFiles,
      changes,
      summary: `Renamed ${oldName} to ${newName} in ${affectedFiles.length} files (${changes.reduce((sum, c) => sum + c.references, 0)} references)`
    };
  }

  /**
   * Find all references to a symbol
   */
  findSymbolReferences(content, symbolName, filePath) {
    const refs = [];
    const regex = new RegExp(`\\b${symbolName}\\b`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Check if it's not in a comment or string
      const before = content.substring(0, match.index);
      const line = before.split('\n').pop();
      
      // Simple heuristic - could be improved
      const inComment = line.includes('//') && line.indexOf('//') < line.lastIndexOf(symbolName);
      const inString = (line.match(/"/g) || []).length % 2 === 1;

      if (!inComment && !inString) {
        refs.push({
          index: match.index,
          line: content.substring(0, match.index).split('\n').length,
          context: content.substring(Math.max(0, match.index - 30), match.index + symbolName.length + 30)
        });
      }
    }

    return refs;
  }

  /**
   * AI-powered multi-file refactoring
   */
  async aiRefactor(instruction, targetFiles = null) {
    if (!this.index) await this.indexCodebase();

    const files = targetFiles || this.files.filter(f => f.content);
    const fileContexts = files.map(f => ({
      path: f.path || f.name,
      content: f.content,
      language: this.detectLanguage(f.name)
    }));

    const token = localStorage.getItem('auth_token');

    const prompt = `You are an expert software engineer. Perform the following refactoring across multiple files:

INSTRUCTION: ${instruction}

FILES TO REFACTOR:
${fileContexts.map(f => `\n--- ${f.path} (${f.language}) ---\n${f.content.substring(0, 2000)}${f.content.length > 2000 ? '\n... (truncated)' : ''}`).join('\n')}

DEPENDENCY GRAPH:
${JSON.stringify(this.dependencyGraph, null, 2)}

Provide your response as a JSON array of file changes:
[
  {
    "path": "file path",
    "changes": "description of changes made",
    "newContent": "complete new file content"
  }
]

Ensure:
1. All references are updated consistently
2. Import/export statements are updated
3. The refactored code maintains the same functionality
4. Follow best practices for the target language/framework`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 8192,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [{ error: 'Could not parse AI response', raw: content }];
    } catch (err) {
      console.error('AI refactor failed:', err);
      return [{ error: err.message }];
    }
  }

  /**
   * Analyze architecture and suggest improvements
   */
  async analyzeArchitecture() {
    if (!this.index) await this.indexCodebase();

    const token = localStorage.getItem('auth_token');

    const prompt = `Analyze the following codebase architecture and provide improvement suggestions:

CODEBASE SUMMARY:
- Total Files: ${this.index.summary.totalFiles}
- Total Lines: ${this.index.summary.totalLines}
- Languages: ${JSON.stringify(this.index.summary.languages)}
- Frameworks: ${this.index.summary.frameworks.join(', ')}
- Entry Points: ${this.index.entryPoints.join(', ')}
- Components: ${this.index.components.length}
- Functions: ${this.index.functions.length}

DEPENDENCY GRAPH:
- Nodes: ${this.dependencyGraph.nodes.length}
- Edges: ${this.dependencyGraph.edges.length}

Provide analysis in JSON format:
{
  "architecture_pattern": "detected pattern (MVC, MVVM, layered, etc.)",
  "strengths": ["what's done well"],
  "weaknesses": ["areas for improvement"],
  "suggestions": [
    {
      "type": "structure|performance|security|maintainability",
      "priority": "high|medium|low",
      "description": "what to change",
      "rationale": "why this helps",
      "affected_files": ["files to modify"]
    }
  ],
  "complexity_score": 1-10,
  "maintainability_score": 1-10
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 4096,
        temperature: 0.4,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { error: 'Could not parse analysis', raw: content };
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Find unused code
   */
  async findUnusedCode() {
    if (!this.index) await this.indexCodebase();

    const unused = {
      exports: [],
      functions: [],
      variables: []
    };

    // Check each export to see if it's imported elsewhere
    for (const [filePath, exports] of Object.entries(this.index.exports)) {
      for (const exp of exports) {
        let isUsed = false;
        
        for (const [otherPath, imports] of Object.entries(this.index.imports)) {
          if (otherPath === filePath) continue;
          
          for (const imp of imports) {
            if (imp.names.includes(exp.name)) {
              isUsed = true;
              break;
            }
          }
          if (isUsed) break;
        }

        if (!isUsed && !exp.default) {
          unused.exports.push({
            name: exp.name,
            file: filePath,
            line: exp.line
          });
        }
      }
    }

    return unused;
  }

  /**
   * Get summary for display
   */
  getSummary() {
    if (!this.index) return null;

    return {
      files: this.index.summary.totalFiles,
      lines: this.index.summary.totalLines,
      languages: Object.keys(this.index.summary.languages),
      frameworks: this.index.summary.frameworks,
      components: this.index.components.length,
      functions: this.index.functions.length,
      lastIndexed: this.lastIndexed
    };
  }
}

export default CodebaseAIEngine;
