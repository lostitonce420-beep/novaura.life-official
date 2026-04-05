import React, { useState, useEffect } from 'react';
import { 
  Check, X, AlertCircle, RefreshCw, Sparkles, 
  Type, AlignLeft, BookOpen, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import { SpellCheckEngine, aiGrammarCheck } from './SpellCheckEngine';

export default function GrammarPanel({ content, onApplySuggestion, storyBible }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, spelling, grammar, style
  const [showSettings, setShowSettings] = useState(false);
  const [engine, setEngine] = useState(null);
  const [stats, setStats] = useState({ spelling: 0, grammar: 0, style: 0 });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setEngine(new SpellCheckEngine({
      genre: storyBible?.genre || 'general',
      customDictionary: storyBible?.customWords || []
    }));
  }, [storyBible]);

  useEffect(() => {
    if (engine && content) {
      checkContent();
    }
  }, [content, engine]);

  const checkContent = async () => {
    if (!content || !engine) return;
    
    setLoading(true);
    try {
      const result = await engine.analyze(content);
      const allIssues = [
        ...result.spelling.map(i => ({ ...i, category: 'spelling' })),
        ...result.grammar.map(i => ({ ...i, category: 'grammar' }))
      ];
      setIssues(allIssues);
      setStats(result.summary);
    } catch (err) {
      console.error('Grammar check failed:', err);
    }
    setLoading(false);
  };

  const runAICheck = async () => {
    setAiLoading(true);
    try {
      const text = content?.replace(/<[^>]+>/g, '').substring(0, 5000);
      const result = await aiGrammarCheck(text, storyBible?.genre, storyBible);
      setAiSuggestions(result);
    } catch (err) {
      console.error('AI grammar check failed:', err);
    }
    setAiLoading(false);
  };

  const applySuggestion = (issue, replacement) => {
    if (onApplySuggestion) {
      onApplySuggestion(issue, replacement);
    }
    // Remove from list
    setIssues(prev => prev.filter(i => i !== issue));
  };

  const ignoreIssue = (issue) => {
    if (engine) {
      engine.ignoreWord(issue.word || issue.text);
    }
    setIssues(prev => prev.filter(i => i !== issue));
  };

  const addToDictionary = (word) => {
    if (engine) {
      engine.addToDictionary(word);
    }
    setIssues(prev => prev.filter(i => (i.word || i.text) !== word));
  };

  const filteredIssues = issues.filter(issue => {
    if (activeTab === 'all') return true;
    return issue.category === activeTab || issue.type === activeTab;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'error': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'suggestion': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'info': return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Grammar & Style</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded hover:bg-white/10 text-gray-500"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={checkContent}
              disabled={loading}
              className="p-1 rounded hover:bg-white/10 text-gray-500"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          {stats.spellingErrors > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/20 text-red-400">
              {stats.spellingErrors} spelling
            </span>
          )}
          {stats.grammarSuggestions > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
              {stats.grammarSuggestions} grammar
            </span>
          )}
          {stats.styleSuggestions > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-400">
              {stats.styleSuggestions} style
            </span>
          )}
          {issues.length === 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-400/20 text-green-400">
              No issues found
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-2 border-t border-[#2a2a4a] pt-2">
          {[
            { id: 'all', label: 'All', count: issues.length },
            { id: 'spelling', label: 'Spelling', count: stats.spellingErrors },
            { id: 'grammar', label: 'Grammar', count: stats.grammarSuggestions },
            { id: 'style', label: 'Style', count: stats.styleSuggestions },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-3 py-2 bg-[#252540] border-b border-[#2a2a4a]">
          <p className="text-[10px] text-gray-500 mb-2">Grammar Check Settings</p>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[10px] text-gray-400">
              <input type="checkbox" defaultChecked className="rounded" />
              Check spelling
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-400">
              <input type="checkbox" defaultChecked className="rounded" />
              Check grammar
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-400">
              <input type="checkbox" defaultChecked className="rounded" />
              Style suggestions
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-400">
              <input type="checkbox" defaultChecked className="rounded" />
              Passive voice detection
            </label>
          </div>
        </div>
      )}

      {/* AI Grammar Check Button */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <button
          onClick={runAICheck}
          disabled={aiLoading || !content}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3" />
          {aiLoading ? 'Analyzing...' : 'Deep AI Analysis'}
        </button>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredIssues.length === 0 && !aiSuggestions && (
          <div className="text-center py-8 text-gray-600">
            <Check className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No {activeTab === 'all' ? '' : activeTab} issues found</p>
            <p className="text-[10px] text-gray-700 mt-1">
              Run "Deep AI Analysis" for advanced suggestions
            </p>
          </div>
        )}

        {filteredIssues.map((issue, idx) => (
          <div
            key={idx}
            className={`p-2 rounded border ${getSeverityColor(issue.severity || 'suggestion')}`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium">
                    {issue.word || issue.text}
                  </span>
                  <span className="text-[9px] opacity-70">({issue.category})</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  {issue.message}
                </p>
                
                {issue.suggestion && (
                  <div className="mt-1.5 p-1.5 bg-black/20 rounded text-[10px]">
                    <span className="text-gray-500">Suggestion:</span>{' '}
                    {issue.suggestion}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  {issue.suggestion && (
                    <button
                      onClick={() => applySuggestion(issue, issue.suggestion)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-primary/30 text-primary rounded text-[9px] hover:bg-primary/40"
                    >
                      <Check className="w-3 h-3" /> Apply
                    </button>
                  )}
                  {issue.category === 'spelling' && (
                    <button
                      onClick={() => addToDictionary(issue.word)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-gray-400 rounded text-[9px] hover:bg-white/15"
                    >
                      <BookOpen className="w-3 h-3" /> Add to Dictionary
                    </button>
                  )}
                  <button
                    onClick={() => ignoreIssue(issue)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-gray-400 rounded text-[9px] hover:bg-white/15"
                  >
                    <X className="w-3 h-3" /> Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* AI Suggestions */}
        {aiSuggestions?.issues?.map((suggestion, idx) => (
          <div
            key={`ai-${idx}`}
            className={`p-2 rounded border ${getSeverityColor(suggestion.severity)}`}
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium">
                    {suggestion.type}
                  </span>
                  <span className="text-[9px] opacity-70">(AI)</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  {suggestion.explanation}
                </p>
                <div className="mt-1.5 p-1.5 bg-black/20 rounded text-[10px]">
                  <div className="text-red-400 line-through">{suggestion.original}</div>
                  <div className="text-green-400">{suggestion.suggestion}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
