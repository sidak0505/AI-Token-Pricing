// USD per 1,000,000 tokens. Snapshot checked 2026-09-28 against provider pricing pages.
// Prices change often - edit this file and nothing else needs to change.
//
// tokenRatio: only OpenAI's tokenizer runs exactly offline. For everyone else the app
// takes the exact OpenAI (o200k_base) count and multiplies by this ratio. It is an
// ESTIMATE. Set ANTHROPIC_API_KEY / GEMINI_API_KEY to get exact counts for the selected
// agent from those providers' free token-counting endpoints.

export const PRICING_CHECKED = '2026-09-28';

export const PROVIDER_META = {
  OpenAI:    { color: '#4a68e8', pricingUrl: 'https://developers.openai.com/api/docs/pricing' },
  Anthropic: { color: '#e36f4b', pricingUrl: 'https://docs.claude.com/en/docs/about-claude/pricing' },
  Google:    { color: '#35a35b', pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing' },
  DeepSeek:  { color: '#7d62e7', pricingUrl: 'https://api-docs.deepseek.com/quick_start/pricing/' }
};

const CLAUDE_NOTE = 'Claude 4.7+ tokenizers produce ~30% more tokens than older Claude models for the same text, so the token ratio here is higher than for other providers.';

export const AGENTS = [
  // ---- OpenAI ----
  { id: 'gpt-5.6-sol', provider: 'OpenAI', model: 'GPT-5.6 Sol', context: '1.05M', input: 5, output: 30, cachedInput: 0.5, tokenRatio: 1, tokenizer: 'openai',
    note: 'Above ~272K input tokens OpenAI bills higher long-context rates for the whole request.' },
  { id: 'gpt-5.6-terra', provider: 'OpenAI', model: 'GPT-5.6 Terra', context: '1.05M', input: 2, output: 12, cachedInput: 0.2, tokenRatio: 1, tokenizer: 'openai',
    note: 'Above ~272K input tokens OpenAI bills higher long-context rates for the whole request.' },
  { id: 'gpt-5.6-luna', provider: 'OpenAI', model: 'GPT-5.6 Luna', context: '1.05M', input: 0.2, output: 1.2, cachedInput: 0.02, tokenRatio: 1, tokenizer: 'openai',
    note: 'Cheapest OpenAI tier - good for classification, extraction and high-volume work.' },

  // ---- Anthropic ----
  { id: 'claude-fable-5.1', provider: 'Anthropic', model: 'Claude Fable 5.1', context: '1M', input: 10, output: 50, cachedInput: 0.25, tokenRatio: 1.4, tokenizer: 'anthropic', apiModel: 'claude-fable-5-1', note: CLAUDE_NOTE },
  { id: 'claude-opus-5.5', provider: 'Anthropic', model: 'Claude Opus 5.5', context: '1M', input: 4, output: 20, cachedInput: 0.2, tokenRatio: 1.4, tokenizer: 'anthropic', apiModel: 'claude-opus-5-5', note: CLAUDE_NOTE },
  { id: 'claude-sonnet-5', provider: 'Anthropic', model: 'Claude Sonnet 5', context: '1M', input: 2, output: 10, cachedInput: 0.2, tokenRatio: 1.4, tokenizer: 'anthropic', apiModel: 'claude-sonnet-5', note: CLAUDE_NOTE },
  { id: 'claude-haiku-4.5', provider: 'Anthropic', model: 'Claude Haiku 4.5', context: '200K', input: 1, output: 5, cachedInput: 0.1, tokenRatio: 1.1, tokenizer: 'anthropic', apiModel: 'claude-haiku-4-5-20251001',
    note: 'Older tokenizer than the 5.x models, so it produces fewer tokens for the same text.' },

  // ---- Google ----
  { id: 'gemini-3.1-pro', provider: 'Google', model: 'Gemini 3.1 Pro', context: '1M', input: 2, output: 12, cachedInput: 0.2, tokenRatio: 1, tokenizer: 'google', apiModel: 'gemini-3.1-pro-preview',
    note: 'Price shown is for prompts up to 200K tokens; longer prompts cost more.' },
  { id: 'gemini-3.8-flash', provider: 'Google', model: 'Gemini 3.8 Flash', context: '1M', input: 0.75, output: 3.75, cachedInput: 0.075, tokenRatio: 1, tokenizer: 'google', apiModel: 'gemini-3.8-flash',
    note: 'Introductory price through 2026-12-31; doubles to $1.50 / $7.50 on 2027-01-01.' },
  { id: 'gemini-3.5-flash-lite', provider: 'Google', model: 'Gemini 3.5 Flash-Lite', context: '1M', input: 0.3, output: 2.5, cachedInput: 0.03, tokenRatio: 1, tokenizer: 'google', apiModel: 'gemini-3.5-flash-lite',
    note: 'Cheapest current-generation Gemini tier.' },

  // ---- DeepSeek ---- (off-peak price is the default; `peak` is exactly double)
  { id: 'deepseek-v4.1-flash', provider: 'DeepSeek', model: 'DeepSeek-V4.1 Flash', context: '1M', input: 0.15, output: 0.6, cachedInput: 0.003, tokenRatio: 1.05, tokenizer: 'deepseek',
    peak: { input: 0.3, output: 1.2 },
    note: 'Peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays; every other hour is half price.' },
  { id: 'deepseek-v4-pro', provider: 'DeepSeek', model: 'DeepSeek-V4 Pro', context: '1M', input: 0.66, output: 1.98, cachedInput: 0.022, tokenRatio: 1.05, tokenizer: 'deepseek',
    peak: { input: 1.32, output: 3.96 },
    note: 'Peak hours are 01:00-04:00 and 06:00-10:00 UTC on weekdays; every other hour is half price.' }
];

export const getAgent = (id) => AGENTS.find(a => a.id === id);

/** Effective USD / 1M price for an agent (DeepSeek switches on the peak flag). */
export function priceFor(agent, peak = false) {
  if (peak && agent.peak) return { input: agent.peak.input, output: agent.peak.output };
  return { input: agent.input, output: agent.output };
}
