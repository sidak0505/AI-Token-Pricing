import { useState } from 'react';
import { FAQS } from '../content.js';

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="card wide-card">
      <div className="section-head"><div><h2>Frequently asked questions</h2></div></div>
      <div className="faq">
        {FAQS.map((f, i) => (
          <div className="faq-item" key={f.q}>
            <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{f.q}</span><span className="mono">{open === i ? '-' : '+'}</span></button>
            {open === i && <p className="faq-a">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
