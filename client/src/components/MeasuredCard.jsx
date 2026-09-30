import { useState } from 'react';
import { formatMoney, priceFor } from '../format.js';

export default function MeasuredCard({ agents, peak }) {
  const [inp, setInp] = useState('');
  const [out, setOut] = useState('');
  const i = Number(inp) || 0, o = Number(out) || 0, ready = i > 0 || o > 0;
  return (
    <div className="card measured-card">
      <div className="section-head"><div><h2>Have real numbers? Use them</h2>
        <span className="muted">The only exact output-token count comes from running the task once. Paste the <span className="mono">usage</span> numbers from that run (free with a local model via Ollama, or a few cents on a cheap API) to get true costs on every agent.</span></div></div>
      <div className="measure-inputs">
        <label>Input tokens<input type="number" min="0" value={inp} onChange={e => setInp(e.target.value)} placeholder="e.g. 42000" /></label>
        <label>Output tokens<input type="number" min="0" value={out} onChange={e => setOut(e.target.value)} placeholder="e.g. 9000" /></label>
      </div>
      {ready && <table className="measure-table"><thead><tr><th>Agent</th><th>Cost of that run</th></tr></thead><tbody>
        {agents.map(a => { const p = priceFor(a, peak); return <tr key={a.id}><td>{a.model}</td><td className="mono">{formatMoney(i * p.input / 1e6 + o * p.output / 1e6)}</td></tr>; })}
      </tbody></table>}
      {ready && <div className="muted note-small">Token counts differ a little between tokenizers, so treat other agents' figures as close approximations.</div>}
    </div>
  );
}
