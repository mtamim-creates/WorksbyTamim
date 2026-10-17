import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AssetConfig, ModelBundle } from '../lib/types';
import { fmtAxis, fmtCompact, fmtPrice } from '../lib/format';

interface Props {
  asset: AssetConfig;
  model: ModelBundle;
}

const LEGEND = [
  { label: 'Actual Price', color: '#22d3ee', dash: false },
  { label: 'OLS Trend', color: '#64748b', dash: true },
  { label: 'NN Forecast', color: '#a78bfa', dash: true },
  { label: '90% Confidence Band', color: '#8b5cf6', dash: false, band: true },
];

export default function PriceChart({ asset, model }: Props) {
  const data = model.data;
  const decimals = asset.decimals;

  const prices = data.map((d) => d.price ?? d.forecast ?? 0);
  const lows = data.map((d) => d.ciLower ?? d.price ?? Infinity);
  const highs = data.map((d) => d.ciUpper ?? d.price ?? -Infinity);
  const yMin = Math.min(...prices, ...lows);
  const yMax = Math.max(...prices, ...highs);
  const pad = (yMax - yMin) * 0.06 || yMin * 0.02;

  const maxVol = Math.max(...data.map((d) => d.volume ?? 0));

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">
            Price Action & Neural Forecast
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {asset.symbol} · 30-day forward projection with 90% confidence
            interval
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-4 rounded-full"
                style={{
                  backgroundColor: l.band ? 'transparent' : l.color,
                  backgroundImage: l.band
                    ? `linear-gradient(90deg, ${l.color}33, ${l.color}66)`
                    : undefined,
                  border: l.band ? `1px solid ${l.color}55` : undefined,
                }}
              />
              <span className="text-[11px] text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[380px] w-full sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#1e293b"
              strokeOpacity={0.35}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              minTickGap={48}
              tickMargin={8}
            />

            <YAxis
              yAxisId="price"
              domain={[yMin - pad, yMax + pad]}
              orientation="right"
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtAxis(v)}
              width={58}
            />

            <YAxis
              yAxisId="volume"
              domain={[0, maxVol * 5]}
              orientation="left"
              hide
            />

            <Tooltip content={<ChartTooltip decimals={decimals} />} />

            {/* Volume bars */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#1e293b"
              fillOpacity={0.5}
              isAnimationActive={false}
            />

            {/* Confidence band (stacked: invisible base + visible width) */}
            <Area
              yAxisId="price"
              dataKey="ciLower"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              dataKey="ciWidth"
              stackId="band"
              stroke="none"
              fill="url(#bandGrad)"
              isAnimationActive={false}
            />

            {/* Historical price */}
            <Area
              yAxisId="price"
              dataKey="price"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              isAnimationActive={false}
            />

            {/* OLS trendline */}
            <Line
              yAxisId="price"
              dataKey="regressionFit"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />

            {/* NN forecast */}
            <Line
              yAxisId="price"
              dataKey="forecast"
              stroke="#a78bfa"
              strokeWidth={2.5}
              strokeDasharray="7 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>
            Horizon:{' '}
            <span className="font-mono text-slate-400">30 days</span>
          </span>
          <span>
            Band:{' '}
            <span className="font-mono text-slate-400">90% CI</span>
          </span>
          <span>
            Models:{' '}
            <span className="font-mono text-slate-400">OLS + LSTM</span>
          </span>
        </div>
        <div className="font-mono text-[11px] tabular-nums text-slate-600">
          n = {model.n} observations
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ChartTooltip({
  active,
  payload,
  label,
  decimals,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number | null }[];
  label?: string;
  decimals: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const get = (k: string) =>
    payload.find((p) => p.dataKey === k)?.value ?? null;

  const price = get('price');
  const forecast = get('forecast');
  const reg = get('regressionFit');
  const nn = get('nnFit');
  const lo = get('ciLower');
  const hi = get('ciUpper');
  const vol = get('volume');

  const isForecast = forecast != null && price == null;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-[#0b101c]/95 px-3.5 py-3 shadow-2xl backdrop-blur">
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      {price != null && (
        <Row label="Actual" value={`$${fmtPrice(price, decimals)}`} color="#22d3ee" />
      )}
      {forecast != null && (
        <Row label="NN Forecast" value={`$${fmtPrice(forecast, decimals)}`} color="#a78bfa" />
      )}
      {reg != null && (
        <Row label="OLS Fit" value={`$${fmtPrice(reg, decimals)}`} color="#64748b" />
      )}
      {nn != null && (
        <Row label="NN Fit" value={`$${fmtPrice(nn, decimals)}`} color="#8b5cf6" />
      )}
      {isForecast && lo != null && hi != null && (
        <div className="mt-1.5 border-t border-slate-800 pt-1.5 font-mono text-[11px] tabular-nums text-slate-500">
          90% CI:{' '}
          <span className="text-violet-300">
            ${fmtPrice(lo, decimals)} – ${fmtPrice(hi, decimals)}
          </span>
        </div>
      )}
      {vol != null && (
        <div className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
          Vol: <span className="text-slate-400">{fmtCompact(vol)}</span>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-0.5">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-mono text-[12px] tabular-nums text-slate-200">
        {value}
      </span>
    </div>
  );
}
