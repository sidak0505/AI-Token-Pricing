import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { heuristicPlan } from './utils/heuristic.js';
import { addAgentCosts } from './utils/estimate.js';
import { AGENTS, PROVIDER_META, PRICING_CHECKED, getAgent, priceFor } from './data/pricing.js';
import { baseCount, countForAgent } from './utils/tokens.js';
import { optimizeRules, promptChecks } from './utils/optimize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const MAX_TEXT = 30000;
const wordCount = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

app.get('/api/health', (req, res) => res.json({ ok: true, agents: AGENTS.length }));

// All agents with pricing (DeepSeek includes its peak price). No key needed - this is static data.
app.get('/api/agents', (req, res) => res.json({
  checked: PRICING_CHECKED,
  providers: PROVIDER_META,
  agents: AGENTS.map(({ tokenizer, ...a }) => a)
}));

// Prompt token count for every agent - exact for OpenAI, ratio-estimated for the rest. No key, no network.
app.post('/api/analyze', (req, res) => {
  const text = String(req.body?.text ?? '');
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Text is too long (${MAX_TEXT.toLocaleString()} characters max).` });
  const base = baseCount(text);
  const perAgent = Object.fromEntries(AGENTS.map(a => [a.id, countForAgent(text, a)]));
  res.json({ characters: text.length, words: wordCount(text), baseTokens: base, perAgent });
});

// Rule-based prompt optimizer: filler removal, wordy-phrase shortening, duplicate-line removal.
// Deterministic, offline, no key.
app.post('/api/optimize', (req, res) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) return res.status(400).json({ error: 'Write a prompt first.' });
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Text is too long (${MAX_TEXT.toLocaleString()} characters max).` });
  const agent = getAgent(req.body?.agentId) || AGENTS[0];
  const peak = Boolean(req.body?.deepseekPeak);

  const rules = optimizeRules(text);
  const before = countForAgent(text, agent);
  const after = countForAgent(rules.tightened, agent);
  const saved = Math.max(0, before.tokens - after.tokens);
  const price = priceFor(agent, peak);
  const perCall = (saved * price.input) / 1e6;

  res.json({
    agent: { id: agent.id, model: agent.model, inputPrice: price.input },
    original: text,
    tightened: rules.tightened,
    changes: rules.changes,
    before: before.tokens,
    after: after.tokens,
    exact: before.exact && after.exact,
    method: after.method,
    saved,
    savedPct: before.tokens ? Math.round((saved / before.tokens) * 100) : 0,
    savedUsdPerCall: perCall,
    savedUsdPer1000Calls: perCall * 1000,
    checks: promptChecks(rules.tightened, after.tokens)
  });
});

// Full-task forecast: a deterministic formula (server/utils/heuristic.js), not an AI call.
app.post('/api/estimate', (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  const mode = ['quick', 'normal', 'deep'].includes(req.body?.mode) ? req.body.mode : 'normal';
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
  if (prompt.length > 12000) return res.status(400).json({ error: 'Prompt is too long (12,000 characters max).' });

  const plan = heuristicPlan(prompt, mode);
  const agentEstimates = addAgentCosts(plan, { deepseekPeak: Boolean(req.body?.deepseekPeak) });
  res.json({ ...plan, agentEstimates, source: 'formula' });
});

// Serve production frontend after `npm run build`.
const clientDist = path.resolve(__dirname, '../dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => { if (err) next(); });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 413 ? 'Request too large.' : (err.message || 'Server error') });
});

app.listen(PORT, () => console.log(`Token Ledger server running on http://localhost:${PORT}`));
