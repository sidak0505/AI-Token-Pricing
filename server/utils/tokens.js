import { encode } from 'gpt-tokenizer/encoding/o200k_base';

/** Exact OpenAI o200k_base token count. Runs locally, no network, no key. */
export function baseCount(text) {
  if (!text) return 0;
  try { return encode(text).length; }
  catch { return Math.ceil(text.length / 4); } // e.g. text containing reserved special-token strings
}

/**
 * Token count for any agent: exact for OpenAI, ratio-based estimate for
 * everyone else (their tokenizers aren't runnable offline without an API key,
 * which this build intentionally never requires).
 */
export function countForAgent(text, agent) {
  const base = baseCount(text);
  if (agent.tokenizer === 'openai') {
    return { tokens: base, exact: true, method: 'OpenAI o200k_base tokenizer (local, exact)' };
  }
  const tokens = base === 0 ? 0 : Math.max(1, Math.round(base * agent.tokenRatio));
  return { tokens, exact: false, method: `Estimated: exact OpenAI count x ${agent.tokenRatio}` };
}
