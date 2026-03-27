import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Star, GitFork, Shield, ExternalLink, Download,
  FileCode, FolderTree, Loader2, ChevronRight, ChevronDown,
  Eye, Github, Box, Zap,
} from 'lucide-react';
import useRepoStore from './useRepoStore';

// ── Language detection for syntax highlighting hints ─────────
const EXT_LANG = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
  rs: 'rust', go: 'go', java: 'java', yml: 'yaml', yaml: 'yaml',
  sh: 'shell', sql: 'sql', vue: 'vue', svelte: 'svelte',
};

function getFileIcon(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  const name = path.split('/').pop()?.toLowerCase();
  if (name === 'package.json') return '📦';
  if (name === 'dockerfile') return '🐳';
  if (name === 'readme.md') return '📖';
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return '⚡';
  if (['py'].includes(ext)) return '🐍';
  if (['html'].includes(ext)) return '🌐';
  if (['css', 'scss', 'less'].includes(ext)) return '🎨';
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return '⚙️';
  if (['rs'].includes(ext)) return '🦀';
  if (['go'].includes(ext)) return '🔵';
  return '📄';
}

// ── File tree builder ────────────────────────────────────────
function buildFileTree(files) {
  const tree = { name: '/', children: {}, files: [] };

  files.forEach(f => {
    const parts = f.path.split('/');
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current.children[parts[i]]) {
        current.children[parts[i]] = { name: parts[i], children: {}, files: [] };
      }
      current = current.children[parts[i]];
    }

    current.files.push({ name: parts[parts.length - 1], path: f.path, size: f.size });
  });

  return tree;
}

function TreeNode({ node, depth = 0, onSelectFile }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const childDirs = Object.values(node.children);
  const hasChildren = childDirs.length > 0 || node.files.length > 0;

  return (
    <div>
      {node.name !== '/' && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-1 py-0.5 hover:bg-white/5 rounded text-[10px] text-gray-400 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
          ) : <span className="w-3" />}
          <FolderTree className="w-3 h-3 text-primary/40 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
      )}

      {(node.name === '/' || expanded) && (
        <>
          {childDirs.map(child => (
            <TreeNode key={child.name} node={child} depth={node.name === '/' ? 0 : depth + 1} onSelectFile={onSelectFile} />
          ))}
          {node.files.map(file => (
            <button
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              className="flex items-center gap-1 w-full px-1 py-0.5 hover:bg-white/5 rounded text-[10px] text-gray-300 transition-colors"
              style={{ paddingLeft: `${(node.name === '/' ? 0 : depth + 1) * 12 + 4}px` }}
            >
              <span className="w-3 text-center text-[8px]">{getFileIcon(file.path)}</span>
              <span className="truncate">{file.name}</span>
              <span className="ml-auto text-[8px] text-gray-600 shrink-0">
                {file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ── Code viewer ──────────────────────────────────────────────
function CodeViewer({ content, path }) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-[11px]">
        Select a file to preview
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-black/30 sticky top-0">
        <span className="text-[9px]">{getFileIcon(path)}</span>
        <span className="text-[10px] text-gray-400 truncate">{path}</span>
      </div>
      <pre className="p-3 text-[10px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-all">
        {content}
      </pre>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function RepoDetail({ onBack, onImport, onEnhance }) {
  const { selectedRepo, repoFiles, loadingFiles, fetchFileContent } = useRepoStore();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [importing, setImporting] = useState(false);

  const repo = selectedRepo;
  if (!repo) return null;

  const fileTree = buildFileTree(repoFiles);

  const handleSelectFile = async (path) => {
    setSelectedFile(path);
    setLoadingContent(true);
    const content = await fetchFileContent(repo, path);
    setFileContent(content);
    setLoadingContent(false);
  };

  const handleImport = async () => {
    setImporting(true);
    const app = await useRepoStore.getState().importRepo(repo);
    setImporting(false);
    if (app && onImport) onImport(app);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          {repo.ownerAvatar ? (
            <img src={repo.ownerAvatar} alt="" className="w-7 h-7 rounded-md" />
          ) : (
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              {repo.source === 'github' ? <Github className="w-3.5 h-3.5 text-gray-500" /> : <Box className="w-3.5 h-3.5 text-gray-500" />}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-200 truncate">{repo.name}</span>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-gray-500">{repo.owner}</span>
              <span className="flex items-center gap-0.5 text-[9px] text-gray-500">
                <Star className="w-2.5 h-2.5" /> {repo.stars?.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-gray-500">
                <GitFork className="w-2.5 h-2.5" /> {repo.forks?.toLocaleString()}
              </span>
              {repo.license && (
                <span className={`flex items-center gap-0.5 text-[9px] ${repo.licenseAllowed ? 'text-green-400' : 'text-yellow-400'}`}>
                  <Shield className="w-2.5 h-2.5" /> {repo.license}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleImport}
              disabled={importing || !repo.licenseAllowed}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-medium transition-colors"
            >
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={() => onEnhance?.(repo)}
              disabled={importing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 text-[10px] font-medium transition-colors"
            >
              <Zap className="w-3 h-3" /> Enhance
            </button>
          </div>
        </div>

        {repo.description && (
          <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{repo.description}</p>
        )}

        {repo.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {repo.topics.slice(0, 8).map(t => (
              <span key={t} className="px-1.5 py-0.5 text-[8px] rounded bg-primary/10 text-primary/60 border border-primary/10">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body: file tree + code viewer */}
      {loadingFiles ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[11px]">Loading repository files...</span>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* File tree */}
          <div className="w-[200px] border-r border-white/10 overflow-y-auto scrollbar-thin bg-black/10">
            <div className="px-2 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider flex items-center gap-1 border-b border-white/5">
              <FolderTree className="w-3 h-3" /> {repoFiles.length} files
            </div>
            <div className="py-1">
              <TreeNode node={fileTree} onSelectFile={handleSelectFile} />
            </div>
          </div>

          {/* Code preview */}
          <div className="flex-1 bg-[#0d0d18]">
            {loadingContent ? (
              <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px]">Loading file...</span>
              </div>
            ) : (
              <CodeViewer content={fileContent} path={selectedFile || ''} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
