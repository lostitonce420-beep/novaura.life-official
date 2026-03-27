import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen, FileText, FileCode, Image, Film, Music, File, Archive,
  Upload, FolderPlus, Trash2, Download, RefreshCw, Search, ChevronRight,
  HardDrive, Cloud, GitBranch, MoreVertical, Pencil, X, Check,
  Loader2, Star, ArrowDownToLine, FolderUp, Home,
} from 'lucide-react';
import {
  listFiles, uploadFiles, uploadFolder, createFolder, deleteItem,
  downloadFile, renameItem, getStorageUsage, saveFile,
  getGitHubToken, setGitHubToken, listGitHubRepos, searchGitHubRepos,
  getGitHubContents, importGitHubFile,
  connectGoogleDrive, isDriveConnected, disconnectDrive,
  listDriveFiles, importDriveFile,
} from '../../services/fileStorageService';

// ── File type icon resolver ──
function getFileIcon(name, mimeType) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['js','jsx','ts','tsx','py','java','go','rs','c','cpp','h','rb','php','swift','kt','sh','json','yaml','yml','toml','xml','html','css','scss'].includes(ext)) return FileCode;
  if (['jpg','jpeg','png','gif','svg','webp','bmp','ico','avif'].includes(ext) || mimeType?.startsWith('image/')) return Image;
  if (['mp4','mov','avi','webm','mkv','flv'].includes(ext) || mimeType?.startsWith('video/')) return Film;
  if (['mp3','wav','flac','ogg','aac','m4a'].includes(ext) || mimeType?.startsWith('audio/')) return Music;
  if (['zip','tar','gz','rar','7z','bz2'].includes(ext)) return Archive;
  return FileText;
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Source badge ──
function SourceBadge({ source }) {
  if (!source || source === 'local') return null;
  const colors = { github: 'bg-gray-600', gdrive: 'bg-blue-600' };
  const labels = { github: 'GH', gdrive: 'Drive' };
  return <span className={`text-[8px] px-1 py-0.5 rounded ${colors[source] || 'bg-gray-600'} text-white`}>{labels[source] || source}</span>;
}

// ══════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════
export default function FilesWindow() {
  const [tab, setTab] = useState('local');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // ── Local state ──
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // ── GitHub state ──
  const [ghToken, setGhToken] = useState(getGitHubToken());
  const [ghTokenInput, setGhTokenInput] = useState('');
  const [ghRepos, setGhRepos] = useState([]);
  const [ghSearch, setGhSearch] = useState('');
  const [ghRepo, setGhRepo] = useState(null);
  const [ghPath, setGhPath] = useState('');
  const [ghContents, setGhContents] = useState([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState(null);

  // ── Drive state ──
  const [driveConnected, setDriveConnected] = useState(isDriveConnected());
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFolderStack, setDriveFolderStack] = useState([{ id: 'root', name: 'My Drive' }]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState(null);
  const [importing, setImporting] = useState(null);

  // ── Load local files ──
  const loadFiles = useCallback(async (path) => {
    setLoading(true); setError(null);
    try {
      const items = await listFiles(path || currentPath);
      setFiles(items);
      const u = await getStorageUsage();
      setUsage(u);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [currentPath]);

  useEffect(() => { loadFiles(currentPath); }, [currentPath]);

  const navigateTo = (path) => { setCurrentPath(path); setContextMenu(null); };

  const breadcrumbs = currentPath === '/' ? ['/'] : ['/', ...currentPath.split('/').filter(Boolean)];

  // ── Upload handlers ──
  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setLoading(true);
    try { await uploadFiles(Array.from(fileList), currentPath); await loadFiles(currentPath); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
    e.target.value = '';
  };

  const handleFolderUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setLoading(true);
    try { await uploadFolder(Array.from(fileList), currentPath); await loadFiles(currentPath); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;
    setLoading(true);
    try { await uploadFiles(droppedFiles, currentPath); await loadFiles(currentPath); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try { await createFolder(newFolderName.trim(), currentPath); setNewFolderName(''); setShowNewFolder(false); await loadFiles(currentPath); }
    catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try { await deleteItem(id); await loadFiles(currentPath); setContextMenu(null); }
    catch (err) { setError(err.message); }
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try { await renameItem(id, renameValue.trim()); setRenamingId(null); await loadFiles(currentPath); }
    catch (err) { setError(err.message); }
  };

  // ── GitHub handlers ──
  const connectGitHub = () => {
    setGitHubToken(ghTokenInput); setGhToken(ghTokenInput); setGhTokenInput('');
  };

  const loadGhRepos = useCallback(async () => {
    setGhLoading(true); setGhError(null);
    try {
      const repos = ghSearch ? await searchGitHubRepos(ghSearch) : await listGitHubRepos();
      setGhRepos(repos);
    } catch (err) { setGhError(err.message); }
    finally { setGhLoading(false); }
  }, [ghSearch]);

  const openGhRepo = async (owner, repo) => {
    setGhRepo({ owner, repo }); setGhPath('');
    setGhLoading(true); setGhError(null);
    try { setGhContents(await getGitHubContents(owner, repo)); }
    catch (err) { setGhError(err.message); } finally { setGhLoading(false); }
  };

  const navigateGh = async (path) => {
    if (!ghRepo) return;
    setGhPath(path); setGhLoading(true); setGhError(null);
    try { setGhContents(await getGitHubContents(ghRepo.owner, ghRepo.repo, path)); }
    catch (err) { setGhError(err.message); } finally { setGhLoading(false); }
  };

  const handleGhImport = async (item) => {
    if (!item.download_url) return;
    setImporting(item.name);
    try { await importGitHubFile(item.download_url, item.name, currentPath); }
    catch (err) { setError(err.message); } finally { setImporting(null); }
  };

  // ── Drive handlers ──
  const handleConnectDrive = async () => {
    setDriveLoading(true); setDriveError(null);
    try {
      await connectGoogleDrive();
      setDriveConnected(true);
      const data = await listDriveFiles('', 'root');
      setDriveFiles(data.files || []);
    } catch (err) { setDriveError(err.message); }
    finally { setDriveLoading(false); }
  };

  const handleDisconnectDrive = () => {
    disconnectDrive(); setDriveConnected(false); setDriveFiles([]);
    setDriveFolderStack([{ id: 'root', name: 'My Drive' }]);
  };

  const navigateDrive = async (folderId, folderName) => {
    setDriveLoading(true); setDriveError(null);
    setDriveFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
    try { setDriveFiles((await listDriveFiles('', folderId)).files || []); }
    catch (err) { setDriveError(err.message); } finally { setDriveLoading(false); }
  };

  const navigateDriveBack = async (index) => {
    const target = driveFolderStack[index];
    setDriveFolderStack(prev => prev.slice(0, index + 1));
    setDriveLoading(true); setDriveError(null);
    try { setDriveFiles((await listDriveFiles('', target.id)).files || []); }
    catch (err) { setDriveError(err.message); } finally { setDriveLoading(false); }
  };

  const searchDrive = async () => {
    if (!driveSearch.trim()) return;
    setDriveLoading(true); setDriveError(null);
    try { setDriveFiles((await listDriveFiles(driveSearch)).files || []); }
    catch (err) { setDriveError(err.message); } finally { setDriveLoading(false); }
  };

  const handleDriveImport = async (file) => {
    setImporting(file.name);
    try { await importDriveFile(file.id, file.name, file.mimeType, currentPath); }
    catch (err) { setError(err.message); } finally { setImporting(null); }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-gray-200" onClick={() => setContextMenu(null)}>
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
      <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleFolderUpload}
        {...{ webkitdirectory: '', mozdirectory: '', directory: '' }} />

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-white/10">
        {[
          { id: 'local', label: 'My Files', icon: HardDrive },
          { id: 'github', label: 'GitHub', icon: GitBranch },
          { id: 'drive', label: 'Google Drive', icon: Cloud },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:bg-white/5'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── MY FILES TAB ─── */}
      {tab === 'local' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-primary/15 text-primary hover:bg-primary/25">
              <Upload className="w-3 h-3" /> Files
            </button>
            <button onClick={() => folderInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-white/[0.07] text-gray-300 hover:bg-white/[0.12]">
              <FolderUp className="w-3 h-3" /> Folder
            </button>
            <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-white/[0.07] text-gray-300 hover:bg-white/[0.12]">
              <FolderPlus className="w-3 h-3" /> New
            </button>
            <div className="flex-1" />
            <button onClick={() => loadFiles(currentPath)} className="p-1 text-gray-500 hover:text-gray-300">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 text-[11px] text-gray-500 overflow-x-auto">
            {breadcrumbs.map((seg, i) => {
              const path = i === 0 ? '/' : '/' + breadcrumbs.slice(1, i + 1).join('/');
              return (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                  <button onClick={() => navigateTo(path)} className="hover:text-primary shrink-0">
                    {i === 0 ? <Home className="w-3 h-3" /> : seg}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* New folder input */}
          {showNewFolder && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03]">
              <FolderOpen className="w-4 h-4 text-primary" />
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name..." autoFocus
                className="flex-1 bg-transparent text-sm outline-none text-gray-200 placeholder-gray-600" />
              <button onClick={handleCreateFolder} className="p-0.5 text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-0.5 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Drag & drop file list */}
          <div className={`flex-1 overflow-auto transition-colors ${dragOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : error ? (
              <div className="text-center text-red-400 text-sm p-4">{error}</div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Upload className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Drop files here or use the upload buttons</p>
              </div>
            ) : (
              <div>
                {files.map(item => {
                  const Icon = item.type === 'folder' ? FolderOpen : getFileIcon(item.name, item.mimeType);
                  const isRenaming = renamingId === item.id;
                  return (
                    <div key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] cursor-default group"
                      onDoubleClick={() => item.type === 'folder' && navigateTo(item.path)}
                      onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item }); }}>
                      <Icon className={`w-4 h-4 shrink-0 ${item.type === 'folder' ? 'text-primary' : 'text-gray-400'}`} />
                      {isRenaming ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(item.id); if (e.key === 'Escape') setRenamingId(null); }}
                          onBlur={() => handleRename(item.id)} autoFocus
                          className="flex-1 bg-white/5 rounded px-1 text-sm outline-none text-gray-200" />
                      ) : (
                        <span className="flex-1 text-sm truncate" onClick={() => item.type === 'folder' && navigateTo(item.path)}>
                          {item.name}
                        </span>
                      )}
                      <SourceBadge source={item.source} />
                      <span className="text-[10px] text-gray-600 w-16 text-right shrink-0">{formatSize(item.size)}</span>
                      <span className="text-[10px] text-gray-600 w-14 text-right shrink-0">{formatDate(item.createdAt)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                        {item.type === 'file' && (
                          <button onClick={() => downloadFile(item.id)} className="p-0.5 text-gray-500 hover:text-gray-300">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setRenamingId(item.id); setRenameValue(item.name); }} className="p-0.5 text-gray-500 hover:text-gray-300">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-0.5 text-gray-500 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-primary text-lg font-semibold bg-[#0a0a0f]/90 px-6 py-3 rounded-xl border border-primary/30">
                  Drop to upload
                </p>
              </div>
            )}
          </div>

          {/* Status bar */}
          {usage && (
            <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-gray-600 border-t border-white/[0.06]">
              <span>{usage.fileCount} files, {usage.folderCount} folders</span>
              <span>{formatSize(usage.totalSize)} stored</span>
            </div>
          )}
        </>
      )}

      {/* ─── GITHUB TAB ─── */}
      {tab === 'github' && (
        <>
          <div className="px-3 py-2 border-b border-white/[0.06] space-y-2">
            {!ghToken ? (
              <div className="flex gap-2">
                <input value={ghTokenInput} onChange={e => setGhTokenInput(e.target.value)}
                  placeholder="GitHub personal access token..." type="password"
                  className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30" />
                <button onClick={connectGitHub} disabled={!ghTokenInput.trim()}
                  className="px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 disabled:opacity-40">
                  Connect
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-400">Connected</span>
                <div className="flex-1" />
                <button onClick={() => { setGitHubToken(''); setGhToken(''); setGhRepos([]); setGhRepo(null); }}
                  className="text-[10px] text-red-400 hover:text-red-300">Disconnect</button>
              </div>
            )}
            {(ghToken || true) && !ghRepo && (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                  <input value={ghSearch} onChange={e => setGhSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadGhRepos()}
                    placeholder={ghToken ? 'Search repos...' : 'Search public repos...'}
                    className="w-full pl-7 pr-2 py-1.5 bg-white/5 border border-white/[0.06] rounded-lg text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30" />
                </div>
                <button onClick={loadGhRepos} className="px-2 py-1.5 bg-white/[0.07] text-gray-300 text-xs rounded-lg hover:bg-white/[0.12]">
                  {ghToken && !ghSearch ? 'My Repos' : 'Search'}
                </button>
              </div>
            )}
            {ghRepo && (
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => { setGhRepo(null); setGhContents([]); setGhPath(''); }}
                  className="text-primary hover:underline">Repos</button>
                <ChevronRight className="w-3 h-3 text-gray-500" />
                <span className="text-gray-300 font-medium">{ghRepo.owner}/{ghRepo.repo}</span>
                {ghPath && (
                  <>
                    {ghPath.split('/').map((seg, i, arr) => (
                      <React.Fragment key={i}>
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                        <button onClick={() => navigateGh(arr.slice(0, i + 1).join('/'))}
                          className="text-gray-400 hover:text-primary">{seg}</button>
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {ghLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : ghError ? (
              <div className="text-center text-red-400 text-sm p-4">{ghError}</div>
            ) : ghRepo ? (
              /* Repo file browser */
              <div>
                {ghPath && (
                  <button onClick={() => {
                    const parent = ghPath.split('/').slice(0, -1).join('/');
                    navigateGh(parent);
                  }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-white/[0.04] w-full">
                    <FolderUp className="w-3.5 h-3.5" /> ..
                  </button>
                )}
                {(Array.isArray(ghContents) ? ghContents : []).sort((a, b) => {
                  if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                  return a.name.localeCompare(b.name);
                }).map(item => {
                  const Icon = item.type === 'dir' ? FolderOpen : getFileIcon(item.name);
                  return (
                    <div key={item.sha} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] group">
                      <Icon className={`w-4 h-4 shrink-0 ${item.type === 'dir' ? 'text-primary' : 'text-gray-400'}`} />
                      <button className="flex-1 text-sm text-left truncate text-gray-200"
                        onClick={() => item.type === 'dir' ? navigateGh(item.path) : null}>
                        {item.name}
                      </button>
                      {item.size > 0 && <span className="text-[10px] text-gray-600">{formatSize(item.size)}</span>}
                      {item.type === 'file' && item.download_url && (
                        <button onClick={() => handleGhImport(item)}
                          disabled={importing === item.name}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary/15 text-primary rounded hover:bg-primary/25 opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {importing === item.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                          Import
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : ghRepos.length > 0 ? (
              /* Repo list */
              <div>
                {ghRepos.map(repo => (
                  <button key={repo.id} onClick={() => openGhRepo(repo.owner?.login || repo.full_name.split('/')[0], repo.name)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] w-full text-left">
                    <GitBranch className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{repo.full_name}</p>
                      {repo.description && <p className="text-[10px] text-gray-500 truncate">{repo.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                      {repo.stargazers_count > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{repo.stargazers_count}</span>}
                      {repo.language && <span className="px-1.5 py-0.5 bg-white/5 rounded">{repo.language}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <GitBranch className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{ghToken ? 'Click "My Repos" or search' : 'Connect with a token or search public repos'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── GOOGLE DRIVE TAB ─── */}
      {tab === 'drive' && (
        <>
          <div className="px-3 py-2 border-b border-white/[0.06] space-y-2">
            {!driveConnected ? (
              <button onClick={handleConnectDrive} disabled={driveLoading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/30 disabled:opacity-50">
                {driveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                Connect Google Drive
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-400">Drive Connected</span>
                  <div className="flex-1" />
                  <button onClick={handleDisconnectDrive} className="text-[10px] text-red-400 hover:text-red-300">Disconnect</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input value={driveSearch} onChange={e => setDriveSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchDrive()}
                      placeholder="Search Drive..."
                      className="w-full pl-7 pr-2 py-1.5 bg-white/5 border border-white/[0.06] rounded-lg text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30" />
                  </div>
                  <button onClick={searchDrive} className="px-2 py-1.5 bg-white/[0.07] text-gray-300 text-xs rounded-lg hover:bg-white/[0.12]">Search</button>
                </div>
                {/* Drive breadcrumbs */}
                <div className="flex items-center gap-0.5 text-[11px] text-gray-500 overflow-x-auto">
                  {driveFolderStack.map((f, i) => (
                    <React.Fragment key={f.id}>
                      {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                      <button onClick={() => navigateDriveBack(i)} className="hover:text-primary shrink-0">{f.name}</button>
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {driveLoading ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : driveError ? (
              <div className="text-center p-4">
                <p className="text-red-400 text-sm mb-2">{driveError}</p>
                {driveError.includes('expired') && (
                  <button onClick={handleConnectDrive} className="text-xs text-primary hover:underline">Reconnect</button>
                )}
              </div>
            ) : !driveConnected ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Cloud className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Connect your Google Drive to browse files</p>
                <p className="text-[10px] text-gray-700 mt-1">Requires Google Drive API enabled in your project</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <FolderOpen className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No files found</p>
              </div>
            ) : (
              <div>
                {driveFiles.map(file => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const Icon = isFolder ? FolderOpen : getFileIcon(file.name, file.mimeType);
                  return (
                    <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] group">
                      {file.iconLink ? (
                        <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" />
                      ) : (
                        <Icon className={`w-4 h-4 shrink-0 ${isFolder ? 'text-primary' : 'text-gray-400'}`} />
                      )}
                      <button className="flex-1 text-sm text-left truncate text-gray-200"
                        onClick={() => isFolder ? navigateDrive(file.id, file.name) : null}>
                        {file.name}
                      </button>
                      {file.size && <span className="text-[10px] text-gray-600">{formatSize(parseInt(file.size))}</span>}
                      {file.modifiedTime && <span className="text-[10px] text-gray-600 w-14 text-right shrink-0">{formatDate(new Date(file.modifiedTime).getTime())}</span>}
                      {!isFolder && (
                        <button onClick={() => handleDriveImport(file)}
                          disabled={importing === file.name}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-500/15 text-blue-400 rounded hover:bg-blue-500/25 opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {importing === file.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                          Import
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Import toast */}
      {importing && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#12121f] border border-primary/30 rounded-xl shadow-lg text-xs text-primary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing {importing}...
        </div>
      )}
    </div>
  );
}
