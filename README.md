# Token Ledger — AI Task Cost Calculator

Full-stack React + Node app. No API keys, no external AI calls, no `.env` file
needed. Everything is local math and a local tokenizer.

Pick an agent from the dropdown → see its exact/estimated prompt tokens and
full pricing → hit "Estimate full task usage" for a formula-based forecast of
the whole job → optimize your prompt and see the token savings → browse
pricing for every agent → read tips and FAQs.

## Run it

```powershell
cd token-ledger
npm install
npm run dev
```

`npm run dev` starts **both** the API (port 8787) and the Vite dev server
(port 5173) together — open `http://localhost:5173`. No `.env` file, no keys,
nothing else to configure.

```powershell
npm run build   # production build to dist/
npm start       # run the API alone (port 8787), serving dist/ if built
```

## What's inside

- **Agent dropdown** (`PromptCard`) — 12 models across OpenAI, Anthropic,
  Google, DeepSeek. Selecting one updates the prompt-token count and every
  cost figure on the page.
- **Pricing for every agent** (`ProviderCard`) — input/output/cached price per
  1M tokens, context window, and a link to that provider's own pricing page,
  for all 12 models at once — not just the selected one.
- **Prompt token count** — exact for OpenAI (the real `o200k_base` tokenizer,
  `server/utils/tokens.js`, runs locally). Estimated for everyone else using a
  documented ratio in `server/data/pricing.js` (`tokenRatio`), since their
  tokenizers aren't runnable offline without a provider API key — which this
  build intentionally never requires.
- **"Estimate full task usage"** — a deterministic formula
  (`server/utils/heuristic.js`) that forecasts the *whole* job (planning,
  generation, tool calls, testing/debugging, response), not just your prompt.
  Always shown as a **range** with a confidence label, because real usage
  depends on things (retries, tool output size, reasoning depth) that can't be
  known ahead of time. See the FAQ in the app for more on this.
- **Optimize this prompt** (`server/utils/optimize.js`) — rule-based rewrite:
  removes filler ("please note that", "I would like you to"), shortens wordy
  phrases ("in order to" → "to", "utilize" → "use"), drops duplicate lines,
  never touches fenced code blocks. Shows exactly what changed, why, and the
  token/dollar savings.
- **"Have real numbers? Use them"** (`MeasuredCard`) — paste real
  `input_tokens`/`output_tokens` from one actual run (free with a local model,
  or a few cents on a cheap API) and get the true cost on every agent — no
  forecasting involved.
- **Tips & FAQ** — prompting tricks organized by Input / Output / Conversation
  / Money, and an FAQ covering exact-vs-estimated counts, why the task
  forecast is a range, and privacy (nothing here calls any AI provider).

## Why there's no `.env` anymore

An earlier version of this app optionally called the OpenAI, Anthropic, and
Google APIs for sharper estimates and exact non-OpenAI token counts. That
pulled in the `openai` and `@anthropic-ai/sdk` packages — if either failed to
install cleanly (network restrictions, proxy issues, a Node version mismatch),
the **whole server would crash on startup**, since the import happens before
any route is registered. That takes down every feature at once — the
dropdown, pricing, and estimate button all depend on the same server being up.

This version removes those SDKs entirely. The only dependencies are Express,
CORS, and the token counting library — nothing that can fail to reach an
external service, because nothing here calls one.

## Pricing data

Snapshot in `server/data/pricing.js`, checked against provider pricing pages
on **2026-09-28**. Prices move constantly — edit that one file when they
change; nothing else in the app needs to.
