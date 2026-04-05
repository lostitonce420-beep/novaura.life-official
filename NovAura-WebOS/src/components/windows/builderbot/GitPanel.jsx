import React, { useState, useEffect } from 'react';
import { 
  GitBranch, GitCommit, GitMerge, GitPullRequest, GitCompare, 
  Plus, Check, X, ChevronDown, ChevronRight, RefreshCw, 
  MoreHorizontal, AlertCircle, History, Upload, Download,
  StickyNote, Trash2, Edit3
} from 'lucide-react';

export default function GitPanel({ gitEngine, files, onFileSelect }) {
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [status, setStatus] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('changes'); // changes, commits, branches
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (gitEngine) {
      loadGitData();
    }
  }, [gitEngine]);

  const loadGitData = async () => {
    if (!gitEngine) return;
    setLoading(true);
    try {
      const [branchList, current, fileStatus, commitLog, repoSummary] = await Promise.all([
        gitEngine.listBranches(),
        gitEngine.getCurrentBranch(),
        gitEngine.getStatus(),
        gitEngine.log(20),
        gitEngine.getSummary()
      ]);
      
      setBranches(branchList);
      setCurrentBranch(current);
      setStatus(fileStatus);
      setCommits(commitLog);
      setSummary(repoSummary);
    } catch (err) {
      console.error('Git data load failed:', err);
    }
    setLoading(false);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || selectedFiles.length === 0) return;
    
    setLoading(true);
    try {
      await gitEngine.commit(commitMessage, selectedFiles);
      setCommitMessage('');
      setSelectedFiles([]);
      await loadGitData();
    } catch (err) {
      console.error('Commit failed:', err);
    }
    setLoading(false);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    setLoading(true);
    try {
      await gitEngine.createBranch(newBranchName, true);
      setNewBranchName('');
      setShowNewBranch(false);
      await loadGitData();
    } catch (err) {
      console.error('Branch creation failed:', err);
    }
    setLoading(false);
  };

  const handleCheckout = async (branchName) => {
    setLoading(true);
    try {
      await gitEngine.checkout(branchName);
      await loadGitData();
    } catch (err) {
      console.error('Checkout failed:', err);
    }
    setLoading(false);
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      await gitEngine.push();
      await loadGitData();
    } catch (err) {
      console.error('Push failed:', err);
    }
    setLoading(false);
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      await gitEngine.pull();
      await loadGitData();
    } catch (err) {
      console.error('Pull failed:', err);
    }
    setLoading(false);
  };

  const toggleFileSelection = (filepath) => {
    setSelectedFiles(prev => 
      prev.includes(filepath) 
        ? prev.filter(f => f !== filepath)
        : [...prev, filepath]
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'added': return <Plus className="w-3 h-3 text-green-400" />;
      case 'modified': return <Edit3 className="w-3 h-3 text-yellow-400" />;
      case 'deleted': return <Trash2 className="w-3 h-3 text-red-400" />;
      case 'conflict': return <AlertCircle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'modified': return 'text-yellow-400';
      case 'deleted': return 'text-red-400';
      case 'conflict': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (!summary?.isRepo) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300 p-4">
        <div className="text-center py-8">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm mb-2">Not a Git repository</p>
          <div className="space-y-2">
            <button
              onClick={() => gitEngine.init()}
              className="w-full px-3 py-2 bg-primary/20 text-primary rounded text-[11px] hover:bg-primary/30"
            >
              Initialize Repository
            </button>
            <button
              onClick={() => setShowRemoteModal(true)}
              className="w-full px-3 py-2 bg-white/10 text-gray-300 rounded text-[11px] hover:bg-white/15"
            >
              Clone Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Git</span>
          </div>
          <button
            onClick={loadGitData}
            disabled={loading}
            className="p-1 rounded hover:bg-white/10 text-gray-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Branch selector */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 relative">
            <select
              value={currentBranch}
              onChange={(e) => handleCheckout(e.target.value)}
              className="w-full bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-2 py-1.5 border border-gray-700 outline-none appearance-none"
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={() => setShowNewBranch(!showNewBranch)}
            className="p-1.5 rounded bg-white/10 hover:bg-white/15"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Push/Pull buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handlePull}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white/10 text-gray-300 rounded text-[10px] hover:bg-white/15 disabled:opacity-50"
          >
            <Download className="w-3 h-3" /> Pull
          </button>
          <button
            onClick={handlePush}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30 disabled:opacity-50"
          >
            <Upload className="w-3 h-3" /> Push
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#2a2a4a] mt-2 pt-2">
          {[
            { id: 'changes', label: 'Changes', count: status.length },
            { id: 'commits', label: 'Commits', count: commits.length },
            { id: 'branches', label: 'Branches', count: branches.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 text-[10px] transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'changes' && (
          <div className="p-2">
            {status.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Check className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">No changes</p>
                <p className="text-[10px] text-gray-700">Working tree clean</p>
              </div>
            ) : (
              <>
                {/* File list */}
                <div className="space-y-1 mb-3">
                  {status.map(file => (
                    <div
                      key={file.filepath}
                      onClick={() => toggleFileSelection(file.filepath)}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${
                        selectedFiles.includes(file.filepath) ? 'bg-primary/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        selectedFiles.includes(file.filepath) 
                          ? 'bg-primary border-primary' 
                          : 'border-gray-600'
                      }`}>
                        {selectedFiles.includes(file.filepath) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {getStatusIcon(file.status)}
                      <span className="text-[10px] flex-1 truncate">{file.filepath}</span>
                      <span className={`text-[9px] ${getStatusColor(file.status)}`}>{file.status}</span>
                    </div>
                  ))}
                </div>

                {/* Commit form */}
                {selectedFiles.length > 0 && (
                  <div className="p-2 bg-[#252540] rounded">
                    <textarea
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message..."
                      className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none resize-none h-16 mb-2"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={!commitMessage.trim() || loading}
                      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30 disabled:opacity-50"
                    >
                      <GitCommit className="w-3 h-3" /> 
                      Commit {selectedFiles.length} files
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="p-2 space-y-1">
            {commits.map((commit, i) => (
              <div key={commit.sha} className="p-2 rounded hover:bg-white/5 cursor-pointer">
                <p className="text-[10px] text-gray-300 line-clamp-2">{commit.message}</p>
                <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500">
                  <span>{commit.author?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(commit.committer?.timestamp * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-2 space-y-1">
            {showNewBranch && (
              <div className="p-2 bg-[#252540] rounded mb-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  className="w-full bg-[#1e1e2e] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateBranch}
                    className="flex-1 px-2 py-1 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewBranch(false)}
                    className="px-2 py-1 bg-white/10 text-gray-400 rounded text-[10px] hover:bg-white/15"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {branches.map(branch => (
              <div
                key={branch}
                onClick={() => handleCheckout(branch)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                  branch === currentBranch ? 'bg-primary/20' : 'hover:bg-white/5'
                }`}
              >
                <GitBranch className="w-3 h-3 text-gray-500" />
                <span className={`text-[10px] flex-1 ${branch === currentBranch ? 'text-primary' : 'text-gray-300'}`}>
                  {branch}
                </span>
                {branch === currentBranch && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/30 text-primary">current</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
