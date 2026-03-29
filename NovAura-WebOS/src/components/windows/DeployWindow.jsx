import React, { useState, useCallback } from 'react';
import { 
  Rocket, Globe, CheckCircle2, XCircle, Loader2, 
  ExternalLink, Copy, RefreshCw, Settings, Cloud,
  GitBranch, Terminal, FileCode, ArrowRight, AlertCircle,
  Check, X, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DEPLOYMENT PIPELINE - One-click publishing
// Build, deploy, and manage live applications
// ═══════════════════════════════════════════════════════════════════════════════

const DEPLOYMENT_STEPS = [
  { id: 'build', name: 'Build', description: 'Compile and optimize', icon: FileCode },
  { id: 'test', name: 'Test', description: 'Run validation checks', icon: CheckCircle2 },
  { id: 'upload', name: 'Upload', description: 'Deploy to hosting', icon: Cloud },
  { id: 'verify', name: 'Verify', description: 'Health checks', icon: Globe },
];

const MOCK_DEPLOYMENTS = [
  { 
    id: 1, 
    project: 'my-awesome-app', 
    url: 'https://my-app.novaura.life', 
    status: 'live', 
    lastDeploy: '2 hours ago',
    buildTime: '45s',
    commits: 3
  },
  { 
    id: 2, 
    project: 'landing-page', 
    url: 'https://landing-demo.novaura.life', 
    status: 'building', 
    lastDeploy: 'in progress',
    buildTime: '--',
    progress: 65
  },
  { 
    id: 3, 
    project: 'api-server', 
    url: 'https://api-demo.novaura.life', 
    status: 'error', 
    lastDeploy: '1 day ago',
    error: 'Build failed: dependency not found'
  },
];

const DOMAINS = [
  { id: 'free', name: 'novaura.life subdomain', price: 'Free', features: ['SSL included', 'Global CDN'] },
  { id: 'custom', name: 'Custom domain', price: 'Pro', features: ['Bring your own domain', 'SSL included', 'Global CDN'] },
];

export default function DeployWindow({ projectFiles, projectName }) {
  const [activeTab, setActiveTab] = useState('deploy'); // deploy | history | settings
  const [deployments, setDeployments] = useState(MOCK_DEPLOYMENTS);
  const [currentDeploy, setCurrentDeploy] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('free');
  const [customDomain, setCustomDomain] = useState('');
  const [buildLogs, setBuildLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [deployComplete, setDeployComplete] = useState(false);

  // ── Deployment Logic ─────────────────────────────────────────────────────────

  const simulateDeployment = useCallback(async () => {
    setDeploying(true);
    setDeployComplete(false);
    setBuildLogs([]);
    setCurrentStep(0);

    const logs = [
      { step: 'build', message: 'Starting build process...', time: new Date().toISOString() },
      { step: 'build', message: 'Installing dependencies...', time: new Date().toISOString() },
      { step: 'build', message: 'Running npm install...', time: new Date().toISOString() },
      { step: 'build', message: 'Optimizing assets...', time: new Date().toISOString() },
      { step: 'build', message: 'Build complete! (42s)', time: new Date().toISOString() },
      { step: 'test', message: 'Running tests...', time: new Date().toISOString() },
      { step: 'test', message: 'All tests passed ✓', time: new Date().toISOString() },
      { step: 'upload', message: 'Uploading to CDN...', time: new Date().toISOString() },
      { step: 'upload', message: 'Deploying to edge servers...', time: new Date().toISOString() },
      { step: 'verify', message: 'Running health checks...', time: new Date().toISOString() },
      { step: 'verify', message: 'Deployment verified! ✓', time: new Date().toISOString() },
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setBuildLogs(prev => [...prev, logs[i]]);
      
      // Update current step
      const stepIndex = DEPLOYMENT_STEPS.findIndex(s => s.id === logs[i].step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }

    // Create new deployment
    const subdomain = projectName?.toLowerCase().replace(/\s+/g, '-') || 'my-project';
    const newDeploy = {
      id: Date.now(),
      project: projectName || 'untitled-project',
      url: `https://${subdomain}.novaura.life`,
      status: 'live',
      lastDeploy: 'just now',
      buildTime: '42s',
      commits: 1
    };

    setDeployments([newDeploy, ...deployments]);
    setCurrentDeploy(newDeploy);
    setDeployComplete(true);
    setDeploying(false);
  }, [projectName, deployments]);

  const handleDeploy = () => {
    if (!projectFiles || projectFiles.length === 0) {
      alert('No files to deploy! Open a project first.');
      return;
    }
    simulateDeployment();
  };

  const handleRedeploy = (deploy) => {
    simulateDeployment();
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
  };

  // ── Render Helpers ───────────────────────────────────────────────────────────

  const StepIndicator = ({ step, index, current, completed }) => {
    const Icon = step.icon;
    const isActive = index === current;
    const isCompleted = index < current || completed;

    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isActive ? 'bg-blue-900/20 border-blue-600/50' :
        isCompleted ? 'bg-green-900/10 border-green-800/30' :
        'bg-slate-900 border-slate-800'
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isActive ? 'bg-blue-600/30 text-blue-400' :
          isCompleted ? 'bg-green-600/30 text-green-400' :
          'bg-slate-800 text-slate-500'
        }`}>
          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className={`font-medium ${isActive ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-slate-400'}`}>
            {step.name}
          </div>
          <div className="text-xs text-slate-500">{step.description}</div>
        </div>
      </div>
    );
  };

  // ── Main Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Deploy</h1>
            <p className="text-xs text-slate-500">Publish to the world</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {deployments.filter(d => d.status === 'live').length > 0 && (
            <div className="px-3 py-1.5 bg-green-900/30 rounded-lg text-sm text-green-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {deployments.filter(d => d.status === 'live').length} site{deployments.filter(d => d.status === 'live').length !== 1 ? 's' : ''} live
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
        {['deploy', 'sites', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-green-400 border-green-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            {tab === 'deploy' && <Rocket className="w-4 h-4 inline mr-2" />}
            {tab === 'sites' && <Globe className="w-4 h-4 inline mr-2" />}
            {tab === 'settings' && <Settings className="w-4 h-4 inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'deploy' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* New Deployment */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-1">New Deployment</h2>
                <p className="text-sm text-slate-400">
                  Deploy your project in seconds. We'll build, optimize, and host it for you.
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Domain Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Choose Domain</label>
                  <div className="grid grid-cols-2 gap-4">
                    {DOMAINS.map(domain => (
                      <button
                        key={domain.id}
                        onClick={() => setSelectedDomain(domain.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedDomain === domain.id
                            ? 'bg-blue-900/20 border-blue-600/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{domain.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            domain.id === 'free' ? 'bg-green-600/30 text-green-400' : 'bg-purple-600/30 text-purple-400'
                          }`}>
                            {domain.price}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {domain.features.map((feature, i) => (
                            <li key={i} className="text-xs text-slate-500 flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Domain Input */}
                {selectedDomain === 'custom' && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Your Domain</label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      placeholder="example.com"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You'll need to add a CNAME record pointing to cdn.novaura.life
                    </p>
                  </div>
                )}

                {/* Deploy Button */}
                <button
                  onClick={handleDeploy}
                  disabled={deploying || deployComplete}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl text-lg font-semibold text-white transition-all flex items-center justify-center gap-3"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Deploying...
                    </>
                  ) : deployComplete ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Deployed!
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Deploy to {selectedDomain === 'free' ? 'novaura.life' : 'Custom Domain'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Deployment Progress */}
            {(deploying || deployComplete) && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                  Deployment Progress
                </h3>
                <div className="space-y-3">
                  {DEPLOYMENT_STEPS.map((step, index) => (
                    <StepIndicator
                      key={step.id}
                      step={step}
                      index={index}
                      current={currentStep}
                      completed={deployComplete}
                    />
                  ))}
                </div>

                {/* Build Logs Toggle */}
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                  {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showLogs ? 'Hide' : 'Show'} Build Logs
                </button>

                {showLogs && (
                  <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    {buildLogs.map((log, i) => (
                      <div key={i} className="text-slate-400 mb-1">
                        <span className="text-slate-600">[{log.step}]</span> {log.message}
                      </div>
                    ))}
                    {deploying && <div className="text-blue-400 animate-pulse">...</div>}
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {deployComplete && currentDeploy && (
              <div className="bg-green-900/20 border border-green-800/50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-300 mb-1">
                      Deployment Complete!
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Your site is now live and accessible worldwide.
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="px-3 py-2 bg-slate-950 rounded-lg text-sm text-green-300">
                        {currentDeploy.url}
                      </code>
                      <button
                        onClick={() => copyUrl(currentDeploy.url)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={currentDeploy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sites' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Your Sites</h2>
            <div className="space-y-3">
              {deployments.map(deploy => (
                <div 
                  key={deploy.id}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        deploy.status === 'live' ? 'bg-green-600/20' :
                        deploy.status === 'building' ? 'bg-blue-600/20' :
                        'bg-red-600/20'
                      }`}>
                        {deploy.status === 'live' && <Globe className="w-5 h-5 text-green-400" />}
                        {deploy.status === 'building' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                        {deploy.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{deploy.project}</h3>
                        <a 
                          href={deploy.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {deploy.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {deploy.lastDeploy}
                          </span>
                          <span>Build: {deploy.buildTime}</span>
                          <span>{deploy.commits} commit{deploy.commits !== 1 ? 's' : ''}</span>
                        </div>
                        {deploy.error && (
                          <p className="text-xs text-red-400 mt-2">{deploy.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        deploy.status === 'live' ? 'bg-green-600/30 text-green-400' :
                        deploy.status === 'building' ? 'bg-blue-600/30 text-blue-400' :
                        'bg-red-600/30 text-red-400'
                      }`}>
                        {deploy.status}
                      </span>
                      {deploy.status !== 'building' && (
                        <button
                          onClick={() => handleRedeploy(deploy)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="Redeploy"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Auto-deploy on save</div>
                    <div className="text-sm text-slate-500">Automatically deploy when you save files</div>
                  </div>
                  <button className="w-12 h-6 bg-slate-700 rounded-full relative transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-transform" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Preview deployments</div>
                    <div className="text-sm text-slate-500">Create preview links for each commit</div>
                  </div>
                  <button className="w-12 h-6 bg-green-600 rounded-full relative transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Build optimization</div>
                    <div className="text-sm text-slate-500">Minify and compress assets</div>
                  </div>
                  <button className="w-12 h-6 bg-green-600 rounded-full relative transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Environment Variables</h3>
              <p className="text-sm text-slate-400 mb-4">
                Set environment variables for your deployment. These are encrypted and injected at build time.
              </p>
              <div className="p-4 bg-slate-950 rounded-xl border border-dashed border-slate-700 text-center">
                <p className="text-slate-500">Environment variables managed in Secrets window</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
