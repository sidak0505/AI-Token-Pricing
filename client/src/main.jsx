import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api } from './api.js';
import { useDebounced } from './format.js';
import PromptCard from './components/PromptCard.jsx';
import EstimateCard from './components/EstimateCard.jsx';
import OptimizeCard from './components/OptimizeCard.jsx';
import MeasuredCard from './components/MeasuredCard.jsx';
import ProviderCard from './components/ProviderCard.jsx';
import Tips from './components/Tips.jsx';
import Faq from './components/Faq.jsx';

function App() {
  const [agents, setAgents] = useState([]);
  const [providers, setProviders] = useState({});
  const [checked, setChecked] = useState('');
  const [loadError, setLoadError] = useState('');

  const [prompt, setPrompt] = useState('make a calculator app');
  const [agentId, setAgentId] = useState('gpt-5.6-terra');
  const [mode, setMode] = useState('normal');
  const [peak, setPeak] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [counting, setCounting] = useState(false);
  const [result, setResult] = useState(null);
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opt, setOpt] = useState(null);
  const [optSnap, setOptSnap] = useState(null);
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState('');

  const debounced = useDebounced(prompt);
  const agent = agents.find(a => a.id === agentId);

  useEffect(() => {
    api('/api/agents')
      .then(d => { setAgents(d.agents); setProviders(d.providers); setChecked(d.checked); })
      .catch(e => setLoadError(`Couldn't load agent list from the server: ${e.message}. Is "npm run dev" still running?`));
  }, []);

  useEffect(() => {
    if (!agents.length) return;
    let dead = false; setCounting(true);
    api('/api/analyze', { text: debounced, agentId })
      .then(d => { if (!dead) { setAnalysis(d); setError(''); } })
      .catch(e => { if (!dead) setError(e.message); })
      .finally(() => { if (!dead) setCounting(false); });
    return () => { dead = true; };
  }, [debounced, agentId, agents.length]);

  const estimate = async () => {
    setLoading(true); setError('');
    try { setResult(await api('/api/estimate', { prompt, mode, deepseekPeak: peak })); setSnap({ prompt, mode }); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const optimize = async () => {
    setOptLoading(true); setOptError('');
    try { setOpt(await api('/api/optimize', { text: prompt, agentId, deepseekPeak: peak })); setOptSnap({ prompt, agentId }); }
    catch (e) { setOptError(e.message); } finally { setOptLoading(false); }
  };

  // Re-price the existing forecast when the DeepSeek peak toggle changes.
  useEffect(() => { if (result && snap) api('/api/estimate', { prompt: snap.prompt, mode: snap.mode, deepseekPeak: peak }).then(setResult).catch(() => {}); }, [peak]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot"></span><span>Token Ledger</span><span className="brand-sub">ai task cost calculator</span></div>
        <div className="header-right">
          <span className="status-dot"></span>
          {agents.length ? `${agents.length} agents loaded - no API key needed` : loadError ? 'server unreachable' : 'loading...'}
        </div>
      </header>

      {loadError && <div className="page"><div className="error banner-error">{loadError}</div></div>}

      <main className="page">
        <section className="main-grid">
          <div className="left-col">
            <PromptCard {...{ prompt, setPrompt, agents, agentId, setAgentId, agent, peak, analysis, counting, mode, setMode, loading, error }} onEstimate={estimate} />
            {result && <EstimateCard result={result} agent={agent} mode={snap?.mode || mode} stale={snap && (snap.prompt !== prompt || snap.mode !== mode)} />}
            <OptimizeCard onRun={optimize} loading={optLoading} result={opt} error={optError}
              disabled={!prompt.trim()} stale={optSnap && (optSnap.prompt !== prompt || optSnap.agentId !== agentId)} />
            <MeasuredCard agents={agents} peak={peak} />
          </div>
          <ProviderCard {...{ agents, providers, agentId, setAgentId, peak, setPeak, analysis, result, checked }} />
        </section>
        <div className="stack">
          <Tips />
          <Faq />
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
