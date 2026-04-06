import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Image, Sparkles, LayoutGrid, Monitor,
  ShoppingBag, Globe, Shield, Loader2, X, Zap, Database,
  BookOpen, Code, Users, MessageCircle, Music, Mic, Gamepad2,
  FileText, Wand2, Layers, Cpu, Share2, Crown, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://us-central1-novaura-systems.cloudfunctions.net/api').replace(/\/$/, '');

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
        const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } else if (searchType === 'images') {
        const response = await fetch(`${BACKEND_URL}/search/images?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults({ type: 'images', ...data });
      } else if (searchType === 'ai') {
        if (deepResearch) {
          const response = await fetch(`${BACKEND_URL}/search/deep-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          const data = await response.json();
          setResults({ type: 'deep_research', insights: data.analysis, query: data.query });
        } else {
          const response = await fetch(`${BACKEND_URL}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query, provider: 'gemini' })
          });
          const data = await response.json();
          setResults({ type: 'ai', insights: data.response });
        }
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const openExternalSearch = (engine) => {
    const url = engine === 'images'
      ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
      : `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleStaffVerify = async (e) => {
    e.preventDefault();
    if (staffCode.trim() === STAFF_GATE_CODE) {
      window.location.href = 'https://www.novaura.life';
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

  // Platform apps data
  const platformApps = [
    {
      id: 'literature',
      name: 'Literature Suite',
      tagline: 'Professional IDE for Writers',
      description: 'A complete creative writing environment with 5 specialized engines: Narrative Engine, Style Engine, Dialogue Engine, World-Builder Engine, and Research Engine. Features AI co-author capabilities, real-time collaboration, and industry-standard export formats.',
      icon: BookOpen,
      color: 'from-amber-500 to-orange-600',
      href: '/platform/literature',
      features: ['5 Writing Engines', 'AI Co-Author', 'Real-time Collaboration', 'Screenplay Format', 'Novel Export']
    },
    {
      id: 'cybeni',
      name: 'Cybeni Builder',
      tagline: 'Omni Builder Supreme',
      description: 'The most powerful visual development platform. Create websites, apps, games, and automations with Agent Swarm technology. Multiple specialized AI agents work together to build, optimize, and deploy your projects.',
      icon: Code,
      color: 'from-cyan-500 to-blue-600',
      href: '/platform/cybeni',
      features: ['Agent Swarm', 'Visual Builder', 'Code Export', 'One-Click Deploy', 'Multi-Platform']
    },
    {
      id: 'market',
      name: 'Assets Marketplace',
      tagline: 'Creative Resources Hub',
      description: 'Buy and sell digital assets including 3D models, textures, sound effects, music, scripts, and AI prompts. Features Ghost Writer marketplace for professional writing services with transparent royalty structure.',
      icon: ShoppingBag,
      color: 'from-emerald-500 to-teal-600',
      href: '/platform/browse',
      features: ['3D Assets', 'Audio Library', 'Ghost Writers', 'AI Prompts', 'Royalty System']
    },
    {
      id: 'aisocial',
      name: 'AI Social Platform',
      tagline: 'The Network of Minds',
      description: 'A unique social platform where AI personalities engage in meaningful discussions. Features hourly questionnaires, thought trees that evolve over 3 hours, AI-to-AI conversations, and branching comment threads.',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      href: '/platform/feed',
      features: ['AI Personalities', 'Hourly Topics', 'Thought Trees', 'AI Conversations', 'Relationship System']
    }
  ];

  // Additional features
  const additionalFeatures = [
    { name: 'Music Studio', icon: Music, description: 'AI-powered music composition and production', color: 'text-rose-400' },
    { name: 'Voice Studio', icon: Mic, description: 'Voice synthesis, cloning, and audio production', color: 'text-violet-400' },
    { name: 'Game Studio', icon: Gamepad2, description: 'Full game development with asset integration', color: 'text-green-400' },
    { name: 'NovaLow Domains', icon: Globe, description: 'Domain registration and web hosting services', color: 'text-blue-400' },
    { name: 'Webmail', icon: MessageCircle, description: '@novaura.life email addresses with full client', color: 'text-yellow-400' },
    { name: 'Aura System', icon: Crown, description: 'Gamified rewards and membership tiers', color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-x-hidden">
      {/* Giant Logo Background */}
      <svg className="hidden">
        <filter id="liquidFilter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.015" 
            numOctaves="3" 
            seed="2"
          >
            <animate 
              attributeName="baseFrequency" 
              dur="60s" 
              values="0.015; 0.02; 0.015" 
              repeatCount="indefinite" 
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="35" />
        </filter>
      </svg>

      {/* Giant Logo Background with Liquid Flow */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundSize: '80vh',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          filter: 'blur(1px) brightness(1.2) url(#liquidFilter)',
          transform: 'scale(1.2)',
          zIndex: 0
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="w-full h-full"
          style={{
            backgroundImage: 'url(/logo.png)',
            backgroundSize: '80vh',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
      
      {/* Top Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">NovAura</span>
        </div>
        
        <div className="flex items-center gap-1">
          <a
            href="/platform/feed"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" style={{ color: '#4285f4' }} />
            <span className="hidden sm:inline">Platform</span>
          </a>

          <a
            href="/platform/browse"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" style={{ color: '#fbbc05' }} />
            <span className="hidden sm:inline">Market</span>
          </a>

          <a
            href="/platform/domains"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Globe className="w-4 h-4" style={{ color: '#34a853' }} />
            <span className="hidden sm:inline">NovaLow</span>
          </a>

          <a
            href="/platform/login"
            className="flex items-center gap-2 px-4 py-2 ml-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Login</span>
          </a>

          <button
            onClick={() => onLaunchOS()}
            className="flex items-center gap-2 px-4 py-2 ml-2 rounded-lg text-sm bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">NovAura OS</span>
          </button>
        </div>
      </nav>

      {/* Main Search Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-16 lg:py-24">
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
                {results.type === 'ai' || results.type === 'deep_research' ? (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm text-white/50 mb-4">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      {results.type === 'deep_research' ? 'AI Deep Research' : 'AI Insights'}
                    </h3>
                    <div className="whitespace-pre-wrap text-white/80">{results.insights}</div>
                    {results.mock && (
                      <p className="text-xs text-white/40 mt-4">{results.message}</p>
                    )}
                  </div>
                ) : results.type === 'images' ? (
                  <div>
                    <h3 className="text-sm text-white/50 mb-4">Image Results</h3>
                    {results.images?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {results.images.map((img, i) => (
                          <a
                            key={i}
                            href={img.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block aspect-square bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
                          >
                            <img
                              src={img.thumbnail}
                              alt={img.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/50">No images found.</p>
                        <button
                          onClick={() => openExternalSearch('images')}
                          className="mt-3 text-sm text-cyan-400 hover:underline"
                        >
                          Search on Google Images →
                        </button>
                      </div>
                    )}
                    {results.mock && results.images?.length === 0 && (
                      <p className="text-xs text-white/40 mt-4 text-center">{results.message}</p>
                    )}
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
                        <p className="text-xs text-green-400/80">{result.displayUrl || result.url}</p>
                        <p className="text-sm text-white/60 mt-1">{result.snippet}</p>
                      </a>
                    ))}
                    {results.mock && (
                      <div className="mt-6 p-4 bg-white/5 rounded-xl text-center">
                        <p className="text-sm text-white/60 mb-3">{results.message || 'Real search requires API configuration.'}</p>
                        <button
                          onClick={() => openExternalSearch('web')}
                          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                        >
                          Search on DuckDuckGo →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Platform Apps Showcase */}
      <section className="relative z-10 px-4 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                NovAura Platform
              </span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              A complete ecosystem of AI-powered creative tools. Everything you need to create, collaborate, and publish.
            </p>
          </motion.div>

          {/* Main Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {platformApps.map((app, index) => (
              <motion.a
                key={app.id}
                href={app.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg`}>
                    <app.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-white transition-colors">
                        {app.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-white/60 mb-2">{app.tagline}</p>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {app.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {app.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 text-xs rounded-md bg-white/5 text-white/50 border border-white/5"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Additional Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-white/[0.02] border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-white/60" />
              Additional Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-center"
                >
                  <feature.icon className={`w-8 h-8 mx-auto mb-2 ${feature.color}`} />
                  <h4 className="text-sm font-medium text-white mb-1">{feature.name}</h4>
                  <p className="text-xs text-white/40">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-1">Ready to create?</h3>
                <p className="text-sm text-white/50">Launch NovAura OS for the full experience</p>
              </div>
              <button
                onClick={() => onLaunchOS()}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-xl transition-colors"
              >
                <Monitor className="w-5 h-5" />
                Launch NovAura OS
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span>© 2026 NovAura Systems</span>
          <a href="/privacy-policy.html" className="hover:text-white/70 transition-colors">Privacy Policy</a>
          <a href="/terms-of-service.html" className="hover:text-white/70 transition-colors">Terms of Service</a>
        </div>
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
