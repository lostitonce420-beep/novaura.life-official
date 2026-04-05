import React, { useState } from 'react';
import { 
  Brain, RefreshCw, CheckCircle, AlertCircle, Clock,
  FileText, List, Target, Sparkles, ChevronDown, ChevronRight,
  Play, Pause, RotateCcw
} from 'lucide-react';
import { AI_WORKFLOW_STEPS, AIFocusManager } from './AIFocusManager';

export default function AIFocusPanel({ 
  storyBible, 
  content, 
  entryCount = 0,
  onResetContext,
  onProcessEntry,
  onRunFullAudit,
  workflowState = {}
}) {
  const [activeTab, setActiveTab] = useState('workflow'); // workflow, context, audit
  const [expandedSteps, setExpandedSteps] = useState({});
  const [processing, setProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleResetContext = async () => {
    setProcessing(true);
    try {
      const manager = new AIFocusManager(storyBible, { entryCount });
      const result = await manager.resetContext();
      setLastAnalysis(result);
      if (onResetContext) {
        onResetContext(result);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
    setProcessing(false);
  };

  const handleProcessEntry = async () => {
    if (!content) return;
    setProcessing(true);
    try {
      const manager = new AIFocusManager(storyBible, { entryCount });
      const result = await manager.processEntry(content, {
        chapter: 'Current',
        wordCount: content.split(/\s+/).length
      });
      setLastAnalysis(result);
      if (onProcessEntry) {
        onProcessEntry(result);
      }
    } catch (err) {
      console.error('Process entry failed:', err);
    }
    setProcessing(false);
  };

  const handleRunAudit = async () => {
    setProcessing(true);
    try {
      const manager = new AIFocusManager(storyBible, { entryCount });
      const result = await manager.performFullAudit(content);
      setLastAnalysis(result);
      if (onRunFullAudit) {
        onRunFullAudit(result);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    }
    setProcessing(false);
  };

  const getStepStatus = (stepId, category) => {
    // Check if step was completed
    const completed = workflowState.steps?.some(s => s.id === stepId && s.completed);
    return completed ? 'completed' : 'pending';
  };

  const renderWorkflowSection = (title, steps, category) => (
    <div className="mb-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">
        {steps.map(step => {
          const status = getStepStatus(step.id, category);
          const isExpanded = expandedSteps[step.id];
          
          return (
            <div 
              key={step.id}
              className={`p-2 rounded border ${
                status === 'completed' 
                  ? 'border-green-400/30 bg-green-400/10' 
                  : 'border-gray-700 bg-[#252540]'
              }`}
            >
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleStep(step.id)}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                )}
                <span className={`text-[10px] flex-1 ${
                  status === 'completed' ? 'text-gray-300' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {step.required && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary">
                    Required
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
              </div>
              
              {isExpanded && (
                <div className="mt-2 pl-5 text-[9px] text-gray-500">
                  {step.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">AI Focus</span>
          </div>
          <button
            onClick={handleResetContext}
            disabled={processing}
            className="p-1 rounded hover:bg-white/10 text-gray-500"
            title="Reset AI Context"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            Entry #{entryCount}
          </span>
          {entryCount > 0 && entryCount % 3 === 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" />
              Audit Due
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleProcessEntry}
            disabled={processing || !content}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-[10px] hover:bg-primary/30 disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            {processing ? 'Processing...' : 'Analyze Entry'}
          </button>
          <button
            onClick={handleRunAudit}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-[10px] hover:bg-yellow-400/30 disabled:opacity-50"
          >
            <Target className="w-3 h-3" />
            Full Audit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a4a]">
        {[
          { id: 'workflow', label: 'Workflow', icon: List },
          { id: 'context', label: 'Context', icon: FileText },
          { id: 'audit', label: 'Audit', icon: CheckCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'workflow' && (
          <>
            {renderWorkflowSection('On Session Start', AI_WORKFLOW_STEPS.SESSION_START, 'session')}
            {renderWorkflowSection('On Each Entry', AI_WORKFLOW_STEPS.ON_EACH_ENTRY, 'entry')}
            {renderWorkflowSection('Every 3 Entries', AI_WORKFLOW_STEPS.EVERY_3_ENTRIES, 'audit')}
          </>
        )}

        {activeTab === 'context' && (
          <div className="space-y-3">
            <div className="p-2 bg-[#252540] rounded">
              <p className="text-[10px] text-gray-500 mb-1">Story Bible Summary</p>
              <div className="text-[10px] text-gray-400 space-y-1">
                <p>Characters: {storyBible?.characters?.length || 0}</p>
                <p>Events: {storyBible?.timeline?.length || 0}</p>
                <p>Plot Threads: {storyBible?.plotThreads?.length || 0}</p>
                <p>Entries: {entryCount}</p>
              </div>
            </div>

            {lastAnalysis?.summary && (
              <div className="p-2 bg-primary/10 border border-primary/30 rounded">
                <p className="text-[10px] text-primary mb-1">Last Analysis</p>
                <p className="text-[9px] text-gray-400">{lastAnalysis.summary}</p>
              </div>
            )}

            {lastAnalysis?.analysis?.major_events?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Events Detected</p>
                {lastAnalysis.analysis.major_events.map((evt, i) => (
                  <div key={i} className="text-[9px] p-1.5 bg-[#252540] rounded mb-1">
                    <span className="text-primary">[{evt.type}]</span>{' '}
                    {evt.description}
                  </div>
                ))}
              </div>
            )}

            {lastAnalysis?.analysis?.continuity_alerts?.length > 0 && (
              <div>
                <p className="text-[10px] text-red-400 mb-1">Continuity Alerts</p>
                {lastAnalysis.analysis.continuity_alerts.map((alert, i) => (
                  <div key={i} className="text-[9px] p-1.5 bg-red-400/10 border border-red-400/30 rounded mb-1 text-red-300">
                    {alert}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-3">
            {lastAnalysis?.timeline_consistency && (
              <div className={`p-2 rounded border ${
                lastAnalysis.timeline_consistency.status === 'consistent'
                  ? 'border-green-400/30 bg-green-400/10'
                  : 'border-yellow-400/30 bg-yellow-400/10'
              }`}>
                <div className="flex items-center gap-2">
                  {lastAnalysis.timeline_consistency.status === 'consistent' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-[10px] font-medium">
                    Timeline: {lastAnalysis.timeline_consistency.status}
                  </span>
                </div>
                {lastAnalysis.timeline_consistency.issues?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lastAnalysis.timeline_consistency.issues.map((issue, i) => (
                      <p key={i} className="text-[9px] text-gray-400">
                        • {issue.description} ({issue.severity})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lastAnalysis?.character_arc_progression && (
              <div className="p-2 bg-[#252540] rounded">
                <p className="text-[10px] text-gray-500 mb-1">Character Arcs</p>
                <p className="text-[9px] text-gray-400">
                  Status: {lastAnalysis.character_arc_progression.status}
                </p>
              </div>
            )}

            {lastAnalysis?.recommendations && (
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Recommendations</p>
                <ul className="text-[9px] text-gray-400 space-y-1">
                  {lastAnalysis.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {!lastAnalysis && (
              <div className="text-center py-8 text-gray-600">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px]">Run Full Audit to see results</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
