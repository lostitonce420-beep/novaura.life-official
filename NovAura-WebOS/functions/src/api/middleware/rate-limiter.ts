import { Request, Response, NextFunction } from 'express';

// NovAura Authentic Tiers - NO UNLIMITED (to prevent $20K bills)
// All tiers have hard caps on builder calls and chat messages
const TIER_LIMITS: Record<string, { 
  builderCalls: number;  // per month (hard cap)
  chatMessages: number;  // per day (hard cap)
  contextWindow: number; 
  windowMs: number;
  projects: number;
  customDomains: number;
}> = {
  // Free tier - very limited to prevent abuse
  free:          { builderCalls: 7,    chatMessages: 20,   contextWindow: 4096,   windowMs: 86400000, projects: 3,  customDomains: 0 },
  
  // Spark - starter tier
  spark:         { builderCalls: 30,   chatMessages: 50,   contextWindow: 8192,   windowMs: 86400000, projects: 10, customDomains: 1 },
  
  // Emergent - growing users
  emergent:      { builderCalls: 100,  chatMessages: 150,  contextWindow: 16384,  windowMs: 86400000, projects: 50, customDomains: 3 },
  
  // Catalyst - best value (still capped!)
  catalyst:      { builderCalls: 250,  chatMessages: 400,  contextWindow: 32768,  windowMs: 86400000, projects: 100, customDomains: 10 },
  
  // Nova - high usage but NOT unlimited (max ~$500/month in API costs)
  nova:          { builderCalls: 500,  chatMessages: 1000, contextWindow: 128000, windowMs: 86400000, projects: 500, customDomains: 100 },
  
  // Catalytic Crew - enterprise (max ~$2000/month in API costs)
  'catalytic-crew': { builderCalls: 2000, chatMessages: 5000, contextWindow: 200000, windowMs: 86400000, projects: 9999, customDomains: 9999 },
};

interface RateLimitEntry {
  builderCalls: number;
  chatMessages: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  tier: string;
}

const rateStore = new Map<string, RateLimitEntry>();

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getRateLimitStatus(userId: string, tier: string, type: 'builder' | 'chat'): RateLimitResult {
  const limits = getTierLimits(tier);
  const now = Date.now();

  let entry = rateStore.get(userId);
  if (!entry || entry.resetAt < now) {
    entry = { builderCalls: 0, chatMessages: 0, resetAt: now + limits.windowMs };
    rateStore.set(userId, entry);
  }

  const used = type === 'builder' ? entry.builderCalls : entry.chatMessages;
  const limit = type === 'builder' ? limits.builderCalls : limits.chatMessages;
  const remaining = Math.max(0, limit - used);

  return { allowed: used < limit, remaining, resetAt: entry.resetAt, limit, tier };
}

export function checkRateLimit(userId: string, tier: string, type: 'builder' | 'chat'): RateLimitResult {
  const limits = getTierLimits(tier);
  const now = Date.now();

  let entry = rateStore.get(userId);
  if (!entry || entry.resetAt < now) {
    entry = { builderCalls: 0, chatMessages: 0, resetAt: now + limits.windowMs };
  }

  const used = type === 'builder' ? entry.builderCalls : entry.chatMessages;
  const limit = type === 'builder' ? limits.builderCalls : limits.chatMessages;

  if (used >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit, tier };
  }

  if (type === 'builder') entry.builderCalls++;
  else entry.chatMessages++;
  rateStore.set(userId, entry);

  return { allowed: true, remaining: limit - (used + 1), resetAt: entry.resetAt, limit, tier };
}

export function getUserUsage(userId: string) {
  return rateStore.get(userId) || null;
}

export function rateLimitMiddleware(type: 'builder' | 'chat') {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId || 'anonymous';
    const tier = req.userTier || 'free';

    const result = checkRateLimit(userId, tier, type);

    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));
    res.setHeader('X-RateLimit-Tier', result.tier);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: type === 'builder'
          ? `You've used all ${result.limit} builder calls this period. Upgrade for more!`
          : `Daily ${result.limit} chat limit reached.`,
        upgrade_url: '/billing',
        reset_at: new Date(result.resetAt).toISOString(),
      });
      return;
    }

    next();
  };
}

export function limitContextWindow(
  messages: Array<{ role: string; content: string; tokens?: number }>,
  tier: string
): Array<{ role: string; content: string }> {
  const limits = getTierLimits(tier);
  const maxTokens = limits.contextWindow;

  let totalTokens = 0;
  const result: Array<{ role: string; content: string }> = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = msg.tokens || estimateTokens(msg.content);
    if (totalTokens + tokens > maxTokens) {
      if (tier === 'free' && result.length > 0) {
        result.unshift({ role: 'system', content: '[Earlier conversation summarized due to context limit. Upgrade to unlock full context.]' });
      }
      break;
    }
    result.unshift({ role: msg.role, content: msg.content });
    totalTokens += tokens;
  }

  return result;
}

function estimateTokens(text: string): number {
  const isCode = /[{;}=()]/.test(text);
  return Math.ceil(text.length / (isCode ? 3.5 : 4));
}

// Auto-cleanup every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateStore.entries()) {
    if (entry.resetAt < now) rateStore.delete(userId);
  }
}, 3600000);
