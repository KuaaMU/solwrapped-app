// LLM provider abstraction
// ========================
// Single entry point: generateText({ system, user }) → string | null
// Supports Anthropic (native), OpenAI / OpenRouter / DeepSeek (OpenAI-compatible),
// and Google Gemini. Provider selected via env; auto-detected if not set.
// Returns null when no key is configured so callers can use a hardcoded template.

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'deepseek'
  | 'gemini';

export interface LLMOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseURL?: string;
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  openrouter: 'meta-llama/llama-3.3-70b-instruct',
  deepseek: 'deepseek-chat',
  gemini: 'gemini-2.0-flash',
};

const ENV_KEYS: Record<LLMProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/** Resolve provider + key + model from env. Returns null if no key available. */
export function resolveProvider(): ProviderConfig | null {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase() as LLMProvider | undefined;
  const order: LLMProvider[] = explicit
    ? [explicit]
    : ['anthropic', 'openrouter', 'deepseek', 'openai', 'gemini'];

  for (const provider of order) {
    if (!DEFAULT_MODELS[provider]) continue; // invalid provider string
    const apiKey = process.env[ENV_KEYS[provider]]?.trim();
    if (!apiKey) continue;
    return {
      provider,
      apiKey,
      model: process.env.LLM_MODEL?.trim() || DEFAULT_MODELS[provider],
      baseURL: process.env.OPENAI_BASE_URL?.trim(),
    };
  }
  return null;
}

/**
 * Generate text from an LLM. Returns null if no provider is configured
 * or the request fails — callers should fall back to a hardcoded template.
 */
export async function generateText(opts: LLMOptions): Promise<string | null> {
  const cfg = resolveProvider();
  if (!cfg) return null;

  try {
    switch (cfg.provider) {
      case 'anthropic':
        return await callAnthropic(cfg, opts);
      case 'openai':
      case 'openrouter':
      case 'deepseek':
        return await callOpenAICompat(cfg, opts);
      case 'gemini':
        return await callGemini(cfg, opts);
    }
  } catch (err) {
    console.error(`[llm] ${cfg.provider} request failed:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider implementations

async function callAnthropic(cfg: ProviderConfig, opts: LLMOptions): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    }),
  });

  if (!res.ok) {
    console.error('[llm] Anthropic error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

async function callOpenAICompat(cfg: ProviderConfig, opts: LLMOptions): Promise<string | null> {
  const url = cfg.baseURL
    ? `${cfg.baseURL.replace(/\/$/, '')}/chat/completions`
    : defaultCompatURL(cfg.provider);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
    }),
  });

  if (!res.ok) {
    console.error(`[llm] ${cfg.provider} error:`, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}

function defaultCompatURL(provider: LLMProvider): string {
  switch (provider) {
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    case 'openai':
    default:
      return 'https://api.openai.com/v1/chat/completions';
  }
}

async function callGemini(cfg: ProviderConfig, opts: LLMOptions): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: 'user', parts: [{ text: opts.user }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 512,
        temperature: opts.temperature ?? 0.7,
      },
    }),
  });

  if (!res.ok) {
    console.error('[llm] Gemini error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
