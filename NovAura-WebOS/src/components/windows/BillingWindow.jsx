/**
 * Billing Window - Payments & Subscription Management
 * MVP: Stripe integration, plan selection, usage tracking
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Building2, Users, Crown, Loader2, AlertCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Try before you buy',
    features: ['4K context', '7 builder prompts/month', '3 projects', 'Community support'],
    limits: { context: '4K', calls: 7, projects: 3 },
    color: 'gray',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 17.99,
    priceId: 'price_starter',
    description: 'For hobbyists',
    features: ['8K context', '30 builder prompts/month', '10 projects', 'Email support', '1 custom domain'],
    limits: { context: '8K', calls: 30, projects: 10 },
    color: 'cyan',
    popular: false,
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 29.99,
    priceId: 'price_builder',
    description: 'For power users',
    features: ['16K context', '100 builder prompts/month', 'Unlimited projects', 'Priority support', '3 custom domains'],
    limits: { context: '16K', calls: 100, projects: '∞' },
    color: 'purple',
    popular: true,
  },
  {
    id: 'pro_byok',
    name: 'Pro BYOK',
    price: 29.99,
    priceId: 'price_pro_byok',
    description: '100 hosted + unlimited BYOK',
    features: ['16K context', '100 hosted prompts/mo', 'BYOK for unlimited', 'Unlimited projects', '5 custom domains', 'Priority support'],
    limits: { context: '16K', calls: 100, projects: '∞' },
    color: 'amber',
    popular: false,
  },
];

export default function BillingWindow() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [usage, setUsage] = useState({
    builderCalls: { used: 5, limit: 7 },
    contextTokens: { used: 3200, limit: 4096 },
    projects: { used: 2, limit: 3 },
  });

  const handleSubscribe = async (planId) => {
    if (planId === 'free') return;
    
    setIsLoading(true);
    
    try {
      // Call our common checkout API
      const user = JSON.parse(localStorage.getItem('user_data') || '{}');
      const response = await fetch(`${BACKEND_URL}/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('novaura-auth-token')}`
        },
        body: JSON.stringify({
          userId: user.uid || user.id,
          items: [{
            asset: {
              id: planId,
              title: `NovAura ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              price: PLANS.find(p => p.id === planId)?.price * 100, // into cents
              type: 'subscription',
              shortDescription: `Monthly subscription to ${planId} tier features.`
            }
          }]
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      alert(`Error starting subscription: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClass = (color) => {
    const colors = {
      gray: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
      purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-medium">Billing & Plans</h1>
        </div>
        <p className="text-white/50">Manage your subscription and usage</p>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Current Usage */}
        {currentPlan === 'free' && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-medium text-amber-400">Free Tier Usage</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">Builder Calls</span>
                  <span>{usage.builderCalls.used}/{usage.builderCalls.limit}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(usage.builderCalls.used / usage.builderCalls.limit) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">Context</span>
                  <span>{Math.round(usage.contextTokens.used / usage.contextTokens.limit * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(usage.contextTokens.used / usage.contextTokens.limit) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">Projects</span>
                  <span>{usage.projects.used}/{usage.projects.limit}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${(usage.projects.used / usage.projects.limit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-white/50 mt-3">
              Resets in 12 hours • 
              <button className="text-cyan-400 hover:underline ml-1">Upgrade for more</button>
            </p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                billingCycle === 'monthly' ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly' ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id;
            const price = billingCycle === 'yearly' ? plan.price * 0.8 : plan.price;
            
            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl border ${isCurrent ? 'border-cyan-500' : 'border-white/10'} bg-gradient-to-b ${getColorClass(plan.color)} p-5 flex flex-col`}
                whileHover={{ scale: 1.02 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-cyan-500 text-black text-xs font-medium rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Current
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <p className="text-sm text-white/50 mt-1">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-white/50">/mo</span>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      ${(plan.price * 12 * 0.8).toFixed(0)}/year
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="flex gap-2 mb-4 text-xs">
                  <span className="px-2 py-1 bg-white/10 rounded">{plan.limits.context} context</span>
                  <span className="px-2 py-1 bg-white/10 rounded">{plan.limits.calls} calls</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
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
                      ? 'bg-purple-500 hover:bg-purple-400 text-white'
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

        {/* BYOK Explanation */}
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <h3 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How does BYOK work?
          </h3>
          <p className="text-sm text-white/70 mb-2">
            Each builder prompt runs <strong>9 AI passes</strong> using smart model routing:
          </p>
          <ul className="text-sm text-white/70 mb-2 list-disc list-inside">
            <li>2× Claude passes (reasoning/security) - ~$0.80</li>
            <li>2× Kimi passes (coding) - ~$0.06</li>
            <li>5× Gemini Flash passes (rest) - ~$0.03</li>
          </ul>
          <p className="text-sm text-white/70 mb-2">
            <strong>Total: ~$0.90 per prompt</strong> (not $3.60 for all-Claude!)
          </p>
          <p className="text-sm text-white/70 mb-2">
            <strong>Pro BYOK ($29.99):</strong> Get 100 hosted prompts included. 
            After that, add your own API keys for <strong>unlimited usage</strong>.
          </p>
          <p className="text-sm text-white/70">
            You pay providers directly (~$0.90/prompt), we provide the OS + 9-pass pipeline.
            <span className="text-amber-400"> Best value for serious builders!</span>
          </p>
        </div>

        {/* Payment Method */}
        {currentPlan !== 'free' && (
          <div className="mt-8 p-4 bg-white/5 rounded-xl">
            <h3 className="font-medium mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded" />
              <div>
                <p className="font-mono">•••• •••• •••• 4242</p>
                <p className="text-sm text-white/50">Expires 12/25</p>
              </div>
              <button className="ml-auto text-sm text-cyan-400 hover:underline">
                Update
              </button>
            </div>
          </div>
        )}

        {/* Enterprise CTA */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Need more? Try Enterprise
              </h3>
              <p className="text-white/50 mt-1">
                Custom deployments, unlimited seats, dedicated support
              </p>
            </div>
            <button className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
