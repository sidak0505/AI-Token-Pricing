import { MODES } from './PromptCard.jsx';
import { formatTokens, formatMoney } from '../format.js';

export default function EstimateCard({ result, agent, mode, stale }) {
  const est = result.agentEstimates.find(e => e.id === agent?.id) || result.agentEstimates[0];
  const maxWidth = Math.max(...result.breakdown.map(x => x.max));
  return (
    <div className="card estimate-card">
      <div className="section-head">
        <div><h2>Estimated AI usage</h2><span className="muted">Work needed to complete the task, not just the prompt. Shown for {est.model}.</span></div>
        <span className={`confidence ${result.confidence.toLowerCase()}`}>{result.confidence} confidence</span>
      </div>
      {stale && <div className="stale">Prompt or mode changed since this estimate - run it again.</div>}
      <div className="hero-estimate">
        <span className="range">{formatTokens(est.tokensMin)} - {formatTokens(est.tokensMax)}</span>
        <span className="range-label">estimated total tokens</span>
        <span className="hero-cost mono">{formatMoney(est.costMin)} - {formatMoney(est.costMax)} on {est.model}</span>
      </div>
      <div className="meta-grid">
        <div><span>Task type</span><b>{result.taskType}</b></div>
        <div><span>Complexity</span><b>{result.complexity}</b></div>
        <div><span>Model calls</span><b>{result.modelCalls.min}-{result.modelCalls.max}</b></div>
        <div><span>Tool calls</span><b>{result.toolCalls.min}-{result.toolCalls.max}</b></div>
        <div><span>Research</span><b>{result.research}</b></div>
        <div><span>Mode</span><b>{MODES.find(x => x.id === mode)?.label}</b></div>
      </div>
      <div className="section-title breakdown-title">Execution breakdown</div>
      <div className="breakdown">
        {result.breakdown.map(item => (
          <div className="break-row" key={item.name}>
            <div className="break-label"><span>{item.name}</span><span className="mono">{formatTokens(item.min)}-{formatTokens(item.max)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(7, item.max / maxWidth * 100)}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="assumptions"><b>Assumptions</b>{result.assumptions.map(a => <span key={a}>- {a}</span>)}
        <span className="src">from a built-in formula (server/utils/heuristic.js) - a rough forecast, not a bill</span></div>
    </div>
  );
}
