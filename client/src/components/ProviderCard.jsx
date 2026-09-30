import { formatMoney, formatTokens, formatPrice, priceFor } from '../format.js';

export default function ProviderCard({ agents, providers, agentId, setAgentId, peak, setPeak, analysis, result, checked }) {
  const names = [...new Set(agents.map(a => a.provider))];
  return (
    <aside className="card provider-card">
      <div className="section-head">
        <div><h2>Cost by agent</h2><span className="muted">click a row to select it</span></div>
        <span className="mono muted">USD / 1M tokens</span>
      </div>
      <label className="peak-toggle"><input type="checkbox" checked={peak} onChange={e => setPeak(e.target.checked)} /> DeepSeek peak-hours pricing</label>

      {names.map(name => (
        <div className="provider" key={name}>
          <div className="provider-title">
            <span className="provider-dot" style={{ background: providers[name]?.color }} /><b>{name}</b>
            <a className="pricing" href={providers[name]?.pricingUrl} target="_blank" rel="noreferrer">pricing</a>
          </div>
          <div className="model-head"><span>Model</span><span>In</span><span>Out</span><span>Task</span></div>
          {agents.filter(a => a.provider === name).map(a => {
            const pr = priceFor(a, peak);
            const est = result?.agentEstimates.find(e => e.id === a.id);
            const pt = analysis?.perAgent?.[a.id];
            return (
              <button key={a.id} className={`model-row ${a.id === agentId ? 'selected' : ''}`} onClick={() => setAgentId(a.id)} title={a.note}>
                <span className="mname">{a.model}<em>{a.context} ctx{pt ? ` - ${formatTokens(pt.tokens)} prompt tok` : ''}</em></span>
                <span className="mono">{formatPrice(pr.input)}</span>
                <span className="mono">{formatPrice(pr.output)}</span>
                <strong>{est ? `${formatMoney(est.costMin)}-${formatMoney(est.costMax)}` : '-'}</strong>
              </button>
            );
          })}
        </div>
      ))}
      <div className="provider-note">Prices checked {checked}; edit <span className="mono">server/data/pricing.js</span> when they change. Hover a row for pricing notes (Gemini intro price, DeepSeek peak hours, long-context surcharges). Task costs are ranges from a forecast, not a bill.</div>
    </aside>
  );
}
