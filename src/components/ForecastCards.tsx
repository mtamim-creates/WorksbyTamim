import { Target, ShieldAlert, ShieldCheck, Waves, Gauge, Sigma } from 'lucide-react';
import type { AssetConfig, ForecastResult } from '../lib/types';
import { fmtPct, fmtPrice } from '../lib/format';

interface Props {
  asset: AssetConfig;
  forecast: ForecastResult;
}

export default function ForecastCards({ asset, forecast }: Props) {
  const d = asset.decimals;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
      <Tile
        icon={<Target className="h-4 w-4 text-violet-400" />}
        label="7-Day Target"
        value={`$${fmtPrice(forecast.target7, d)}`}
        sub={fmtPct(forecast.return7)}
        tone={forecast.return7 >= 0 ? 'up' : 'down'}
      />
      <Tile
        icon={<Target className="h-4 w-4 text-violet-400" />}
        label="30-Day Target"
        value={`$${fmtPrice(forecast.target30, d)}`}
        sub={fmtPct(forecast.return30)}
        tone={forecast.return30 >= 0 ? 'up' : 'down'}
      />
      <Tile
        icon={<Waves className="h-4 w-4 text-cyan-400" />}
        label="30D Confidence Band"
        value={`$${fmtPrice(forecast.ci30[0], d)}`}
        sub={`– $${fmtPrice(forecast.ci30[1], d)}`}
        tone="neutral"
      />
      <Tile
        icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
        label="Support Level"
        value={`$${fmtPrice(forecast.support, d)}`}
        sub="30d low − 1.5%"
        tone="neutral"
      />
      <Tile
        icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
        label="Resistance Level"
        value={`$${fmtPrice(forecast.resistance, d)}`}
        sub="30d high + 1.5%"
        tone="neutral"
      />
      <Tile
        icon={<Gauge className="h-4 w-4 text-amber-400" />}
        label="Ann. Volatility"
        value={`${forecast.annVol.toFixed(1)}%`}
        sub={`Sharpe ${forecast.sharpe.toFixed(2)}`}
        tone="neutral"
      />
      <Tile
        icon={<Sigma className="h-4 w-4 text-slate-400" />}
        label="Beta"
        value={forecast.beta.toFixed(2)}
        sub="vs market"
        tone="neutral"
      />
      <Tile
        icon={<Target className="h-4 w-4 text-violet-400" />}
        label="7D Confidence Band"
        value={`$${fmtPrice(forecast.ci7[0], d)}`}
        sub={`– $${fmtPrice(forecast.ci7[1], d)}`}
        tone="neutral"
      />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'up' | 'down' | 'neutral';
}) {
  const subColor =
    tone === 'up'
      ? 'text-emerald-400'
      : tone === 'down'
        ? 'text-rose-400'
        : 'text-slate-500';

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 transition-colors hover:border-slate-700/60">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-2 font-mono text-lg font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <p className={`mt-0.5 font-mono text-[11px] tabular-nums ${subColor}`}>
        {sub}
      </p>
    </div>
  );
}
