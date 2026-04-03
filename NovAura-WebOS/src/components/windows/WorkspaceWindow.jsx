import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, FileCode, Image, Package, Grid, List, Search, Download, Upload, Settings } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const ASSET_TYPES = [
  { id: 'code', label: 'Code', icon: '💻', color: 'text-cyan-400' },
  { id: 'image', label: 'Image', icon: '🖼️', color: 'text-pink-400' },
  { id: 'sprite', label: 'Sprite', icon: '🎮', color: 'text-green-400' },
  { id: 'component', label: 'Component', icon: '⚙️', color: 'text-blue-400' },
  { id: 'document', label: 'Document', icon: '📄', color: 'text-amber-400' },
  { id: 'audio', label: 'Audio', icon: '🎵', color: 'text-purple-400' },
];

const ENGINES = ['Unreal','Unity','Godot','Phaser','Custom'];

export default function WorkspaceWindow() {
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('workspace_projects') || '[]'); } catch { return []; }
  });
  const [activeProject, setActiveProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEngine, setNewProjectEngine] = useState('Godot');

  const save = (updated) => { setProjects(updated); kernelStorage.setItem('workspace_projects', JSON.stringify(updated)); };

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const project = { id: `proj-${Date.now()}`, name: newProjectName, engine: newProjectEngine, assets: [], createdAt: new Date().toISOString() };
    save([...projects, project]);
    setActiveProject(project);
    setShowNewProject(false);
    setNewProjectName('');
  };

  const addAsset = (type) => {
    if (!activeProject) return;
    const asset = { id: `asset-${Date.now()}`, type, name: `New ${type}`, source: 'manual', createdAt: new Date().toISOString() };
    const updated = projects.map(p => p.id === activeProject.id ? { ...p, assets: [...p.assets, asset] } : p);
    save(updated);
    setActiveProject(updated.find(p => p.id === activeProject.id));
  };

  const removeAsset = (assetId) => {
    const updated = projects.map(p => p.id === activeProject.id ? { ...p, assets: p.assets.filter(a => a.id !== assetId) } : p);
    save(updated);
    setActiveProject(updated.find(p => p.id === activeProject.id));
  };

  const deleteProject = (id) => {
    if (!confirm('Delete this project?')) return;
    save(projects.filter(p => p.id !== id));
    if (activeProject?.id === id) setActiveProject(null);
  };

  const renameAsset = (assetId, newName) => {
    const updated = projects.map(p => p.id === activeProject.id
      ? { ...p, assets: p.assets.map(a => a.id === assetId ? { ...a, name: newName } : a) } : p);
    save(updated);
    setActiveProject(updated.find(p => p.id === activeProject.id));
  };

  const filteredAssets = activeProject?.assets.filter(a => {
    if (filter !== 'all' && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) || [];

  // Project view
  if (activeProject) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setActiveProject(null)} className="text-[10px] text-slate-400 hover:text-white">← Projects</button>
          <FolderOpen className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold truncate">{activeProject.name}</span>
          <span className="text-[9px] text-slate-500 ml-auto">{activeProject.engine} · {activeProject.assets.length} assets</span>
        </div>

        {/* Filter bar */}
        <div className="px-3 py-2 border-b border-slate-800/50 shrink-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
                className="w-full pl-7 pr-2 py-1 bg-black/30 border border-slate-800 rounded text-[10px] text-white placeholder-slate-500 focus:outline-none" />
            </div>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-1 text-slate-500 hover:text-white">
              {viewMode === 'grid' ? <List className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilter('all')} className={`px-2 py-0.5 rounded text-[9px] ${filter === 'all' ? 'bg-teal-600/30 text-teal-300' : 'text-slate-400 hover:bg-slate-800'}`}>All</button>
            {ASSET_TYPES.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`px-2 py-0.5 rounded text-[9px] ${filter === t.id ? 'bg-teal-600/30 text-teal-300' : 'text-slate-400 hover:bg-slate-800'}`}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        {/* Add asset buttons */}
        <div className="px-3 py-1.5 border-b border-slate-800/30 shrink-0 flex gap-1 overflow-x-auto">
          {ASSET_TYPES.map(t => (
            <button key={t.id} onClick={() => addAsset(t.id)}
              className="px-2 py-1 bg-slate-800/60 hover:bg-slate-700 rounded text-[9px] text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Plus className="w-2.5 h-2.5" />{t.icon}
            </button>
          ))}
        </div>

        {/* Assets */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No assets {search ? 'matching search' : 'yet — add some above'}</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredAssets.map(a => {
                const typeInfo = ASSET_TYPES.find(t => t.id === a.type) || ASSET_TYPES[0];
                return (
                  <div key={a.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all group relative">
                    <div className="text-2xl text-center mb-1">{typeInfo.icon}</div>
                    <input value={a.name} onChange={e => renameAsset(a.id, e.target.value)}
                      className="w-full text-center text-[10px] bg-transparent text-slate-300 focus:outline-none focus:text-white truncate" />
                    <div className="text-[8px] text-slate-600 text-center">{a.type}</div>
                    <button onClick={() => removeAsset(a.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAssets.map(a => {
                const typeInfo = ASSET_TYPES.find(t => t.id === a.type) || ASSET_TYPES[0];
                return (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded bg-slate-900/30 border border-slate-800/50 group">
                    <span>{typeInfo.icon}</span>
                    <input value={a.name} onChange={e => renameAsset(a.id, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none focus:text-white" />
                    <span className="text-[9px] text-slate-600">{a.type}</span>
                    <button onClick={() => removeAsset(a.id)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Projects list
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-teal-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold">Workspace</span>
          <span className="text-[10px] text-slate-500">{projects.length} projects</span>
        </div>
        <button onClick={() => setShowNewProject(true)} className="p-1.5 bg-teal-600/40 hover:bg-teal-500/40 rounded text-teal-300"><Plus className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {showNewProject && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-teal-800/30 space-y-2">
            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project name..."
              className="w-full px-3 py-1.5 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none" autoFocus />
            <div className="flex gap-1">
              {ENGINES.map(e => (
                <button key={e} onClick={() => setNewProjectEngine(e)}
                  className={`px-2 py-0.5 rounded text-[10px] ${newProjectEngine === e ? 'bg-teal-600/40 text-teal-300' : 'bg-slate-800 text-slate-400'}`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createProject} disabled={!newProjectName.trim()}
                className="flex-1 py-1.5 bg-teal-600/50 hover:bg-teal-500/50 rounded text-xs text-teal-200 disabled:opacity-30">Create</button>
              <button onClick={() => setShowNewProject(false)} className="px-3 py-1.5 bg-slate-800 rounded text-xs text-slate-400">Cancel</button>
            </div>
          </div>
        )}

        {projects.length === 0 && !showNewProject ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-500 mb-3">No projects yet</div>
            <button onClick={() => setShowNewProject(true)} className="px-4 py-2 bg-teal-600/40 rounded-lg text-xs text-teal-300">New Project</button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-slate-600 transition-all group">
                <button onClick={() => setActiveProject(p)} className="flex-1 text-left min-w-0">
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <div className="text-[9px] text-slate-500">{p.engine} · {p.assets.length} assets · {new Date(p.createdAt).toLocaleDateString()}</div>
                </button>
                <button onClick={() => deleteProject(p.id)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
