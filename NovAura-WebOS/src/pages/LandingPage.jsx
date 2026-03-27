import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Image, Sparkles, Mail, LayoutGrid, Monitor, 
  ShoppingBag, Globe, Shield, Loader2, X, Zap, Database
} from 'lucide-react';
import { toast } from 'sonner';

const STAFF_GATE_CODE = '<catalyst>';

export default function LandingPage({ onLaunchOS }) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('web');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffCode, setStaffCode] = useState('');
  const [deepResearch, setDeepResearch] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setResults(null);

    try {
      if (searchType === 'web') {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } else if (searchType === 'ai') {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query, provider: 'gemini' })
        });
        const data = await response.json();
        setResults({ type: 'ai', insights: data.response });
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStaffVerify = async (e) => {
    e.preventDefault();
    if (staffCode.trim() === STAFF_GATE_CODE) {
      window.location.href = '/staff-login';
    } else {
      toast.error('Invalid access code');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        setShowStaffModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Top Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">NovAura</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Email */}
          <button
            onClick={() => window.open('https://novaura.life:2096', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" style={{ color: '#ea4335' }} />
            <span className="hidden sm:inline">Mail</span>
          </button>

          {/* Platform */}
          <button
            onClick={() => onLaunchOS()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" style={{ color: '#4285f4' }} />
            <span className="hidden sm:inline">Platform</span>
          </button>

          {/* Market */}
          <button
            onClick={() => onLaunchOS('appstore')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" style={{ color: '#fbbc05' }} />
            <span className="hidden sm:inline">Market</span>
          </button>

          {/* NovaLow */}
          <button
            onClick={() => onLaunchOS('browser')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" style={{ color: '#34a853' }} />
            <span className="hidden sm:inline">NovaLow</span>
          </button>
          
          {/* Launch OS */}
          <button
            onClick={() => onLaunchOS()}
            className="flex items-center gap-2 px-4 py-2 ml-2 rounded-lg text-sm bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">NovAura OS</span>
          </button>
        </div>
      </nav>

      {/* Main Search */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-6xl sm:text-7xl font-bold text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            NovAura
          </h1>
          <p className="text-center text-white/40 mt-2 text-sm tracking-widest uppercase">
            Search • Create • Explore
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl"
        >
          {/* Search Type Tabs */}
          <div className="flex items-center gap-1 mb-3 px-1">
            {[
              { id: 'web', label: 'Web', icon: Search },
              { id: 'images', label: 'Images', icon: Image },
              { id: 'ai', label: 'AI Insights', icon: Sparkles },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  searchType === type.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
            
            {searchType === 'ai' && (
              <label className="flex items-center gap-2 ml-auto px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={deepResearch}
                  onChange={(e) => setDeepResearch(e.target.checked)}
                  className="w-3 h-3 rounded"
                />
                <Database className="w-3 h-3" />
                Deep Research
              </label>
            )}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-cyan-500/50 focus-within:bg-white/[0.07] transition-all">
              <Search className="w-5 h-5 text-white/40 ml-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the web..."
                className="flex-1 bg-transparent px-4 py-4 text-white placeholder-white/30 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-2 m-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 text-black font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6"
              >
                {results.type === 'ai' ? (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm text-white/50 mb-4">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      AI Insights
                    </h3>
                    <div className="whitespace-pre-wrap text-white/80">{results.insights}</div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm text-white/50 mb-4">Web Results</h3>
                    {results.results?.map((result, i) => (
                      <a
                        key={i}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <h4 className="text-cyan-400 hover:underline">{result.title}</h4>
                        <p className="text-xs text-green-400/80">{result.url}</p>
                        <p className="text-sm text-white/60 mt-1">{result.snippet}</p>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer with hidden staff button */}
      <footer className="px-6 py-4 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
        <span>© 2026 NovAura Systems</span>
        <button
          onClick={() => setShowStaffModal(true)}
          className="opacity-0 hover:opacity-30 transition-opacity"
          title="Staff Portal (Ctrl+Shift+S)"
        >
          <Shield className="w-4 h-4" />
        </button>
      </footer>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f14] border border-white/10 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Staff Portal</h2>
                  <p className="text-sm text-white/50">Authorized personnel only</p>
                </div>
              </div>

              <form onSubmit={handleStaffVerify}>
                <div className="space-y-4">
                  <input
                    type="password"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="Enter staff code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowStaffModal(false)}
                      className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Verify
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
