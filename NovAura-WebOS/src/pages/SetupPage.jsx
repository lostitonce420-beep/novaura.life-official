import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Server, Sparkles, ArrowRight, RefreshCw, AlertCircle, Info, Monitor, Cloud } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { checkHealth, probeOllama, buildTaskRouting } from '../services/aiService';

// Common local LLM URLs
const PRESET_URLS = [
  { label: 'LM Studio (localhost:1234)', value: 'http://localhost:1234' },
  { label: 'LM Studio (local IP)', value: 'http://192.168.1.152:1234' },
  { label: 'Ollama (localhost:11434)', value: 'http://localhost:11434' },
  { label: 'Custom URL', value: 'custom' },
];

export default function SetupPage({ onComplete }) {
  const [localLLMUrl, setLocalLLMUrl] = useState('http://localhost:1234');
  const [selectedPreset, setSelectedPreset] = useState('http://localhost:1234');
  const [isChecking, setIsChecking] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState(null);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    // Allow scrolling on setup page
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, []);

  useEffect(() => {
    checkGeminiStatus();
    autoDetectOllama();
  }, []);

  const checkGeminiStatus = async () => {
    try {
      const data = await checkHealth();
      setGeminiStatus(data.gemini_api === 'configured' ? 'configured' : 'not_configured');
      if (data.gemini_api === 'configured') {
        setCanProceed(true);
      }
    } catch (error) {
      console.error('Error checking Gemini status:', error);
      setGeminiStatus('error');
      // Allow proceeding even without backend — user can still use local LLM or skip
      setCanProceed(true);
    }
  };

  const autoDetectOllama = async () => {
    const result = await probeOllama();
    if (result.connected && result.models.length > 0) {
      setSelectedPreset('http://localhost:11434');
      setLocalLLMUrl('http://localhost:11434');
      setLocalStatus('connected');
      setServerInfo({
        status: 'connected',
        server_type: 'ollama',
        models: result.models,
        message: `Auto-detected Ollama! Found ${result.models.length} model(s)`,
        autoDetected: true,
      });
      setUseLocalLLM(true);
      setCanProceed(true);
    }
  };

  const handlePresetChange = (value) => {
    setSelectedPreset(value);
    if (value !== 'custom') {
      setLocalLLMUrl(value);
    }
  };

  const checkLocalLLM = async () => {
    setIsChecking(true);
    setLocalStatus(null);
    setServerInfo(null);

    const url = localLLMUrl.replace(/\/$/, '');
    const is_ollama = url.includes(':11434') || url.toLowerCase().includes('ollama');
    const is_lmstudio = url.includes(':1234') || url.toLowerCase().includes('lmstudio');

    try {
      // Direct browser connection — the browser is on the same network as the local LLM
      let modelsEndpoint = is_ollama ? `${url}/api/tags` : `${url}/v1/models`;
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        let models = [];
        let serverType = 'generic';

        if (is_ollama) {
          models = (data.models || []).map(m => m.name || 'unknown');
          serverType = 'ollama';
        } else {
          models = (data.data || []).map(m => m.id || 'unknown');
          serverType = is_lmstudio ? 'lmstudio' : 'openai-compatible';
        }

        setLocalStatus('connected');
        setServerInfo({
          status: 'connected',
          server_type: serverType,
          models: models,
          message: `Connected via your browser! Found ${models.length} model(s)`
        });
        setUseLocalLLM(true);
        setCanProceed(true);
      } else {
        setLocalStatus('error');
        setServerInfo({ message: `Server responded with status ${response.status}` });
      }
    } catch (error) {
      console.error('Direct connection failed:', error);
      
      let errorMsg = 'Could not connect to your local LLM server.';
      if (error.name === 'TimeoutError') {
        errorMsg = 'Connection timed out.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = 'Network error — make sure your LLM server is running and CORS is enabled.';
      }
      
      setLocalStatus('error');
      setServerInfo({
        message: errorMsg,
        help: [
          'Make sure your LLM server (LM Studio/Ollama) is running',
          'For LM Studio: Enable CORS in Settings > Server',
          'For Ollama: It enables CORS by default',
          'Try using your machine\'s local IP (e.g., 192.168.x.x) instead of localhost',
        ]
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleProceed = () => {
    const models = serverInfo?.models || [];
    const isOllama = serverInfo?.server_type === 'ollama';
    const config = {
      useLocalLLM,
      localLLMUrl: useLocalLLM ? localLLMUrl : null,
      geminiConfigured: geminiStatus === 'configured',
      serverType: serverInfo?.server_type,
      availableModels: models,
      directBrowserConnection: true,
      // Ollama-specific config for smart routing
      ...(isOllama && useLocalLLM ? {
        ollamaUrl: localLLMUrl,
        ollamaModels: models,
        taskRouting: buildTaskRouting(models),
      } : {}),
      // LM Studio-specific config
      ...(!isOllama && useLocalLLM ? {
        lmstudioUrl: localLLMUrl,
        lmstudioModels: models,
      } : {}),
    };
    localStorage.setItem('llm_config', JSON.stringify(config));
    onComplete(config);
  };

  const skipLocalLLM = () => {
    setUseLocalLLM(false);
    setLocalStatus(null);
    setServerInfo(null);
    if (geminiStatus === 'configured') {
      setCanProceed(true);
      setTimeout(() => handleProceed(), 300);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-6 overflow-y-auto" data-testid="setup-page">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="relative z-10 w-full max-w-2xl p-8 glass border-primary/30 shadow-[0_0_60px_rgba(0,217,255,0.2)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2" data-testid="setup-title">
            NovAura AI OS
          </h1>
          <p className="text-muted-foreground">Configure your AI environment</p>
        </div>

        {/* Gemini Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5" data-testid="gemini-status">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Gemini AI (Cloud)</h3>
                <p className="text-sm text-muted-foreground">Google's Gemini AI</p>
              </div>
            </div>
            {geminiStatus === 'configured' ? (
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : geminiStatus === 'error' ? (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            ) : (
              <Badge variant="outline">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
          </div>
        </div>

        {/* Local LLM Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-foreground">Local LLM Server (Optional)</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Connect to Ollama or LM Studio running on your local machine
          </p>

          {/* Direct Browser Connection Info */}
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2" data-testid="browser-connection-info">
            <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-300">
              <strong>Direct Browser Connection:</strong> Your browser connects directly to your local LLM server — no cloud routing needed. This keeps your data private and fast.
            </div>
          </div>

          <div className="space-y-4">
            {/* Preset Selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Quick Select:</label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="bg-window-bg border-primary/20" data-testid="preset-select">
                  <SelectValue placeholder="Choose LLM server" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_URLS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={localLLMUrl}
                onChange={(e) => {
                  setLocalLLMUrl(e.target.value);
                  setSelectedPreset('custom');
                }}
                placeholder="http://localhost:1234"
                className="flex-1 bg-window-bg border-primary/20"
                data-testid="llm-url-input"
              />
              <Button
                onClick={checkLocalLLM}
                disabled={isChecking || !localLLMUrl}
                className="bg-secondary hover:bg-secondary/90"
                data-testid="test-connection-btn"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test
                  </>
                )}
              </Button>
            </div>

            {/* Status Display */}
            {localStatus && (
              <div className={`p-4 rounded-lg border ${
                localStatus === 'connected'
                  ? 'bg-success/10 border-success/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`} data-testid="connection-status">
                <div className="flex items-start gap-2">
                  {localStatus === 'connected' ? (
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${
                      localStatus === 'connected' ? 'text-success' : 'text-destructive'
                    }`}>
                      {localStatus === 'connected' ? 'Connected!' : 'Connection Failed'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {serverInfo?.message}
                    </p>
                    {serverInfo?.server_type && (
                      <Badge variant="outline" className="text-xs">
                        {serverInfo.server_type.toUpperCase()}
                      </Badge>
                    )}
                    {serverInfo?.models && serverInfo.models.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-foreground mb-1">Available Models:</p>
                        <div className="flex flex-wrap gap-1">
                          {serverInfo.models.slice(0, 5).map((model, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                          {serverInfo.models.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{serverInfo.models.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Help tips on failure */}
                    {serverInfo?.help && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-foreground">Troubleshooting:</p>
                        {serverInfo.help.map((tip, i) => (
                          <p key={i} className="text-xs text-muted-foreground">- {tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={skipLocalLLM}
              className="w-full text-muted-foreground hover:text-foreground"
              data-testid="skip-local-llm-btn"
            >
              Skip local LLM setup (use Gemini only)
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">About AI Configuration</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Gemini AI provides cloud-based intelligence for all features</li>
            <li>Local LLM (Ollama/LM Studio) connects directly from your browser</li>
            <li>Your local LLM data never leaves your network</li>
            <li>You can use both or just Gemini — your choice!</li>
          </ul>
        </div>

        {/* Proceed Button */}
        <Button
          onClick={handleProceed}
          disabled={!canProceed}
          className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-semibold py-6 text-lg shadow-[0_0_40px_rgba(0,217,255,0.3)]"
          data-testid="proceed-btn"
        >
          {canProceed ? (
            <>
              Enter NovAura AI OS
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Waiting for configuration...
            </>
          )}
        </Button>

        {import.meta.env.DEV && (
          <Button
            onClick={() => {
              const config = {
                useLocalLLM: false,
                localLLMUrl: null,
                geminiConfigured: false,
                directBrowserConnection: true,
                availableModels: [],
              };
              localStorage.setItem('llm_config', JSON.stringify(config));
              onComplete(config);
            }}
            variant="ghost"
            className="w-full mt-4 text-muted-foreground hover:text-primary text-xs"
          >
            Skip Setup (Dev Mode)
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your AI-powered desktop environment awaits
        </p>
      </Card>
    </div>
  );
}
