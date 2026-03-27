import { getTierLimits } from '../middleware/rate-limiter';

type Tier = 'free' | 'starter' | 'builder' | 'pro' | 'studio' | 'enterprise';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens?: number;
}

interface ContextWindow {
  messages: Message[];
  totalTokens: number;
  wasTruncated: boolean;
  summaryNote?: string;
}

function estimateTokens(text: string): number {
  const isCode = /[{;}=()<>\/]/.test(text) && text.split('\n').length > 2;
  return Math.ceil(text.length / (isCode ? 3.5 : 4));
}

function extractKeywords(text: string): string[] {
  const stopWords = ['about','after','again','being','could','does','doing','having','here','just','more','much','only','other','over','same','some','such','than','that','their','them','then','there','these','they','this','those','through','under','very','what','when','where','which','while','with','would','your'];
  return [...new Set(
    text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4 && !stopWords.includes(w))
  )].slice(0, 5);
}

function generateSummary(omitted: Message[]): string {
  const userMsgs = omitted.filter(m => m.role === 'user');
  const topics = userMsgs.map(m => extractKeywords(m.content)).flat().slice(0, 5);
  const topicStr = topics.length > 0 ? `Topics: ${topics.join(', ')}.` : '';
  return `[${omitted.length} messages summarized. ${topicStr} Upgrade to Pro for full context.]`;
}

function buildFreeTierContext(conversation: Message[], availableTokens: number, usedTokens: number, result: Message[]): ContextWindow {
  const msgCount = conversation.length;

  if (msgCount <= 6) {
    const reversed = [...conversation].reverse();
    for (const msg of reversed) {
      const tokens = estimateTokens(msg.content);
      if (usedTokens + tokens > availableTokens) break;
      result.push(msg);
      usedTokens += tokens;
    }
    result.reverse();
  } else if (msgCount <= 20) {
    const firstTwo = conversation.slice(0, 2);
    const lastFour = conversation.slice(-4);
    for (const msg of [...firstTwo, ...lastFour]) {
      const tokens = estimateTokens(msg.content);
      if (usedTokens + tokens > availableTokens) break;
      result.push(msg);
      usedTokens += tokens;
    }
    result.splice(2, 0, { role: 'system', content: '[Some messages omitted for brevity. Upgrade to see full context.]', tokens: 12 });
    usedTokens += 12;
  } else {
    const first = conversation[0];
    const lastThree = conversation.slice(-3);
    const firstTokens = estimateTokens(first.content);
    if (usedTokens + firstTokens <= availableTokens) {
      result.push(first);
      usedTokens += firstTokens;
    }
    const summary: Message = { role: 'system', content: generateSummary(conversation.slice(1, -3)), tokens: 30 };
    result.push(summary);
    usedTokens += 30;
    for (const msg of lastThree) {
      const tokens = estimateTokens(msg.content);
      if (usedTokens + tokens > availableTokens) break;
      result.push(msg);
      usedTokens += tokens;
    }
  }

  return { messages: result, totalTokens: usedTokens, wasTruncated: true, summaryNote: 'Context optimized for free tier. Upgrade for full history.' };
}

export function buildContextWindow(
  conversation: Message[],
  tier: Tier | string,
  options: { systemPrompt?: string; reserveTokens?: number } = {}
): ContextWindow {
  const limits = getTierLimits(tier);
  const maxContext = limits.contextWindow;
  const reserveTokens = options.reserveTokens || 1000;
  const availableTokens = maxContext - reserveTokens;

  if (tier === 'pro' || tier === 'studio' || tier === 'enterprise') {
    const totalTokens = conversation.reduce((sum, m) => sum + (m.tokens || estimateTokens(m.content)), 0);
    return { messages: conversation, totalTokens, wasTruncated: false };
  }

  const result: Message[] = [];
  let usedTokens = 0;

  if (options.systemPrompt) {
    const sysTokens = estimateTokens(options.systemPrompt);
    result.push({ role: 'system', content: options.systemPrompt, tokens: sysTokens });
    usedTokens += sysTokens;
  }

  if (tier === 'free') {
    return buildFreeTierContext(conversation, availableTokens, usedTokens, result);
  }

  const reversed = [...conversation].reverse();
  for (const msg of reversed) {
    const tokens = msg.tokens || estimateTokens(msg.content);
    if (usedTokens + tokens > availableTokens) break;
    result.push(msg);
    usedTokens += tokens;
  }
  result.reverse();

  return {
    messages: result,
    totalTokens: usedTokens,
    wasTruncated: conversation.length > result.length,
    summaryNote: conversation.length > result.length ? `Showing last ${result.length} of ${conversation.length} messages` : undefined,
  };
}

export function getContextRecommendation(tier: string): string {
  const recs: Record<string, string> = {
    free: '4K tokens (~3000 words) - Good for small components and quick Q&A',
    starter: '8K tokens (~6000 words) - Full file editing and medium conversations',
    builder: '16K tokens (~12000 words) - Multi-file projects and complex tasks',
    pro: 'Up to 128K tokens - Entire codebase context available',
    studio: 'Up to 200K tokens - Team-scale context',
    enterprise: 'Unlimited - Custom deployment options',
  };
  return recs[tier] || recs.free;
}
