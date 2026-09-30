import { useState } from 'react';
import { formatMoney } from '../format.js';

export default function OptimizeCard({ onRun, loading, result, error, disabled, stale }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(result.tightened).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <div className="card optimize-card">
      <div className="section-head">
        <div><h2>Optimize this prompt</h2><span className="muted">Get a tighter version and see exactly how many tokens it saves for the selected agent.</span></div>
      </div>
      <div className="opt-actions">
        <button className="estimate-btn inline" onClick={onRun} disabled={loading || disabled}>{loading ? 'Optimizing...' : 'Optimize prompt'}</button>
      </div>
      {error && <div className="error">{error}</div>}

      {result && <div className="opt-result">
        {stale && <div className="stale">Prompt changed - optimize again.</div>}
        <div className="save-grid">
          <div><span>Before</span><b className="mono">{result.before.toLocaleString()}</b></div>
          <div><span>After</span><b className="mono">{result.after.toLocaleString()}</b></div>
          <div className="win"><span>Saved</span><b className="mono">{result.saved.toLocaleString()} ({result.savedPct}%)</b></div>
          <div><span>Per 1,000 calls</span><b className="mono">{formatMoney(result.savedUsdPer1000Calls)}</b></div>
        </div>
        <div className="method mono">{result.agent.model} - {result.exact ? 'exact' : 'estimated'} counts - rule-based</div>

        <div className="compare">
          <div><div className="cmp-title">Original</div><pre>{result.original}</pre></div>
          <div className="better"><div className="cmp-title">Better version <button className="link-btn" onClick={copy}>{copied ? 'copied' : 'copy'}</button></div><pre>{result.tightened}</pre></div>
        </div>
        {result.saved === 0 && <div className="note">Nothing wasteful to trim - this prompt is already tight.</div>}

        {result.changes.length > 0 && <>
          <div className="section-title">What changed</div>
          <ul className="changes">{result.changes.map((c, i) => <li key={i}><code>{c.example}</code><span>{c.reason}{c.occurrences > 1 ? ` (x${c.occurrences})` : ''}</span></li>)}</ul>
        </>}
        {result.checks.length > 0 && <>
          <div className="section-title">Prompt health tips</div>
          <ul className="checks">{result.checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </>}
      </div>}
    </div>
  );
}
