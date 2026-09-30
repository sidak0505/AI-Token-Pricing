import { useState } from 'react';
import { TIPS } from '../content.js';

const TAGS = ['All', 'Input', 'Output', 'Conversation', 'Money'];
export default function Tips() {
  const [tag, setTag] = useState('All');
  const list = TIPS.filter(t => tag === 'All' || t.tag === tag);
  return (
    <section className="card wide-card">
      <div className="section-head"><div><h2>Smart prompting tricks & hacks</h2><span className="muted">Practical ways to spend fewer tokens without getting worse answers.</span></div></div>
      <div className="tag-row">{TAGS.map(t => <button key={t} className={`tag ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>)}</div>
      <div className="tips-grid">
        {list.map(t => (
          <div className="tip" key={t.title}>
            <span className={`tip-tag ${t.tag.toLowerCase()}`}>{t.tag}</span>
            <h3>{t.title}</h3><p>{t.body}</p>
            {t.example && <div className="tip-example"><div><em>Before</em>{t.example[0]}</div><div className="after"><em>After</em>{t.example[1]}</div></div>}
          </div>
        ))}
      </div>
    </section>
  );
}
