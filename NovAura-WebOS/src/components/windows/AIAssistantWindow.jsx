import React, { useState } from 'react';
import { Brain, Zap, Code, Globe, Terminal, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

const capabilities = [
  {
    icon: Code,
    title: 'Code Generation',
    description: 'Generate, refactor, and debug code',
    color: 'text-primary',
  },
  {
    icon: Globe,
    title: 'Web Automation',
    description: 'Navigate and control browsers',
    color: 'text-secondary',
  },
  {
    icon: Terminal,
    title: 'System Control',
    description: 'Execute commands and scripts',
    color: 'text-accent',
  },
  {
    icon: Sparkles,
    title: 'Creative AI',
    description: 'Generate content and ideas',
    color: 'text-success',
  },
];

const quickActions = [
  'Build a React app',
  'Create API endpoint',
  'Write documentation',
  'Debug my code',
  'Optimize performance',
  'Generate tests',
];

export default function AIAssistantWindow() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickAction = (action) => {
    setIsProcessing(true);
    toast.info('AI is processing', {
      description: action,
    });
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Task completed', {
        description: 'AI has finished processing your request',
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary/20 bg-gradient-to-r from-window-header to-window-bg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-success text-success">
                <Zap className="w-3 h-3 mr-1" />
                Active
              </Badge>
              <span className="text-xs text-muted-foreground">Gemini Powered</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 scrollbar-custom">
        <div className="p-6 space-y-6">
          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Capabilities</h4>
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <Card key={index} className="p-4 bg-window-bg border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
                    <Icon className={`w-6 h-6 ${cap.color} mb-2 group-hover:scale-110 transition-transform`} />
                    <h5 className="text-sm font-semibold text-foreground mb-1">{cap.title}</h5>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full justify-start hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {action}
                </Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-foreground mb-1">
                  Recursive Logic Processing
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI uses 4-level branching logic to analyze requirements deeply before execution, 
                  ensuring accuracy and completeness in all tasks.
                </p>
              </div>
            </div>
          </Card>

          {/* Note */}
          <div className="text-xs text-muted-foreground p-4 rounded-lg bg-muted/30 border border-border">
            <p className="mb-2">💡 <strong>Note:</strong> This is a functional prototype.</p>
            <p>Full implementation will include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Gemini AI integration for cloud processing</li>
              <li>Local LLM support for offline operation</li>
              <li>Advanced reasoning with 4th level logic chains</li>
              <li>Real-time code execution and browser control</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
