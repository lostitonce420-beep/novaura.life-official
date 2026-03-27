/**
 * Git UI - Visual Git Interface
 * MVP: Status, commit, branches, log
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, GitCommit, GitMerge, Plus, Check, X, 
  RefreshCw, ChevronRight, ChevronDown, FolderGit2,
  Clock, User, MessageSquare, Upload, Download
} from 'lucide-react';

// Mock git data - replace with actual git integration
const MOCK_STATUS = {
  branch: 'main',
  ahead: 2,
  behind: 0,
  modified: [
    { path: 'src/components/Button.jsx', status: 'M' },
    { path: 'src/styles/theme.css', status: 'M' },
    { path: 'package.json', status: 'M' },
  ],
  untracked: [
    { path: 'src/components/NewFeature.jsx', status: '?' },
    { path: 'docs/api.md', status: '?' },
  ],
  staged: [
    { path: 'README.md', status: 'A' },
  ],
};

const MOCK_COMMITS = [
  { hash: 'a1b2c3d', message: 'Fix button styling', author: 'Aura', date: '2 min ago', branch: 'main' },
  { hash: 'e4f5g6h', message: 'Add new theme colors', author: 'Nova', date: '1 hour ago', branch: 'main' },
  { hash: 'i7j8k9l', message: 'Update dependencies', author: 'Aura', date: '3 hours ago', branch: 'main' },
  { hash: 'm0n1o2p', message: 'Initial commit', author: 'Nova', date: '2 days ago', branch: 'main' },
];

const MOCK_BRANCHES = ['main', 'feature/new-ui', 'hotfix/bug-123', 'dev'];

export default function GitWindow() {
  const [activeTab, setActiveTab] = useState('status'); // status, commits, branches
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggleFile = (path) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const stageAll = () => {
    MOCK_STATUS.modified.forEach(f => selectedFiles.add(f.path));
    MOCK_STATUS.untracked.forEach(f => selectedFiles.add(f.path));
    setSelectedFiles(new Set(selectedFiles));
  };

  const commit = () => {
    if (!commitMessage || selectedFiles.size === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCommitMessage('');
      setSelectedFiles(new Set());
      alert('Committed: ' + commitMessage);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'M': return 'text-yellow-400';
      case 'A': return 'text-green-400';
      case 'D': return 'text-red-400';
      case '?': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4">
        <div className="flex items-center gap-2 mb-6">
          <FolderGit2 className="w-6 h-6 text-orange-400" />
          <span className="font-medium">my-project</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('status')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === 'status' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Changes
            {(MOCK_STATUS.modified.length + MOCK_STATUS.untracked.length) > 0 && (
              <span className="ml-auto text-xs bg-cyan-500 text-black px-2 py-0.5 rounded-full">
                {MOCK_STATUS.modified.length + MOCK_STATUS.untracked.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('commits')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === 'commits' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Commits
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === 'branches' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Branches
          </button>
        </div>

        {/* Current Branch */}
        <div className="mt-6 p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Current Branch</div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-orange-400" />
            <span className="font-medium">{MOCK_STATUS.branch}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            {MOCK_STATUS.ahead > 0 && (
              <span className="text-green-400">↑ {MOCK_STATUS.ahead}</span>
            )}
            {MOCK_STATUS.behind > 0 && (
              <span className="text-red-400">↓ {MOCK_STATUS.behind}</span>
            )}
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="mt-4 space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
            <Download className="w-4 h-4" />
            Pull
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
            <Upload className="w-4 h-4" />
            Push
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTab === 'status' && (
          <>
            {/* Changes List */}
            <div className="flex-1 overflow-auto p-4">
              {/* Staged */}
              {MOCK_STATUS.staged.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Staged Changes ({MOCK_STATUS.staged.length})
                  </h3>
                  <div className="space-y-1">
                    {MOCK_STATUS.staged.map(file => (
                      <div key={file.path} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono">{file.path}</span>
                        <span className="ml-auto text-xs text-green-400">{file.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified */}
              {MOCK_STATUS.modified.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-yellow-400 mb-2">
                    Modified ({MOCK_STATUS.modified.length})
                  </h3>
                  <div className="space-y-1">
                    {MOCK_STATUS.modified.map(file => (
                      <button
                        key={file.path}
                        onClick={() => toggleFile(file.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          selectedFiles.has(file.path) ? 'bg-cyan-500/20' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border ${selectedFiles.has(file.path) ? 'bg-cyan-500 border-cyan-500' : 'border-white/30'}`}>
                          {selectedFiles.has(file.path) && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <span className="text-sm font-mono">{file.path}</span>
                        <span className={`ml-auto text-xs ${getStatusColor(file.status)}`}>{file.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Untracked */}
              {MOCK_STATUS.untracked.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Untracked ({MOCK_STATUS.untracked.length})
                  </h3>
                  <div className="space-y-1">
                    {MOCK_STATUS.untracked.map(file => (
                      <button
                        key={file.path}
                        onClick={() => toggleFile(file.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          selectedFiles.has(file.path) ? 'bg-cyan-500/20' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border ${selectedFiles.has(file.path) ? 'bg-cyan-500 border-cyan-500' : 'border-white/30'}`}>
                          {selectedFiles.has(file.path) && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <span className="text-sm font-mono text-gray-400">{file.path}</span>
                        <span className="ml-auto text-xs text-gray-400">{file.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Commit Box */}
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                <span>{selectedFiles.size} files selected</span>
                <button onClick={stageAll} className="text-cyan-400 hover:underline">Stage all</button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Commit message..."
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                />
                <button
                  onClick={commit}
                  disabled={!commitMessage || selectedFiles.size === 0 || isLoading}
                  className="px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
                  Commit
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'commits' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {MOCK_COMMITS.map((commit, i) => (
                <div key={commit.hash} className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg group">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    {i < MOCK_COMMITS.length - 1 && <div className="w-px h-full bg-white/10 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{commit.message}</span>
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50 font-mono">
                        {commit.hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {commit.date}
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        <GitBranch className="w-3 h-3" />
                        {commit.branch}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {MOCK_BRANCHES.map(branch => (
                <div
                  key={branch}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    branch === MOCK_STATUS.branch ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="font-mono">{branch}</span>
                  {branch === MOCK_STATUS.branch && (
                    <span className="ml-auto text-xs px-2 py-0.5 bg-cyan-500 text-black rounded">
                      current
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            <button className="mt-4 flex items-center gap-2 px-3 py-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg w-full">
              <Plus className="w-4 h-4" />
              New Branch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
