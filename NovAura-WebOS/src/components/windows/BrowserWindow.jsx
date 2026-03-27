import React, { useState } from 'react';
import { Globe, Search, ArrowLeft, ArrowRight, RotateCw, Home, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

export default function BrowserWindow() {
  const [url, setUrl] = useState('https://example.com');
  const [isAIMode, setIsAIMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleNavigate = (newUrl) => {
    setUrl(newUrl);
    const newHistory = [...history.slice(0, currentIndex + 1), newUrl];
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    
    if (isAIMode) {
      toast.info('AI is analyzing the page', {
        description: 'Extracting structure and content...',
      });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUrl(history[currentIndex - 1]);
    }
  };

  const handleForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUrl(history[currentIndex + 1]);
    }
  };

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
    toast.success(isAIMode ? 'AI Mode Disabled' : 'AI Mode Enabled', {
      description: isAIMode 
        ? 'Browsing normally' 
        : 'AI will analyze and control browser',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-window-header">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex <= 0}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleForward}
            disabled={currentIndex >= history.length - 1}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigate(url)}
              className="pl-10 bg-window-bg border-primary/20 focus-visible:ring-primary/50"
              placeholder="Enter URL or search..."
            />
          </div>
          <Button 
            size="icon"
            onClick={() => handleNavigate(url)}
            className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(0,217,255,0.3)]"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Mode Toggle */}
        <Button
          size="sm"
          onClick={toggleAIMode}
          className={`gap-2 transition-all ${
            isAIMode 
              ? 'bg-secondary hover:bg-secondary/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
              : 'bg-muted hover:bg-muted/90 text-muted-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Mode
        </Button>
      </div>

      {/* AI Status Bar */}
      {isAIMode && (
        <div className="px-4 py-2 bg-secondary/10 border-b border-secondary/20 flex items-center gap-3">
          <Badge variant="outline" className="border-secondary text-secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Active
          </Badge>
          <span className="text-xs text-muted-foreground">
            AI is ready to build websites, extract data, or navigate automatically
          </span>
        </div>
      )}

      {/* Browser Content Area */}
      <ScrollArea className="flex-1 scrollbar-custom">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Demo Content */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Browser</span>
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Intelligent Web Navigation
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Let AI control your browsing experience. Build websites, extract information, 
                or navigate automatically with natural language commands.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { title: 'Auto Navigation', desc: 'AI navigates to pages based on your commands' },
                { title: 'Data Extraction', desc: 'Extract structured data from any webpage' },
                { title: 'Site Builder', desc: 'Generate websites with AI templates' },
                { title: 'Content Analysis', desc: 'Understand page structure and content' },
              ].map((feature, i) => (
                <div key={i} className="p-4 rounded-lg border border-primary/20 bg-window-bg hover:border-primary/40 transition-colors">
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Example Commands */}
            <div className="p-6 rounded-lg border border-secondary/30 bg-secondary/5 mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Try AI Commands:</h3>
              <div className="space-y-2">
                {[
                  '"Build me a landing page for a SaaS product"',
                  '"Navigate to the latest tech news"',
                  '"Extract all product prices from this page"',
                  '"Show me examples of modern web designs"',
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-3 h-3 text-secondary" />
                    <code className="text-muted-foreground">{cmd}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
