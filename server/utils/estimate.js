import { AGENTS, priceFor } from '../data/pricing.js';

/** Cost of the forecast task on EVERY agent. Token totals are scaled by each agent's tokenizer ratio. */
export function addAgentCosts(plan, { deepseekPeak = false } = {}) {
  const totalMin = plan.breakdown.reduce((a, x) => a + x.min, 0);
  const totalMax = plan.breakdown.reduce((a, x) => a + x.max, 0);
  // Reasoning is treated as billed output. Coding tasks re-read more context, so more input share.
  const inputShare = plan.taskType === 'Coding' ? 0.42 : 0.34;

  return AGENTS.map(a => {
    const price = priceFor(a, deepseekPeak);
    const minT = totalMin * a.tokenRatio, maxT = totalMax * a.tokenRatio;
    const cost = (t) => (t * inputShare / 1e6) * price.input + (t * (1 - inputShare) / 1e6) * price.output;
    return {
      id: a.id, provider: a.provider, model: a.model, context: a.context,
      inputPrice: price.input, outputPrice: price.output,
      tokensMin: Math.round(minT), tokensMax: Math.round(maxT),
      costMin: cost(minT), costMax: cost(maxT)
    };
  });
}
