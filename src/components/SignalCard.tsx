import { BrainCircuit, TrendingUp, Scale } from 'lucide-react';
import type { ForecastResult, RegressionResult } from '../lib/types';

interface Props {
  forecast: ForecastResult;
  reg: RegressionResult;
}

const SIGNAL_COLORS: Record<string, string> = {
  'STRONG BUY': '#34d399',
  BUY: '#6ee7b7',
  NEUTRAL: '#fbbf24',
  SELL: '#fca5a5',
  'STRONG SELL': '#f87171',
};

export default function SignalCard({ forecast, reg }: Props) {
  const score = forecast.signalScore; // -100..100
  const pct = (score + 100) / 2; // 0..100 along the arc
  const angle = 180 - pct * 1.8; // degrees from positive x-axis
  const rad = (angle * Math.PI) / 180;
  const cx = 100;
  const cy = 104;
  const r = 82;
  const nx = cx + r * Math.cos(rad);
  const ny = cy - r * Math.sin(rad);

  const color = SIGNAL_COLORS[forecast.signal];
  const regBullish = reg.slope > 0;
  const nnBullish = forecast.return30 > 0;
  const agree = regBullish === nnBullish;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-white">
          Model Signal
        </h3>
        <span
          className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${color}1a`,
            color,
            border: `1px solid ${color}44`,
          }}
        >
          {forecast.signal}
        </span>
      </div>

      {/* Gauge */}
      <div className="relative mx-auto mt-2 w-full max-w-[240px]">
        <svg viewBox="0 0 200 118" className="w-full">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d="M 18 104 A 82 82 0 0 1 182 104"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Progress */}
          <path
            d="M 18 104 A 82 82 0 0 1 182 104"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${Math.max(pct, 1.5)} 100`}
          />

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill="#0b101c" stroke="#e2e8f0" strokeWidth="2.5" />

          {/* End labels */}
          <text x="14" y="116" fill="#475569" fontSize="8" fontFamily="JetBrains Mono, monospace">
            BEARISH
          </text>
          <text x="186" y="116" fill="#475569" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono, monospace">
            BULLISH
          </text>
        </svg>

        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {forecast.return30 >= 0 ? '+' : ''}
            {forecast.return30.toFixed(2)}%
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            30d expected return
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Prediction confidence</span>
          <span className="font-mono font-semibold tabular-nums text-cyan-300">
            {forecast.confidence}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
            style={{ width: `${forecast.confidence}%` }}
          />
        </div>
      </div>

      {/* Model consensus */}
      <div className="mt-5 space-y-2 border-t border-slate-800/70 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
          Model Consensus
        </p>
        <ConsensusRow
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Linear Regression"
          value={regBullish ? 'Bullish' : 'Bearish'}
          detail={`slope ${reg.slope >= 0 ? '+' : ''}$${reg.slope.toFixed(4)}/day`}
          tone={regBullish ? 'up' : 'down'}
        />
        <ConsensusRow
          icon={<BrainCircuit className="h-3.5 w-3.5" />}
          label="Neural Network (LSTM)"
          value={nnBullish ? 'Bullish' : 'Bearish'}
          detail={`30d target ${forecast.return30 >= 0 ? '+' : ''}${forecast.return30.toFixed(2)}%`}
          tone={nnBullish ? 'up' : 'down'}
        />
        <div className="flex items-center gap-2 pt-1 text-[11px]">
          <Scale className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-500">Agreement:</span>
          <span
            className={`font-mono font-semibold ${
              agree ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {agree ? 'ALIGNED' : 'DIVERGENT'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConsensusRow({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'up' | 'down';
}) {
  const toneColor = tone === 'up' ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={toneColor}>{icon}</span>
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <p className={`font-mono text-[11px] font-bold ${toneColor}`}>{value}</p>
        <p className="font-mono text-[10px] tabular-nums text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}
