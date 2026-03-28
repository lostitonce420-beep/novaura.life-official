import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Users, Building2, Star, ArrowRight, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const PRICING_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 14.99,
    originalPrice: 29.99,
    description: 'Perfect for hobbyists and learners',
    features: [
      '200 AI messages/month',
      '5 projects',
      '1 custom domain',
      'Basic templates',
      'Community support',
      '1GB storage',
      'Free Unified Platform access',
    ],
    cta: 'Start Free Trial',
    popular: false,
    color: '#10b981',
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: Sparkles,
    price: 29.99,
    originalPrice: 59.99,
    description: 'For serious creators and developers',
    features: [
      '500 AI messages/month',
      '20 projects',
      '3 custom domains',
      'Premium templates',
      'Priority email support',
      '10GB storage',
      'Team collaboration (3 users)',
      'Free Unified Platform access',
    ],
    cta: 'Start Free Trial',
    popular: true,
    color: '#a855f7',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Star,
    price: 75.00,
    originalPrice: 99.99,
    description: 'Unlimited power for professionals',
    features: [
      'Unlimited AI (BYOK or pooled)',
      'Unlimited projects',
      '10 custom domains',
      'All templates + marketplace',
      'Priority support + Discord',
      '100GB storage',
      'Team collaboration (10 users)',
      'API access',
      'Advanced AI models',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    popular: false,
    color: '#f59e0b',
    badge: '⭐ BEST VALUE',
  },
  {
    id: 'studio',
    name: 'Studio',
    icon: Users,
    price: 149.99,
    originalPrice: 199.99,
    description: 'For teams and agencies',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Shared workspaces',
      'SSO & SAML',
      'Admin dashboard',
      'Usage analytics',
      'Dedicated support',
      '500GB storage',
      'Custom contracts',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: '#ec4899',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: 349.99,
    originalPrice: 499.99,
    description: 'Custom solutions for organizations',
    features: [
      'Everything in Studio',
      'Unlimited everything',
      'SLA guarantees',
      'Dedicated infrastructure',
      'On-premise option',
      'Custom AI training',
      '24/7 phone support',
      'Account manager',
      'Unlimited storage',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: '#6366f1',
  },
];

export default function PricingPage({ onSubscribe }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [hoveredTier, setHoveredTier] = useState(null);

  const handleSubscribe = (tier) => {
    toast.success(`Selected ${tier.name} plan!`, {
      description: 'Redirecting to checkout...',
    });
    
    if (onSubscribe) {
      onSubscribe(tier);
    }
  };

  const getPrice = (tier) => {
    if (billingCycle === 'yearly') {
      return (tier.price * 0.8).toFixed(2); // 20% off for yearly
    }
    return tier.price.toFixed(2);
  };

  return (
    <div className="min-h-full bg-background text-foreground p-8 overflow-auto">
      {/* Header */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Launch Special: 50% Off First Month
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PRICING_TIERS.map((tier, index) => {
          const Icon = tier.icon;
          const isHovered = hoveredTier === tier.id;
          
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredTier(tier.id)}
              onMouseLeave={() => setHoveredTier(null)}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
                tier.popular 
                  ? 'border-primary/50 bg-primary/5 scale-105 shadow-xl shadow-primary/10' 
                  : 'border-border bg-card hover:border-primary/30'
              } ${isHovered ? 'shadow-2xl' : ''}`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Best Value Badge */}
              {tier.badge && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">
                    {tier.badge}
                  </div>
                </div>
              )}

              {/* Icon & Name */}
              <div className="mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${tier.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: tier.color }} />
                </div>
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${getPrice(tier)}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-400 mt-1">
                    Billed annually (${(tier.price * 0.8 * 12).toFixed(0)}/year)
                  </p>
                )}
                {tier.originalPrice > tier.price && (
                  <p className="text-sm text-muted-foreground line-through mt-1">
                    Was ${tier.originalPrice}/mo
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSubscribe(tier)}
                className={`w-full mb-6 ${
                  tier.popular 
                    ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90' 
                    : ''
                }`}
                variant={tier.popular ? 'default' : 'outline'}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* Features */}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  What's included:
                </p>
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                        style={{ color: tier.color }}
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Signals */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto mt-16 text-center"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="text-3xl font-bold text-primary">50K+</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">1M+</div>
            <div className="text-sm text-muted-foreground">Projects Created</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">4.9/5</div>
            <div className="text-sm text-muted-foreground">User Rating</div>
          </div>
        </div>

        {/* FAQ Link */}
        <p className="text-muted-foreground">
          Questions?{' '}
          <button 
            onClick={() => toast.info('FAQ coming soon!')}
            className="text-primary hover:underline"
          >
            Check our FAQ
          </button>{' '}
          or{' '}
          <button 
            onClick={() => toast.info('Contact: support@novaura.life')}
            className="text-primary hover:underline"
          >
            contact us
          </button>
        </p>

        {/* Guarantee */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-left">
            <div className="font-medium">30-Day Money-Back Guarantee</div>
            <div className="text-sm text-muted-foreground">
              Not satisfied? Get a full refund, no questions asked.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
