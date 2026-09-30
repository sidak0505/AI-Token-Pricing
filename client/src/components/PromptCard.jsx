import { formatMoney, formatPrice, priceFor } from '../format.js';

const MODES = [
  { id: 'quick', label: 'Quick answer', desc: 'One main response, little or no tool use' },
  { id: 'normal', label: 'Normal agent', desc: 'Plan + work + tools + testing' },
  { id: 'deep', label: 'Deep agent', desc: 'Research + tools + iterations + debugging' }
];
export { MODES };

export default function PromptCard({ prompt, setPrompt, agents, agentId, setAgentId, agent, peak, analysis, counting, mode, setMode, onEstimate, loading, error }) {
  const info = analysis?.perAgent?.[agentId];
  const tokens = info?.tokens ?? 0;
  const price = agent ? priceFor(agent, peak) : { input: 0, output: 0 };
  const providers = [...new Set(agents.map(a => a.provider))];

  return (
    <div className="card prompt-card">
      <div className="section-head">
        <div><h2>Your prompt</h2><span className="muted mono">prompt tokens are counted per agent; task usage is forecasted</span></div>
        {info && <span className={`badge ${info.exact ? 'exact' : 'est'}`}>{info.exact ? 'exact count' : 'estimated'}</span>}
      </div>

      <label className="field-label" htmlFor="agent">Predict tokens for this AI agent</label>
      <select id="agent" className="agent-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
        {providers.map(p => (
          <optgroup key={p} label={p}>
            {agents.filter(a => a.provider === p).map(a => {
              const pr = priceFor(a, peak);
              return <option key={a.id} value={a.id}>{a.model} - {formatPrice(pr.input)} in / {formatPrice(pr.output)} out per 1M</option>;
            })}
          </optgroup>
        ))}
      </select>
      {agent && <div className="agent-meta mono">
        <span>context {agent.context}</span><span>cached input {formatPrice(agent.cachedInput)}/1M</span><span>ratio x{agent.tokenRatio}</span>
      </div>}

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the task you want an AI to complete..." />

      <div className="stat-row four">
        <div><strong>{analysis?.characters ?? prompt.length}</strong><span>Characters</span></div>
        <div><strong>{analysis?.words ?? 0}</strong><span>Words</span></div>
        <div><strong className={counting ? 'dim' : ''}>{tokens.toLocaleString()}</strong><span>Prompt tokens ({agent?.model})</span></div>
        <div><strong>{formatMoney(tokens * price.input / 1e6)}</strong><span>Prompt input cost</span></div>
      </div>
      {info && <div className="method mono">{info.method}</div>}

      <div className="divider" />
      <div className="section-title">How should the AI complete it?</div>
      <div className="mode-row">
        {MODES.map(m => <button key={m.id} className={`mode-btn ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}><b>{m.label}</b><small>{m.desc}</small></button>)}
      </div>
      <button className="estimate-btn" onClick={onEstimate} disabled={loading || !prompt.trim()}>{loading ? 'Estimating execution...' : 'Estimate full task usage'}</button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
