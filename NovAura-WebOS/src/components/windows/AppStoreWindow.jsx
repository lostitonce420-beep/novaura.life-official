import React, { useState } from 'react';
import {
  Store, Search, Package, Rocket, Zap,
  FolderOpen, ChevronRight, Trash2, Eye,
  FileCode, Star, Shield, Paintbrush,
} from 'lucide-react';
import RepoBrowser from './appstore/RepoBrowser';
import RepoDetail from './appstore/RepoDetail';
import EnhancePanel from './appstore/EnhancePanel';
import DeployPanel from './appstore/DeployPanel';
import useRepoStore from './appstore/useRepoStore';

// ── Tab definitions ──────────────────────────────────────────
const TABS = [
  { id: 'browse', label: 'Browse', icon: Search },
  { id: 'imported', label: 'My Apps', icon: Package },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
];

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    imported: 'bg-blue-500/10 text-blue-400',
    enhancing: 'bg-amber-500/10 text-amber-400',
    enhanced: 'bg-green-500/10 text-green-400',
    deploying: 'bg-primary/10 text-primary',
    deployed: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded ${styles[status] || 'bg-white/5 text-gray-500'}`}>
      {status}
    </span>
  );
}

// ── Imported Apps List ───────────────────────────────────────
function ImportedAppsList({ onSelect, onEnhance, onDeploy, onRemove }) {
  const importedApps = useRepoStore(s => s.importedApps);

  if (importedApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
        <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-primary/30" />
        </div>
        <div>
          <p className="text-[11px] text-gray-400">No apps imported yet</p>
          <p className="text-[10px] text-gray-600 mt-1 max-w-[240px]">
            Browse repositories, import open-source projects, enhance them with AI, and deploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
      <div className="text-[9px] text-gray-600 px-1 mb-1">{importedApps.length} imported app{importedApps.length !== 1 ? 's' : ''}</div>
      {importedApps.map(app => (
        <div
          key={app.id}
          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-all group"
        >
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-primary/40" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-200 truncate">
                {app.rebrandedName || app.name}
              </span>
              <StatusBadge status={app.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-gray-600">{app.files.length} files</span>
              <span className="text-[9px] text-gray-600">{app.language}</span>
              {app.originalName !== app.name && (
                <span className="text-[9px] text-gray-700">was: {app.originalName}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {app.status === 'imported' && (
              <button
                onClick={() => onEnhance(app)}
                className="p-1.5 rounded hover:bg-amber-500/10 text-gray-600 hover:text-amber-400 transition-colors"
                title="Enhance with AI"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}
            {(app.status === 'enhanced' || app.status === 'imported') && (
              <button
                onClick={() => onDeploy(app)}
                className="p-1.5 rounded hover:bg-primary/10 text-gray-600 hover:text-primary transition-colors"
                title="Deploy"
              >
                <Rocket className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onRemove(app.id)}
              className="p-1.5 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AppStoreWindow() {
  const [tab, setTab] = useState('browse');
  const [view, setView] = useState('list');         // list | detail | enhance | deploy
  const [activeApp, setActiveApp] = useState(null);  // app object for enhance/deploy

  const importedCount = useRepoStore(s => s.importedApps.length);

  // ── Navigation helpers ──
  const goDetail = (repo) => {
    useRepoStore.getState().fetchRepoFiles(repo);
    setView('detail');
  };

  const goEnhance = (app) => {
    setActiveApp(app);
    setView('enhance');
  };

  const goDeploy = (app) => {
    setActiveApp(app);
    setView('deploy');
    setTab('deploy');
  };

  const goBack = () => {
    setView('list');
    setActiveApp(null);
    useRepoStore.getState().clearSelection();
  };

  const handleImported = (app) => {
    setTab('imported');
    setView('list');
  };

  const handleRemove = (appId) => {
    useRepoStore.getState().removeApp(appId);
  };

  // ── Render current view ──
  if (view === 'detail') {
    return (
      <div className="flex flex-col h-full bg-[#12121e]">
        <RepoDetail
          onBack={goBack}
          onImport={handleImported}
          onEnhance={() => {
            // Import first, then enhance
            const repo = useRepoStore.getState().selectedRepo;
            if (repo) {
              useRepoStore.getState().importRepo(repo).then(app => {
                if (app) goEnhance(app);
              });
            }
          }}
        />
      </div>
    );
  }

  if (view === 'enhance' && activeApp) {
    return (
      <div className="flex flex-col h-full bg-[#12121e]">
        <EnhancePanel
          app={activeApp}
          onBack={goBack}
          onComplete={(appId) => {
            const updated = useRepoStore.getState().importedApps.find(a => a.id === appId);
            if (updated) setActiveApp(updated);
          }}
        />
      </div>
    );
  }

  if (view === 'deploy' && activeApp) {
    return (
      <div className="flex flex-col h-full bg-[#12121e]">
        <DeployPanel app={activeApp} onBack={goBack} />
      </div>
    );
  }

  // ── Default: tabbed view ──
  return (
    <div className="flex flex-col h-full bg-[#12121e] text-gray-300">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[12px] font-bold text-gray-200">Repo Station</h3>
          <p className="text-[9px] text-gray-600">Discover, enhance, rebrand & deploy</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setView('list'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] border-b-2 transition-colors ${
                isActive
                  ? 'text-primary border-primary font-medium'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {t.id === 'imported' && importedCount > 0 && (
                <span className="text-[8px] bg-primary/20 text-primary px-1 py-0.5 rounded-full min-w-[14px] text-center">
                  {importedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'browse' && (
          <RepoBrowser onSelectRepo={goDetail} />
        )}

        {tab === 'imported' && (
          <ImportedAppsList
            onSelect={(app) => { setActiveApp(app); setView('detail'); }}
            onEnhance={goEnhance}
            onDeploy={goDeploy}
            onRemove={handleRemove}
          />
        )}

        {tab === 'deploy' && !activeApp && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary/30" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">No app selected for deployment</p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-[260px]">
                Import and enhance an app first, then come here to deploy as ZIP, desktop app, or Android APK.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
