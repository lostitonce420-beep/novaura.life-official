import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X,
  Zap,
  Users,
  Palette,
  Code,
  Rocket,
  Star,
  Gift
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { kernelStorage } from '../kernel/kernelStorage.js';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Novaura',
    subtitle: 'Your AI-powered desktop operating system',
    description: 'Build apps, create games, and collaborate with AI - all in your browser.',
    icon: Sparkles,
    color: '#00d9ff',
    action: null,
  },
  {
    id: 'desktop',
    title: 'Your Desktop',
    subtitle: 'Everything at your fingertips',
    description: 'This is your workspace. Open apps, manage windows, and access your projects from here.',
    icon: Palette,
    color: '#a855f7',
    highlight: '.desktop-area',
    action: 'Try clicking an app icon in the sidebar →',
  },
  {
    id: 'apps',
    title: '50+ Built-in Apps',
    subtitle: 'From code to creativity',
    description: 'Access IDE, Browser, AI Chat, Games, Art Studio, and more. All apps work together seamlessly.',
    icon: Code,
    color: '#10b981',
    highlight: '.app-icon',
    action: 'Click the 💻 Code IDE icon',
  },
  {
    id: 'ai',
    title: 'Meet Nova AI',
    subtitle: 'Your intelligent assistant',
    description: 'Ask Nova to code, create images, build websites, or help with any task. She learns from your interactions.',
    icon: Zap,
    color: '#f59e0b',
    highlight: '.chat-bar',
    action: 'Type "Open the IDE" in the chat bar',
  },
  {
    id: 'collab',
    title: 'Real-time Collaboration',
    subtitle: 'Build together',
    description: 'Start a session in the IDE and share the code with teammates. See live cursors, chat in-session, and edit files together in real time.',
    icon: Users,
    color: '#ec4899',
    action: 'Open the IDE → Collaboration tab to start',
  },
  {
    id: 'deploy',
    title: 'Deploy Your Creations',
    subtitle: 'Export & publish',
    description: 'Export projects as ZIP, or deploy to your own subdomain on novaura.life. Desktop & mobile builds coming soon via Tauri.',
    icon: Rocket,
    color: '#8b5cf6',
    action: 'First deployment free with subscription!',
  },
  {
    id: 'founder',
    title: 'Founding Member Perks',
    subtitle: 'Early adopter bonuses',
    description: 'As a founding member, your subscription price is locked for life. You also get a Founder badge and early access to every new feature.',
    icon: Gift,
    color: '#fbbf24',
    action: 'Claim your Founder status',
  },
];

// Quick start checklist items
const QUICK_START_CHECKLIST = [
  { id: 'open_app', label: 'Open your first app', completed: false, reward: '⭐' },
  { id: 'chat_ai', label: 'Chat with Nova AI', completed: false, reward: '⚡' },
  { id: 'create_project', label: 'Create a project', completed: false, reward: '📁' },
  { id: 'try_template', label: 'Use a template', completed: false, reward: '🎨' },
  { id: 'deploy', label: 'Deploy something', completed: false, reward: '🚀' },
  { id: 'invite_friend', label: 'Invite a friend', completed: false, reward: '👥' },
];

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [checklist, setChecklist] = useState(QUICK_START_CHECKLIST);
  const [showChecklist, setShowChecklist] = useState(false);
  const [userType, setUserType] = useState(null);
  const [progress, setProgress] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = kernelStorage.getItem('novaura-onboarding-complete');
    if (hasCompleted) {
      setIsVisible(false);
    }

    // Load progress
    const savedProgress = kernelStorage.getItem('novaura-checklist');
    if (savedProgress) {
      setChecklist(JSON.parse(savedProgress));
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / ONBOARDING_STEPS.length) * 100);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(((currentStep - 1) / ONBOARDING_STEPS.length) * 100);
    }
  };

  const finishOnboarding = () => {
    kernelStorage.setItem('novaura-onboarding-complete', 'true');
    kernelStorage.setItem('novaura-checklist', JSON.stringify(checklist));
    
    toast.success('Welcome to Novaura! 🎉', {
      description: 'You\'re all set to start building amazing things.',
      duration: 5000,
    });

    setIsVisible(false);
    setShowChecklist(true);
    
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    kernelStorage.setItem('novaura-onboarding-complete', 'true');
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  const updateChecklist = (id) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: true } : item
    );
    setChecklist(updated);
    kernelStorage.setItem('novaura-checklist', JSON.stringify(updated));
    
    const item = checklist.find(i => i.id === id);
    if (item && !item.completed) {
      toast.success(`Achievement unlocked! ${item.reward}`, {
        description: item.label,
      });
    }
  };

  const getUserTypeContent = () => {
    switch(userType) {
      case 'learner':
        return {
          title: 'Learning Path',
          description: 'Start with beginner tutorials and guided projects.',
          recommended: ['tutorials', 'simple-projects', 'guides']
        };
      case 'builder':
        return {
          title: 'Builder Path',
          description: 'Full access to all tools. Start with templates.',
          recommended: ['templates', 'ide', 'deploy']
        };
      case 'pro':
        return {
          title: 'Pro Path',
          description: 'Advanced features, custom domains, API access.',
          recommended: ['api', 'custom-domains', 'advanced-features']
        };
      default:
        return null;
    }
  };

  // User type selection step
  if (currentStep === 0 && !userType) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome to Novaura
                </h1>
                <p className="text-muted-foreground">
                  What brings you here today?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => setUserType('learner')}
                  className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <h3 className="font-semibold mb-1">Learn to Code</h3>
                  <p className="text-sm text-muted-foreground">I'm new to programming</p>
                </button>

                <button
                  onClick={() => setUserType('builder')}
                  className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    🛠️
                  </div>
                  <h3 className="font-semibold mb-1">Build Projects</h3>
                  <p className="text-sm text-muted-foreground">I want to create apps/games</p>
                </button>

                <button
                  onClick={() => setUserType('pro')}
                  className="p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    💼
                  </div>
                  <h3 className="font-semibold mb-1">Professional</h3>
                  <p className="text-sm text-muted-foreground">I'm an experienced dev</p>
                </button>
              </div>

              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Main onboarding modal
  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <motion.div
              key={currentStep}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl relative"
            >
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Step indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {ONBOARDING_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentStep 
                        ? 'bg-primary' 
                        : idx < currentStep 
                          ? 'bg-primary/50' 
                          : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Icon */}
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`,
                  boxShadow: `0 0 30px ${step.color}30`
                }}
              >
                <Icon className="w-8 h-8" style={{ color: step.color }} />
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                <p className="text-primary text-sm font-medium mb-3">{step.subtitle}</p>
                <p className="text-muted-foreground">{step.description}</p>
                
                {step.action && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary">{step.action}</p>
                  </div>
                )}

                {userType && currentStep === 1 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    {(() => {
                      const content = getUserTypeContent();
                      return content ? (
                        <>
                          <h4 className="font-semibold mb-1">{content.title}</h4>
                          <p className="text-sm text-muted-foreground">{content.description}</p>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={currentStep === 0 ? 'invisible' : ''}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <div className="flex items-center gap-3">
                  {currentStep === ONBOARDING_STEPS.length - 1 ? (
                    <Button 
                      onClick={finishOnboarding}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Checklist (appears after onboarding) */}
      <AnimatePresence>
        {showChecklist && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed right-4 top-20 z-[900] w-72 bg-card/95 backdrop-blur border border-border rounded-xl p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Getting Started
              </h3>
              <button 
                onClick={() => setShowChecklist(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    item.completed ? 'bg-green-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-muted-foreground'
                  }`}>
                    {item.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm flex-1 ${item.completed ? 'line-through opacity-50' : ''}`}>
                    {item.label}
                  </span>
                  <span className="text-xs">{item.reward}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{checklist.filter(i => i.completed).length}/{checklist.length}</span>
              </div>
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${(checklist.filter(i => i.completed).length / checklist.length) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Guided tour component for highlighting elements
export function GuidedTour({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    }
  }, [currentStep, steps]);

  if (!targetRect || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]">
        {/* Darken everything except target */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect 
                x={targetRect.left - 8} 
                y={targetRect.top - 8} 
                width={targetRect.width + 16} 
                height={targetRect.height + 16} 
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#tour-mask)" />
        </svg>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[9999] bg-card border border-border rounded-xl p-4 shadow-xl max-w-xs"
        style={{
          left: Math.min(targetRect.left, window.innerWidth - 320),
          top: targetRect.bottom + 16,
        }}
      >
        <h4 className="font-semibold mb-1">{step.title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{step.content}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
          <Button size="sm" onClick={() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              onComplete();
            }
          }}>
            {currentStep < steps.length - 1 ? 'Next' : 'Done'}
          </Button>
        </div>
      </motion.div>

      {/* Highlight border around target */}
      <div 
        className="fixed z-[9998] border-2 border-primary rounded-lg pointer-events-none"
        style={{
          left: targetRect.left - 4,
          top: targetRect.top - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 4px rgba(0, 217, 255, 0.2), 0 0 20px rgba(0, 217, 255, 0.4)',
        }}
      />
    </>
  );
}

// Tooltip helper component
export function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute z-50 px-3 py-1.5 bg-card border border-border rounded-lg text-sm shadow-xl whitespace-nowrap ${
              position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
            }`}
          >
            {content}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-card border rotate-45 ${
                position === 'top' 
                  ? '-bottom-1 border-r border-b' 
                  : '-top-1 border-l border-t'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Help button with keyboard shortcut info
export function HelpButton() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts = [
    { key: '⌘K', action: 'Command Palette' },
    { key: '⌘N', action: 'New Project' },
    { key: '⌘O', action: 'Open File' },
    { key: '⌘S', action: 'Save' },
    { key: '⌘Shift+P', action: 'Deploy' },
    { key: '⌘/', action: 'Toggle AI Chat' },
    { key: '⌘B', action: 'Toggle Sidebar' },
    { key: 'Esc', action: 'Close Window' },
  ];

  return (
    <>
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30 flex items-center justify-center transition-colors z-[800]"
      >
        <span className="text-lg">❓</span>
      </button>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
              
              <div className="space-y-2">
                {shortcuts.map(({ key, action }) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{action}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">{key}</kbd>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={() => setShowShortcuts(false)}
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
