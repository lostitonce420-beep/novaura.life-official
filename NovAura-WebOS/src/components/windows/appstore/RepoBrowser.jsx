import React, { useState } from 'react';
import {
  Search, Star, GitFork, Shield, ShieldAlert, ExternalLink,
  Loader2, AlertCircle, Github, Box, ChevronRight, Filter,
} from 'lucide-react';
import useRepoStore from './useRepoStore';

// ── Language color badges ────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', PHP: '#4F5D95', HTML: '#e34c26',
  CSS: '#563d7c', Shell: '#89e051', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', Vue: '#41b883', Svelte: '#ff3e00',
};

function LanguageBadge({ language }) {
  if (!language) return null;
  const color = LANG_COLORS[language] || '#888';
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-400">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {language}
    </span>
  );
}

function LicenseBadge({ license, allowed }) {
  if (!license) return <span className="text-[9px] text-gray-600">No license</span>;
  return (
    <span className={`flex items-center gap-0.5 text-[9px] ${allowed ? 'text-green-400' : 'text-yellow-400'}`}>
      {allowed ? <Shield className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
      {license}
    </span>
  );
}

// ── Repo Card ────────────────────────────────────────────────
function RepoCard({ repo, onSelect }) {
  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <button
      onClick={() => onSelect(repo)}
      className="w-full text-left p-3 rounded-lg bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-black/30 transition-all group"
    >
      <div className="flex items-start gap-2.5">
        {repo.ownerAvatar ? (
          <img src={repo.ownerAvatar} alt="" className="w-8 h-8 rounded-md opacity-70 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            {repo.source === 'github' ? <Github className="w-4 h-4 text-gray-500" /> : <Box className="w-4 h-4 text-gray-500" />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-200 truncate">{repo.name}</span>
            <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{repo.owner}</p>
          {repo.description && (
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{repo.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <Star className="w-3 h-3" /> {repo.stars?.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <GitFork className="w-3 h-3" /> {repo.forks?.toLocaleString()}
            </span>
            <LanguageBadge language={repo.language} />
            <LicenseBadge license={repo.license} allowed={repo.licenseAllowed} />
            <span className="text-[9px] text-gray-600 ml-auto">{timeAgo(repo.updatedAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function RepoBrowser({ onSelectRepo }) {
  const {
    query, source, results, searching, searchError, totalResults,
    setQuery, setSource, searchRepos,
  } = useRepoStore();

  const [licenseFilter, setLicenseFilter] = useState('allowed'); // all | allowed

  const handleSearch = (e) => {
    e?.preventDefault();
    searchRepos();
  };

  const filteredResults = licenseFilter === 'allowed'
    ? results.filter(r => r.licenseAllowed)
    : results;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-3 py-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search repos... (e.g. react dashboard, python cli tool)"
            className="w-full pl-8 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-[11px] text-gray-200 placeholder-gray-500 outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          {/* Source tabs */}
          <div className="flex rounded-md overflow-hidden border border-white/10">
            <button
              type="button"
              onClick={() => setSource('github')}
              className={`px-2.5 py-1 text-[10px] flex items-center gap-1 transition-colors ${
                source === 'github' ? 'bg-primary/20 text-primary' : 'bg-black/20 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Github className="w-3 h-3" /> GitHub
            </button>
            <button
              type="button"
              onClick={() => setSource('huggingface')}
              className={`px-2.5 py-1 text-[10px] flex items-center gap-1 transition-colors ${
                source === 'huggingface' ? 'bg-primary/20 text-primary' : 'bg-black/20 text-gray-500 hover:text-gray-300'
              }`}
            >
              <Box className="w-3 h-3" /> HuggingFace
            </button>
          </div>

          {/* License filter */}
          <button
            type="button"
            onClick={() => setLicenseFilter(f => f === 'allowed' ? 'all' : 'allowed')}
            className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 border transition-colors ${
              licenseFilter === 'allowed'
                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                : 'border-white/10 text-gray-500 bg-black/20'
            }`}
          >
            <Filter className="w-3 h-3" />
            {licenseFilter === 'allowed' ? 'Rebrand OK' : 'All licenses'}
          </button>

          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="ml-auto px-3 py-1 text-[10px] rounded-md bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
        {searchError && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {searchError}
          </div>
        )}

        {searching && (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[11px]">Searching {source}...</span>
          </div>
        )}

        {!searching && filteredResults.length > 0 && (
          <>
            <div className="text-[9px] text-gray-600 px-1">
              {filteredResults.length} results{totalResults > 20 && ` of ${totalResults.toLocaleString()}`}
              {licenseFilter === 'allowed' && ' (rebrand-safe only)'}
            </div>
            {filteredResults.map(repo => (
              <RepoCard key={repo.id} repo={repo} onSelect={onSelectRepo} />
            ))}
          </>
        )}

        {!searching && results.length > 0 && filteredResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No repos with rebrand-safe licenses found</p>
            <button
              onClick={() => setLicenseFilter('all')}
              className="text-[10px] text-primary/60 hover:text-primary mt-1"
            >
              Show all results
            </button>
          </div>
        )}

        {!searching && !searchError && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-primary/30" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Discover Open Source</p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-[260px]">
                Search GitHub & HuggingFace for open-source projects.
                Import, enhance with AI, rebrand, and deploy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
