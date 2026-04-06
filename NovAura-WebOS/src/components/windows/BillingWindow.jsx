/**
 * Billing Window - Payments & Subscription Management
 * WIRED UP TO STRIPE ✓
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Sparkles, Flame, Star, Users, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createSubscriptionCheckout, getSubscriptionStatus } from '../../services/stripeService';

// NovAura Membership Tiers - Authentic progression path
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'The Beginning',
    price: 0,
    description: 'Start your journey',
    features: ['7 builder calls/month', '3 projects', 'Community support', 'Core WebOS access'],
    limits: { calls: 7, projects: 3 },
    color: 'gray',
    icon: Zap,
  },
  {
    id: 'spark',
    name: 'Spark',
    subtitle: 'Wonder Into',
    price: 9.99,
    description: 'Ignite your curiosity',
    features: ['30 builder calls/month', '10 projects', '1 custom domain', 'Priority support'],
    limits: { calls: 30, projects: 10 },
    color: 'cyan',
    icon: Sparkles,
  },
  {
    id: 'emergent',
    name: 'Emergent',
    subtitle: 'Discovering',
    price: 17.99,
    description: 'Find your flow',
    features: ['100 builder calls/month', 'Unlimited projects', '3 custom domains', 'BYOK ready'],
    limits: { calls: 100, projects: '∞' },
    color: 'purple',
    icon: Star,
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    subtitle: 'Biggest Bang for Your Buck',
    price: 29.99,
    description: 'Accelerate everything',
    features: ['250 builder calls/month', 'Unlimited projects', '10 custom domains', 'Full BYOK support', 'Priority queue'],
    limits: { calls: 250, projects: '∞' },
    color: 'amber',
    icon: Flame,
    popular: true,
  },
  {
    id: 'nova',
    name: 'Nova',
    subtitle: 'Ultimate',
    price: 75.00,
    description: 'Unlimited power',
    features: ['Unlimited with BYOK', 'Unlimited projects', 'Unlimited domains', 'Advanced analytics', 'Secrets manager'],
    limits: { calls: '∞', projects: '∞' },
    color: 'pink',
    icon: Star,
  },
  {
    id: 'catalytic-crew',
    name: 'Catalytic Crew',
    subtitle: 'Enterprise',
    price: 349.99,
    description: 'For teams and organizations',
    features: ['Everything in Nova', 'Unlimited team seats', 'SSO & SAML', 'Dedicated support', 'Custom contracts', 'On-premise option'],
    limits: { calls: '∞', projects: '∞' },
    color: 'indigo',
    icon: Users,
  },
];

export default function BillingWindow() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Load current user and subscription status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const status = await getSubscriptionStatus(currentUser.uid);
          setCurrentPlan(status.tier || 'free');
        } catch (err) {
          console.error('Failed to load subscription status:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubscribe = async (planId) => {
    if (planId === 'free') return;
    
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { url } = await createSubscriptionCheckout(user.uid, planId);
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white overflow-auto">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-medium">Membership</h1>
        </div>
        <p className="text-white/50">Choose your path</p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl border ${isCurrent ? 'border-cyan-500' : 'border-white/10'} bg-gradient-to-b from-white/5 to-transparent p-5 flex flex-col`}
                whileHover={{ scale: 1.02 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    Best Value
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-cyan-500 text-black text-xs font-medium rounded-full">
                    Current
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-5 h-5" style={{ color: plan.color === 'amber' ? '#f59e0b' : plan.color === 'purple' ? '#a855f7' : plan.color === 'pink' ? '#ec4899' : plan.color === 'indigo' ? '#6366f1' : '#6b7280' }} />
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-white/40 italic">{plan.subtitle}</p>
                  <p className="text-sm text-white/60 mt-1">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-white/50">/mo</span>}
                </div>

                <ul className="space-y-2 mb-6 flex-1 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                    isCurrent
                      ? 'bg-white/10 text-white/50 cursor-default'
                      : plan.popular
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
