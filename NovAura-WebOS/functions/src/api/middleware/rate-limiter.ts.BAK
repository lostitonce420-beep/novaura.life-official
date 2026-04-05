import { Request, Response, NextFunction } from 'express';

const TIER_LIMITS: Record<string, { builderCalls: number; chatMessages: number; contextWindow: number; windowMs: number }> = {
  free:       { builderCalls: 7,        chatMessages: 50,       contextWindow: 4096,   windowMs: 86400000 },
  starter:    { builderCalls: 50,       chatMessages: Infinity, contextWindow: 8192,   windowMs: 86400000 },
  builder:    { builderCalls: 200,      chatMessages: Infinity, contextWindow: 16384,  windowMs: 86400000 },
  pro:        { builderCalls: Infinity, chatMessages: Infinity, contextWindow: 128000, windowMs: 86400000 },
  studio:     { builderCalls: Infinity, chatMessages: Infinity, contextWindow: 200000, windowMs: 86400000 },
  enterprise: { builderCalls: Infinity, chatMessages: Infinity, contextWindow: 200000, windowMs: 86400000 },
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
  const remaining = Math.max(0, (limit === Infinity ? 999999 : limit) - used);

  return { allowed: limit === Infinity || used < limit, remaining, resetAt: entry.resetAt, limit: limit === Infinity ? -1 : limit, tier };
}

export function checkRateLimit(userId: string, tier: string, type: 'builder' | 'chat'): RateLimitResult {
  const limits = getTierLimits(tier);
  const now = Date.now();

  let entry = rateStore.get(userId);
  if (!entry || entry.resetAt < now) {
    entry = { builderCalls: 0, chatMessages: 0, resetAt: now + limits.windowMs };
  }

  if (tier === 'pro' || tier === 'studio' || tier === 'enterprise') {
    return { allowed: true, remaining: -1, resetAt: entry.resetAt, limit: -1, tier };
  }

  const used = type === 'builder' ? entry.builderCalls : entry.chatMessages;
  const limit = type === 'builder' ? limits.builderCalls : limits.chatMessages;

  if (limit !== Infinity && used >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit: limit === Infinity ? -1 : limit, tier };
  }

  if (type === 'builder') entry.builderCalls++;
  else entry.chatMessages++;
  rateStore.set(userId, entry);

  return { allowed: true, remaining: (limit === Infinity ? 999999 : limit) - (used + 1), resetAt: entry.resetAt, limit: limit === Infinity ? -1 : limit, tier };
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
          ? `You've used all ${result.limit} builder calls today. Upgrade for more!`
          : 'Chat message limit reached.',
        upgrade_url: '/upgrade',
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

  if (tier === 'pro' || tier === 'studio' || tier === 'enterprise') {
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  let totalTokens = 0;
  const result: Array<{ role: string; content: string }> = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = msg.tokens || estimateTokens(msg.content);
    if (totalTokens + tokens > maxTokens) {
      if (tier === 'free' && result.length > 0) {
        result.unshift({ role: 'system', content: '[Earlier conversation summarized due to context limit. Upgrade to Pro for full context.]' });
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
