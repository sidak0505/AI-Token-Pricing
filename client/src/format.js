import { useEffect, useState } from 'react';

export const formatTokens = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${Math.round(n)}`;
export const formatMoney = (n) => n === 0 ? '$0.00' : n < 0.0001 ? '<$0.0001' : n < 0.01 ? `$${n.toFixed(4)}` : n < 1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`;
export const formatPrice = (n) => `$${n}`;
export const priceFor = (a, peak) => (peak && a.peak) ? a.peak : { input: a.input, output: a.output };

export function useDebounced(value, ms = 450) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
