import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Search,
  BookOpen, Globe, HelpCircle, ExternalLink, Filter
} from 'lucide-react';
import { FactChecker } from './FactChecker';

export default function FactCheckPanel({ content, storyBible, onMarkWorldbuilding }) {
  const [checker, setChecker] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filter, setFilter] = useState('all'); // all, verified, unverified, disputed, worldbuilding

  useEffect(() => {
    setChecker(new FactChecker({
      fictionMode: true,
      worldFacts: storyBible?.worldFacts || []
    }));
  }, [storyBible]);

  useEffect(() => {
    if (checker && content) {
      checkFacts();
    }
  }, [content, checker]);

  const checkFacts = async () => {
    if (!content || !checker) return;
    
    setLoading(true);
    try {
      const text = content.replace(/<[^>]+>/g, '');
      const result = await checker.checkText(text, {
        genre: storyBible?.genre,
        isFiction: true
      });
      setResults(result);
    } catch (err) {
      console.error('Fact check failed:', err);
    }
    setLoading(false);
  };

  const markAsWorldbuilding = (claim) => {
    if (checker) {
      checker.markAsWorldbuilding(claim.text || claim.claim, 'User marked as story fact');
    }
    if (onMarkWorldbuilding) {
      onMarkWorldbuilding(claim);
    }
    // Update local state
    setResults(prev => ({
      ...prev,
      claims: prev.claims.map(c => 
        c.claim === claim.claim ? { ...c, isWorldbuilding: true } : c
      )
    }));
  };

  const getStatusIcon = (claim) => {
    if (claim.isWorldbuilding) {
      return <BookOpen className="w-4 h-4 text-purple-400" />;
    }
    if (claim.verified === true) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (claim.verified === false) {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return <HelpCircle className="w-4 h-4 text-yellow-400" />;
  };

  const getStatusColor = (claim) => {
    if (claim.isWorldbuilding) return 'border-purple-400/30 bg-purple-400/10';
    if (claim.verified === true) return 'border-green-400/30 bg-green-400/10';
    if (claim.verified === false) return 'border-red-400/30 bg-red-400/10';
    return 'border-yellow-400/30 bg-yellow-400/10';
  };

  const getStatusLabel = (claim) => {
    if (claim.isWorldbuilding) return 'Worldbuilding';
    if (claim.verified === true) return 'Verified';
    if (claim.verified === false) return 'Disputed';
    return 'Unverified';
  };

  const filteredClaims = results?.claims?.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'worldbuilding') return claim.isWorldbuilding;
    if (filter === 'verified') return claim.verified === true;
    if (filter === 'unverified') return claim.verified === null;
    if (filter === 'disputed') return claim.verified === false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Fact Check</span>
          </div>
          <button
            onClick={checkFacts}
            disabled={loading}
            className="p-1 rounded hover:bg-white/10 text-gray-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        {results && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-400/20 text-green-400">
              {results.verified} verified
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
              {results.unverified} unverified
            </span>
            {results.disputed > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-400/20 text-red-400">
                {results.disputed} disputed
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400">
              {results.worldbuilding} worldbuilding
            </span>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-1 mt-2">
          <Filter className="w-3 h-3 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="all">All Claims</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="disputed">Disputed</option>
            <option value="worldbuilding">Worldbuilding</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!results && !loading && (
          <div className="text-center py-8 text-gray-600">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">Click refresh to check facts</p>
            <p className="text-[10px] text-gray-700 mt-1">
              AI will identify and verify factual claims
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-600">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
            <p className="text-[11px]">Analyzing content...</p>
          </div>
        )}

        {filteredClaims?.map((claim, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedClaim(selectedClaim === claim ? null : claim)}
            className={`p-2 rounded border cursor-pointer transition-all ${getStatusColor(claim)} ${
              selectedClaim === claim ? 'ring-1 ring-primary' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              {getStatusIcon(claim)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium truncate">
                    {claim.claim}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] opacity-70">{getStatusLabel(claim)}</span>
                  <span className="text-[9px] text-gray-600">•</span>
                  <span className="text-[9px] text-gray-500">{claim.type}</span>
                </div>

                {/* Expanded Details */}
                {selectedClaim === claim && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                    {claim.explanation && (
                      <p className="text-[10px] text-gray-400">
                        {claim.explanation}
                      </p>
                    )}

                    {/* Examples */}
                    {claim.examples?.length > 0 && (
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Sources/Examples:</p>
                        <div className="space-y-1">
                          {claim.examples.map((ex, i) => (
                            <div key={i} className="text-[9px] p-1.5 bg-black/20 rounded">
                              <span className={`capitalize ${
                                ex.type === 'supporting' ? 'text-green-400' :
                                ex.type === 'contradicting' ? 'text-red-400' :
                                'text-gray-400'
                              }`}>
                                {ex.type}:
                              </span>{' '}
                              {ex.description}
                              {ex.source && (
                                <span className="text-gray-600 block mt-0.5">
                                  Source: {ex.source}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {claim.suggestions?.length > 0 && (
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Suggestions:</p>
                        <ul className="text-[9px] text-gray-400 list-disc list-inside">
                          {claim.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Context */}
                    {claim.fullSentence && (
                      <div className="text-[9px] text-gray-500 italic">
                        Context: "{claim.fullSentence}"
                      </div>
                    )}

                    {/* Actions */}
                    {!claim.isWorldbuilding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsWorldbuilding(claim);
                        }}
                        className="mt-2 flex items-center gap-1 px-2 py-1 bg-purple-400/20 text-purple-400 rounded text-[9px] hover:bg-purple-400/30"
                      >
                        <BookOpen className="w-3 h-3" /> Mark as Worldbuilding
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {results && filteredClaims?.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No {filter} claims found</p>
          </div>
        )}
      </div>
    </div>
  );
}
