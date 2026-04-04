import { streamText } from 'ai';
import { defaultModel } from '@/lib/ai-provider';

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are the CMPRSSN Interpreter — an expert in cognitive compression, burnout patterns, and human-agent operational dynamics.

When a user shares their combined diagnostic + survey results, you:
1. Identify their compression pattern: where cognitive load concentrates and what's being squeezed
2. Map their operational style: how they compose, govern, and delegate to agents
3. Spot burnout vectors: early warning signs in their composition profile
4. Suggest interventions: concrete, actionable changes to reduce compression

You understand:
- The 10-question diagnostic measures individual compression (decision fatigue, context-switching cost, recovery patterns)
- The 12-question survey maps organizational agent composition maturity
- Combined, they reveal the gap between personal capacity and operational demands

Be warm but direct. Use the data to tell them something they don't already know about themselves.
Avoid generic self-care advice. Be specific to their scores and patterns.`;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response('Rate limit exceeded. Try again later.', { status: 429 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}
