import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { AssetConfig, ModelBundle } from '../lib/types';
import { fmtCompact, fmtPct, fmtPrice } from '../lib/format';

interface Props {
  asset: AssetConfig;
  model: ModelBundle;
  livePrice: number;
  range: number;
  onRangeChange: (r: number) => void;
}

const RANGES = [
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '180D', value: 180 },
  { label: '1Y', value: 365 },
];

export default function OverviewBar({
  asset,
  model,
  livePrice,
  range,
  onRangeChange,
}: Props) {
  const change = ((livePrice - model.prevClose) / model.prevClose) * 100;
  const up = change >= 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 sm:p-5">
      {/* Asset identity */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl font-mono text-sm font-bold"
          style={{
            backgroundColor: `${asset.color}1f`,
            color: asset.color,
            border: `1px solid ${asset.color}33`,
          }}
        >
          {asset.id.slice(0, 3)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white">
              {asset.name}
            </h1>
            <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-mono text-[11px] text-slate-400">
              {asset.symbol}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
            {asset.category === 'gold'
              ? 'Precious Metals'
              : asset.category === 'crypto'
                ? 'Cryptocurrency'
                : 'Equities'}
          </p>
        </div>
      </div>

      {/* Live price */}
      <div className="flex items-center gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
              ${fmtPrice(livePrice, asset.decimals)}
            </span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 font-mono text-[13px] tabular-nums ${
              up ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {fmtPct(change)}
            <span className="ml-1 text-slate-600">today</span>
          </div>
        </div>

        <div className="hidden h-12 w-px bg-slate-800 md:block" />

        {/* Quick stats */}
        <div className="hidden grid-cols-2 gap-x-6 gap-y-2 md:grid">
          <Stat label="Day Range" value={`$${fmtPrice(model.dayLow, asset.decimals)} – $${fmtPrice(model.dayHigh, asset.decimals)}`} />
          <Stat label="Volume" value={fmtCompact(model.totalVolume)} />
          <Stat label="Market Cap" value={asset.marketCap} />
          <Stat label="Ann. Volatility" value={`${model.forecast.annVol.toFixed(1)}%`} />
        </div>

        <div className="hidden h-12 w-px bg-slate-800 md:block" />

        {/* Range selector */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[12px] font-semibold transition-all ${
                range === r.value
                  ? 'bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]'
                  : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[13px] tabular-nums text-slate-300">
        {value}
      </p>
    </div>
  );
}
