import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, GitCommit, GitPullRequest, GitMerge, RefreshCw, 
  Check, X, Plus, Trash2, ChevronRight, ChevronDown,
  FileText, FilePlus, FileMinus, Edit3, AlertCircle,
  Cloud, Upload, Download, History, Copy, CheckCircle2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// GIT UI PANEL - Visual Git Client
// NOTE: This is a UI prototype. Real git operations require backend integration.
// ═══════════════════════════════════════════════════════════════════════════════

export default function GitWindow() {
  const [activeTab, setActiveTab] = useState('changes'); // changes | history | branches
  const [selectedFile, setSelectedFile] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  const [status, setStatus] = useState({ staged: [], unstaged: [], untracked: [] });
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [diff, setDiff] = useState('');
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleStage = (file) => {
    setSelectedFiles(prev => 
      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
    );
  };

  const handleStageAll = () => {
    const allUnstaged = [...status.unstaged, ...status.untracked];
    setSelectedFiles(allUnstaged.map(f => f.path));
  };

  const handleUnstageAll = () => {
    setSelectedFiles([]);
  };

  const handleCommit = () => {
    if (!commitMessage.trim() || selectedFiles.length === 0) return;
    
    setLoading(true);
    // Simulate commit
    setTimeout(() => {
      const newCommit = {
        hash: Math.random().toString(36).substring(2, 9),
        message: commitMessage,
        author: 'You',
        date: 'just now',
        files: selectedFiles.length,
      };
      setCommits([newCommit, ...commits]);
      setCommitMessage('');
      setSelectedFiles([]);
      setStatus(prev => ({
        ...prev,
        unstaged: [],
        untracked: [],
      }));
      setLoading(false);
    }, 1000);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    
    const newBranch = {
      name: newBranchName,
      current: false,
      ahead: 0,
      behind: 0,
      lastCommit: 'Created from main',
    };
    setBranches([...branches, newBranch]);
    setNewBranchName('');
    setShowNewBranch(false);
  };

  const handleSwitchBranch = (branchName) => {
    setBranches(branches.map(b => ({
      ...b,
      current: b.name === branchName,
    })));
  };

  const handlePull = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Pulled latest changes from origin');
    }, 1500);
  };

  const handlePush = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Pushed to origin/main');
    }, 1500);
  };

  // ── Render Helpers ───────────────────────────────────────────────────────────

  const FileIcon = ({ change }) => {
    switch (change) {
      case 'added': return <FilePlus className="w-4 h-4 text-green-400" />;
      case 'deleted': return <FileMinus className="w-4 h-4 text-red-400" />;
      case 'untracked': return <FileText className="w-4 h-4 text-gray-400" />;
      default: return <Edit3 className="w-4 h-4 text-yellow-400" />;
    }
  };

  const StatusSection = ({ title, files, type }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded-t-lg">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title} ({files.length})
        </span>
        {type === 'unstaged' && files.length > 0 && (
          <button 
            onClick={handleStageAll}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Stage All
          </button>
        )}
      </div>
      <div className="border border-slate-800 rounded-b-lg overflow-hidden">
        {files.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-600 text-center">
            No {title.toLowerCase()}
          </div>
        ) : (
          files.map((file, i) => (
            <div 
              key={i}
              onClick={() => { setSelectedFile(file); handleStage(file.path); }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                selectedFiles.includes(file.path) ? 'bg-blue-900/20' : ''
              } ${i !== files.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={selectedFiles.includes(file.path)}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800"
              />
              <FileIcon change={file.change} />
              <span className="flex-1 text-sm text-slate-300 truncate">{file.path}</span>
              <span className={`text-xs capitalize ${
                file.change === 'added' ? 'text-green-400' :
                file.change === 'deleted' ? 'text-red-400' :
                file.change === 'untracked' ? 'text-gray-400' :
                'text-yellow-400'
              }`}>
                {file.change}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Git</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="text-orange-400">●</span>
              {branches.find(b => b.current)?.name || 'main'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePull}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Pull
          </button>
          <button
            onClick={handlePush}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Push
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
        {['changes', 'history', 'branches'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-orange-400 border-orange-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            {tab === 'changes' && <Edit3 className="w-4 h-4 inline mr-2" />}
            {tab === 'history' && <History className="w-4 h-4 inline mr-2" />}
            {tab === 'branches' && <GitBranch className="w-4 h-4 inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 overflow-auto p-4">
          {!isGitRepo && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <GitBranch className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm mb-2">No Git Repository Connected</p>
              <p className="text-xs opacity-60">Open a project with Git to see changes</p>
            </div>
          )}
          {isGitRepo && activeTab === 'changes' && (
            <div className="max-w-2xl">
              {/* Staged */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-3 py-2 bg-green-900/20 rounded-t-lg border border-green-800/50">
                    <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
                      Staged ({selectedFiles.length})
                    </span>
                    <button 
                      onClick={handleUnstageAll}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      Unstage All
                    </button>
                  </div>
                </div>
              )}

              {/* Unstaged */}
              <StatusSection 
                title="Changes" 
                files={status.unstaged} 
                type="unstaged"
              />

              {/* Untracked */}
              <StatusSection 
                title="Untracked" 
                files={status.untracked}
                type="unstaged"
              />

              {/* Commit Box */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                    Commit Message
                  </label>
                  <textarea
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder="Describe your changes..."
                    className="w-full h-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-orange-500/50 mb-3"
                  />
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || loading}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitCommit className="w-4 h-4" />
                    )}
                    Commit {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-2xl">
              <div className="space-y-3">
                {commits.map((commit, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <GitCommit className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white truncate">{commit.message}</h3>
                        <span className="text-xs text-slate-500">{commit.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-mono">{commit.hash}</span>
                        <span>•</span>
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.files} files</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Branches</h3>
                <button
                  onClick={() => setShowNewBranch(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Branch
                </button>
              </div>

              {showNewBranch && (
                <div className="mb-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <input
                    value={newBranchName}
                    onChange={e => setNewBranchName(e.target.value)}
                    placeholder="feature/my-feature"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateBranch}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white"
                    >
                      Create Branch
                    </button>
                    <button
                      onClick={() => setShowNewBranch(false)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {branches.map((branch, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      branch.current 
                        ? 'bg-orange-900/10 border-orange-800/50' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch className={`w-5 h-5 ${branch.current ? 'text-orange-400' : 'text-slate-400'}`} />
                      <div>
                        <div className={`font-medium ${branch.current ? 'text-orange-300' : 'text-slate-300'}`}>
                          {branch.name}
                          {branch.current && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-orange-600/30 text-orange-400 rounded-full">
                              current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{branch.lastCommit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(branch.ahead > 0 || branch.behind > 0) && (
                        <div className="text-xs text-slate-400">
                          {branch.ahead > 0 && <span className="text-green-400">↑{branch.ahead}</span>}
                          {branch.behind > 0 && <span className="text-red-400 ml-2">↓{branch.behind}</span>}
                        </div>
                      )}
                      {!branch.current && (
                        <button
                          onClick={() => handleSwitchBranch(branch.name)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Diff Panel (right side) */}
        {selectedFile && (
          <div className="w-96 border-l border-slate-800 bg-slate-900/30 overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300">{selectedFile.path}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-slate-300">
              {diff}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
