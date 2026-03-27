import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronRight, Sparkles } from 'lucide-react';

const TIPS = [
  {
    id: 'cmd-k',
    title: 'Pro Tip: Command Palette',
    content: 'Press Cmd/Ctrl + K to open the Command Palette. Search apps, files, and actions instantly!',
    category: 'productivity',
    icon: '⌨️',
  },
  {
    id: 'nova-shortcuts',
    title: 'Talk to Nova Faster',
    content: 'Type "/" in the chat bar to see quick action shortcuts.',
    category: 'ai',
    icon: '⚡',
  },
  {
    id: 'window-snap',
    title: 'Window Management',
    content: 'Drag windows to edges to snap them into place. Double-click title bar to maximize.',
    category: 'ui',
    icon: '🪟',
  },
  {
    id: 'templates',
    title: 'Start with Templates',
    content: 'Don\'t build from scratch! Check out the Template Gallery for starter projects.',
    category: 'productivity',
    icon: '🎨',
  },
  {
    id: 'deploy-free',
    title: 'Free Deployments',
    content: 'Every project gets a free novaura.life subdomain. One-click deploy anytime!',
    category: 'deploy',
    icon: '🚀',
  },
  {
    id: 'collab',
    title: 'Build Together',
    content: 'Invite friends to your project for real-time collaboration. See their cursors!',
    category: 'social',
    icon: '👥',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Power User Mode',
    content: 'Click the ❓ button in the bottom-right for a full list of keyboard shortcuts.',
    category: 'productivity',
    icon: '💪',
  },
  {
    id: 'ai-memory',
    title: 'Nova Learns You',
    content: 'Enable AI Memory in Settings to help Nova understand your coding style over time.',
    category: 'ai',
    icon: '🧠',
  },
  {
    id: 'personalization',
    title: 'Make It Yours',
    content: 'Go to Settings > Personalization to change themes and customize your taskbar.',
    category: 'customization',
    icon: '🎨',
  },
  {
    id: 'community',
    title: 'Join the Community',
    content: 'Share your projects and get feedback on Discord: discord.gg/novaura',
    category: 'social',
    icon: '💬',
  },
  {
    id: 'founder-perks',
    title: 'Founder Benefits',
    content: 'Early adopters get 50% off forever! Check Settings > Billing to claim.',
    category: 'billing',
    icon: '🎁',
  },
  {
    id: 'offline-mode',
    title: 'Desktop App Coming',
    content: 'Download the Novaura Desktop app for offline AI and local file access!',
    category: 'feature',
    icon: '💻',
  },
  {
    id: 'backup',
    title: 'Auto-Save Enabled',
    content: 'Your work is automatically saved. No need to worry about losing progress!',
    category: 'productivity',
    icon: '💾',
  },
  {
    id: 'multiwindow',
    title: 'Multitask Like a Pro',
    content: 'Open multiple windows and work on different projects simultaneously.',
    category: 'ui',
    icon: '📱',
  },
  {
    id: 'voice-chat',
    title: 'Talk to Nova',
    content: 'Try Voice Chat for hands-free coding. Great for brainstorming sessions!',
    category: 'ai',
    icon: '🎤',
  },
];

export default function TipsWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if tips are disabled
    const tipsDisabled = localStorage.getItem('novaura-tips-disabled');
    if (tipsDisabled === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show first tip after 30 seconds
    const showTimer = setTimeout(() => {
      if (!hasInteracted) {
        setIsVisible(true);
      }
    }, 30000);

    // Rotate tips every 5 minutes if not dismissed
    const rotateTimer = setInterval(() => {
      if (!isDismissed) {
        setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
      }
    }, 300000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(rotateTimer);
    };
  }, [hasInteracted, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('novaura-tips-disabled', 'true');
  };

  const handleNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    setHasInteracted(true);
  };

  const handleShow = () => {
    setIsVisible(true);
    setHasInteracted(true);
  };

  const currentTip = TIPS[currentTipIndex];

  if (isDismissed) return null;

  return (
    <>
      {/* Floating tips button */}
      {!isVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleShow}
          className="fixed bottom-20 right-4 z-[850] w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          title="Show Tips"
        >
          <Lightbulb className="w-5 h-5 text-white" />
        </motion.button>
      )}

      {/* Tip card */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed bottom-20 right-4 z-[850] w-80 bg-card/95 backdrop-blur border border-border rounded-xl p-4 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-lg">
                  {currentTip.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-1">
                    {currentTip.title}
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                  </h4>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {currentTip.category}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {currentTip.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Tip {currentTipIndex + 1} of {TIPS.length}
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't show again
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-xl overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 30, ease: 'linear' }}
                key={currentTipIndex}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
