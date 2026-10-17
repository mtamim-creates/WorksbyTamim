export const fmtPrice = (v: number, decimals = 2): string =>
  v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtPct = (v: number, decimals = 2): string =>
  `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;

export const fmtCompact = (v: number): string =>
  Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(v);

export const fmtAxis = (v: number): string =>
  v >= 10000 ? `$${(v / 1000).toFixed(1)}k` : v >= 1000 ? `$${(v / 1000).toFixed(2)}k` : `$${v.toFixed(0)}`;

export const fmtSci = (v: number): string => v.toExponential(2);

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));
