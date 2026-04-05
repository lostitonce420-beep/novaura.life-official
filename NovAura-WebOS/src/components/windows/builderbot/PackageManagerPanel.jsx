import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Download, Trash2, RefreshCw, AlertTriangle,
  CheckCircle, ChevronDown, ChevronRight, Shield, ExternalLink,
  Plus, Terminal, Info
} from 'lucide-react';

// Mock npm registry search - in real implementation, this would call npm API
const mockPackageSearch = async (query) => {
  // Simulated search results
  const packages = [
    { name: 'react', description: 'A declarative, efficient, and flexible JavaScript library...', version: '18.2.0', downloads: '20M', updated: '2 days ago' },
    { name: 'react-dom', description: 'React package for working with the DOM', version: '18.2.0', downloads: '19M', updated: '2 days ago' },
    { name: 'axios', description: 'Promise based HTTP client for the browser and node.js', version: '1.6.0', downloads: '35M', updated: '1 week ago' },
    { name: 'lodash', description: 'A modern JavaScript utility library delivering modularity...', version: '4.17.21', downloads: '45M', updated: '2 years ago' },
    { name: 'express', description: 'Fast, unopinionated, minimalist web framework', version: '4.18.2', downloads: '28M', updated: '3 months ago' },
    { name: 'tailwindcss', description: 'A utility-first CSS framework for rapidly building custom designs', version: '3.3.0', downloads: '8M', updated: '1 month ago' },
    { name: 'typescript', description: 'TypeScript is a superset of JavaScript that compiles...', version: '5.2.2', downloads: '40M', updated: '2 weeks ago' },
    { name: 'vue', description: 'The Progressive JavaScript Framework', version: '3.3.4', downloads: '4M', updated: '1 month ago' },
  ];
  
  if (!query) return packages.slice(0, 5);
  
  return packages.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );
};

export default function PackageManagerPanel({ projectPath, onInstall, onUninstall }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [installed, setInstalled] = useState([
    { name: 'react', version: '18.2.0', wanted: '18.2.0', latest: '18.2.0', type: 'dependency' },
    { name: 'react-dom', version: '18.2.0', wanted: '18.2.0', latest: '18.2.0', type: 'dependency' },
    { name: 'tailwindcss', version: '3.2.0', wanted: '3.2.0', latest: '3.3.0', type: 'devDependency', outdated: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('installed'); // installed, search
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installVersion, setInstallVersion] = useState('');
  const [isDevDependency, setIsDevDependency] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const results = await mockPackageSearch(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  };

  const handleInstall = async (pkg) => {
    setSelectedPackage(pkg);
    setInstallVersion(pkg.version);
    setShowInstallModal(true);
  };

  const confirmInstall = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newPackage = {
      name: selectedPackage.name,
      version: installVersion,
      wanted: installVersion,
      latest: selectedPackage.version,
      type: isDevDependency ? 'devDependency' : 'dependency'
    };
    
    setInstalled(prev => [...prev, newPackage]);
    if (onInstall) onInstall(newPackage);
    
    setShowInstallModal(false);
    setSelectedPackage(null);
    setLoading(false);
    setActiveTab('installed');
  };

  const handleUninstall = async (pkgName) => {
    if (!confirm(`Uninstall ${pkgName}?`)) return;
    
    setLoading(true);
    // Simulate uninstallation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setInstalled(prev => prev.filter(p => p.name !== pkgName));
    if (onUninstall) onUninstall(pkgName);
    
    setLoading(false);
  };

  const handleUpdate = async (pkg) => {
    setLoading(true);
    // Simulate update
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setInstalled(prev => prev.map(p => 
      p.name === pkg.name 
        ? { ...p, version: p.latest, wanted: p.latest, outdated: false }
        : p
    ));
    
    setLoading(false);
  };

  const handleUpdateAll = async () => {
    const outdated = installed.filter(p => p.outdated);
    if (outdated.length === 0) return;
    
    setLoading(true);
    // Simulate batch update
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setInstalled(prev => prev.map(p => 
      p.outdated 
        ? { ...p, version: p.latest, wanted: p.latest, outdated: false }
        : p
    ));
    
    setLoading(false);
  };

  const getOutdatedCount = () => installed.filter(p => p.outdated).length;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Packages</span>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="p-1 rounded hover:bg-white/10 text-gray-500"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-400">
            {installed.length} installed
          </span>
          {getOutdatedCount() > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
              {getOutdatedCount()} outdated
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#2a2a4a] mt-2 pt-2">
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex-1 py-1 text-[10px] transition-colors ${
              activeTab === 'installed'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Installed
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1 text-[10px] transition-colors ${
              activeTab === 'search'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'installed' && (
          <div className="p-2">
            {/* Update all button */}
            {getOutdatedCount() > 0 && (
              <button
                onClick={handleUpdateAll}
                disabled={loading}
                className="w-full mb-2 flex items-center justify-center gap-1 px-3 py-1.5 bg-yellow-400/20 text-yellow-400 rounded text-[10px] hover:bg-yellow-400/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Update All ({getOutdatedCount()})
              </button>
            )}

            {/* Package list */}
            <div className="space-y-1">
              {installed.map(pkg => (
                <div
                  key={pkg.name}
                  className={`p-2 rounded border ${
                    pkg.outdated 
                      ? 'border-yellow-400/30 bg-yellow-400/10' 
                      : 'border-gray-700 bg-[#252540]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium">{pkg.name}</span>
                      <span className="text-[9px] text-gray-500">{pkg.version}</span>
                      {pkg.outdated && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-400/30 text-yellow-400">
                          → {pkg.latest}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {pkg.outdated && (
                        <button
                          onClick={() => handleUpdate(pkg)}
                          disabled={loading}
                          className="p-1 rounded hover:bg-white/10 text-yellow-400"
                          title="Update"
                        >
                          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => handleUninstall(pkg.name)}
                        disabled={loading}
                        className="p-1 rounded hover:bg-white/10 text-red-400"
                        title="Uninstall"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                      pkg.type === 'devDependency' 
                        ? 'bg-purple-400/20 text-purple-400' 
                        : 'bg-blue-400/20 text-blue-400'
                    }`}>
                      {pkg.type === 'devDependency' ? 'dev' : 'prod'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-2">
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search npm packages..."
                className="w-full bg-[#2a2a4a] text-gray-300 text-[11px] rounded pl-7 pr-2 py-1.5 border border-gray-700 outline-none"
              />
            </div>

            {/* Search results */}
            <div className="space-y-2">
              {loading && searchQuery && (
                <div className="text-center py-4 text-gray-600">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-[10px]">Searching...</p>
                </div>
              )}

              {!loading && searchQuery && searchResults.map(pkg => (
                <div
                  key={pkg.name}
                  className="p-2 rounded border border-gray-700 bg-[#252540] hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-primary">{pkg.name}</span>
                        <span className="text-[9px] text-gray-500">{pkg.version}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2">
                        {pkg.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[8px] text-gray-500">
                        <span>📥 {pkg.downloads}/week</span>
                        <span>•</span>
                        <span>Updated {pkg.updated}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInstall(pkg)}
                      disabled={installed.some(p => p.name === pkg.name)}
                      className="ml-2 p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {!searchQuery && !loading && (
                <div className="text-center py-8 text-gray-600">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">Search for packages</p>
                  <p className="text-[10px] text-gray-700 mt-1">
                    Search npm registry for dependencies
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Install modal */}
      {showInstallModal && selectedPackage && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] rounded-lg border border-gray-700 p-4 w-full max-w-sm">
            <h3 className="text-sm font-medium mb-3">Install {selectedPackage.name}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Version</label>
                <input
                  type="text"
                  value={installVersion}
                  onChange={(e) => setInstallVersion(e.target.value)}
                  className="w-full bg-[#2a2a4a] text-gray-300 text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
                />
              </div>
              
              <label className="flex items-center gap-2 text-[10px] text-gray-400">
                <input
                  type="checkbox"
                  checked={isDevDependency}
                  onChange={(e) => setIsDevDependency(e.target.checked)}
                  className="rounded"
                />
                Dev dependency
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmInstall}
                disabled={loading}
                className="flex-1 px-3 py-1.5 bg-primary/20 text-primary rounded text-[11px] hover:bg-primary/30 disabled:opacity-50"
              >
                {loading ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={() => setShowInstallModal(false)}
                disabled={loading}
                className="px-3 py-1.5 bg-white/10 text-gray-400 rounded text-[11px] hover:bg-white/15"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
