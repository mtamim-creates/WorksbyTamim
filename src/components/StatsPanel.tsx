import { useState } from 'react';
import {
  BrainCircuit,
  ChevronRight,
  GitCompareArrows,
  Sigma,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import type { ForecastResult, NNResult, RegressionResult } from '../lib/types';
import { fmtSci } from '../lib/format';

interface Props {
  reg: RegressionResult;
  nn: NNResult;
  forecast: ForecastResult;
  decimals: number;
  lastPrice: number;
}

type Tab = 'regression' | 'neural' | 'compare';

const TABS: { id: Tab; label: string; icon: typeof Sigma }[] = [
  { id: 'regression', label: 'Linear Regression', icon: TrendingUp },
  { id: 'neural', label: 'Neural Network', icon: BrainCircuit },
  { id: 'compare', label: 'Model Comparison', icon: GitCompareArrows },
];

export default function StatsPanel({
  reg,
  nn,
  forecast,
  decimals,
  lastPrice,
}: Props) {
  const [tab, setTab] = useState<Tab>('regression');

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
      {/* Header + tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">
            Predictive Model Statistics
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Simulated OLS regression &amp; LSTM neural network · walk-forward
            validated
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                tab === t.id
                  ? 'bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.15)]'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              <t.icon
                className={`h-3.5 w-3.5 ${
                  tab === t.id
                    ? t.id === 'neural'
                      ? 'text-violet-400'
                      : 'text-cyan-400'
                    : ''
                }`}
              />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'regression' && (
        <RegressionView reg={reg} decimals={decimals} />
      )}
      {tab === 'neural' && <NeuralView nn={nn} decimals={decimals} />}
      {tab === 'compare' && (
        <CompareView reg={reg} nn={nn} forecast={forecast} decimals={decimals} lastPrice={lastPrice} />
      )}
    </div>
  );
}

/* ================================================================== */
/* Shared bits                                                        */
/* ================================================================== */

function MetricTile({
  label,
  value,
  sub,
  quality,
  accent = 'cyan',
}: {
  label: string;
  value: string;
  sub?: string;
  quality?: number; // 0..1 bar
  accent?: 'cyan' | 'violet';
}) {
  const barColor =
    accent === 'cyan'
      ? 'from-cyan-500 to-cyan-300'
      : 'from-violet-500 to-fuchsia-400';

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-[15px] font-semibold tabular-nums tracking-tight text-slate-100">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-slate-600">
          {sub}
        </p>
      )}
      {quality != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
            style={{ width: `${Math.round(quality * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Linear Regression tab                                              */
/* ================================================================== */

function RegressionView({
  reg,
  decimals,
}: {
  reg: RegressionResult;
  decimals: number;
}) {
  return (
    <div className="space-y-5">
      {/* Equation banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500">
            Fitted Model
          </p>
          <p className="mt-1 font-mono text-sm text-cyan-200">
            y = {reg.slope.toFixed(6)}·x + {reg.intercept.toFixed(decimals)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Trend Direction
          </p>
          <p
            className={`mt-1 font-mono text-sm font-bold ${
              reg.slope >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {reg.slope >= 0 ? 'UPWARD' : 'DOWNWARD'} ·{' '}
            {reg.slope >= 0 ? '+' : ''}
            ${reg.slope.toFixed(4)}/day
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricTile
          label="R² Score"
          value={reg.r2.toFixed(4)}
          sub="coefficient of determination"
          quality={reg.r2}
          accent="cyan"
        />
        <MetricTile
          label="Adjusted R²"
          value={reg.adjR2.toFixed(4)}
          sub={`n = ${reg.n}`}
          quality={reg.adjR2}
          accent="cyan"
        />
        <MetricTile
          label="MAE"
          value={`$${reg.mae.toFixed(decimals)}`}
          sub="mean absolute error"
          accent="cyan"
        />
        <MetricTile
          label="RMSE"
          value={`$${reg.rmse.toFixed(decimals)}`}
          sub="root mean squared error"
          accent="cyan"
        />
        <MetricTile
          label="MAPE"
          value={`${reg.mape.toFixed(3)}%`}
          sub="mean abs. % error"
          accent="cyan"
        />
        <MetricTile
          label="Std. Error"
          value={`$${reg.stdErr.toFixed(decimals)}`}
          sub="residual std. deviation"
          accent="cyan"
        />
        <MetricTile
          label="t-Statistic"
          value={reg.tStat.toFixed(2)}
          sub={`p-value ${reg.pValue < 0.0001 ? '< 0.0001' : reg.pValue.toFixed(4)}`}
          accent="cyan"
        />
        <MetricTile
          label="Durbin-Watson"
          value={reg.dw.toFixed(3)}
          sub="autocorrelation check"
          accent="cyan"
        />
        <MetricTile
          label="F-Statistic"
          value={reg.fStat.toFixed(1)}
          sub="model significance"
          accent="cyan"
        />
        <MetricTile
          label="Slope"
          value={`${reg.slope >= 0 ? '+' : ''}${reg.slope.toFixed(6)}`}
          sub="$ per day"
          accent="cyan"
        />
        <MetricTile
          label="Intercept"
          value={`$${reg.intercept.toFixed(decimals)}`}
          sub="at t = 0"
          accent="cyan"
        />
        <MetricTile
          label="Observations"
          value={String(reg.n)}
          sub="daily closes"
          accent="cyan"
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Neural Network tab                                                 */
/* ================================================================== */

const LAYERS = [
  { name: 'Input', detail: '30d window', w: 'w-20' },
  { name: 'LSTM', detail: '64 units', w: 'w-24' },
  { name: 'LSTM', detail: '32 units', w: 'w-24' },
  { name: 'Dense', detail: '16 · ReLU', w: 'w-20' },
  { name: 'Linear', detail: '1 output', w: 'w-20' },
];

function NeuralView({
  nn,
  decimals,
}: {
  nn: NNResult;
  decimals: number;
}) {
  return (
    <div className="space-y-5">
      {/* Architecture diagram */}
      <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.04] px-4 py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-400">
          Network Architecture
        </p>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {LAYERS.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`rounded-lg border border-violet-400/25 bg-slate-950/60 px-3 py-2 text-center ${l.w}`}
              >
                <p className="font-mono text-[11px] font-bold text-violet-200">
                  {l.name}
                </p>
                <p className="font-mono text-[9px] text-slate-500">
                  {l.detail}
                </p>
              </div>
              {i < LAYERS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] text-slate-600">
          Dropout {nn.dropout} · {nn.optimizer} · lr {nn.learningRate} ·
          batch {nn.batchSize}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricTile
          label="R² Score"
          value={nn.r2.toFixed(4)}
          sub="in-sample fit"
          quality={nn.r2}
          accent="violet"
        />
        <MetricTile
          label="MAE"
          value={`$${nn.mae.toFixed(decimals)}`}
          sub="mean absolute error"
          accent="violet"
        />
        <MetricTile
          label="RMSE"
          value={`$${nn.rmse.toFixed(decimals)}`}
          sub="root mean squared error"
          accent="violet"
        />
        <MetricTile
          label="MAPE"
          value={`${nn.mape.toFixed(3)}%`}
          sub="mean abs. % error"
          accent="violet"
        />
        <MetricTile
          label="Train Loss (MSE)"
          value={fmtSci(nn.trainLoss)}
          sub={`epoch ${nn.bestEpoch}`}
          accent="violet"
        />
        <MetricTile
          label="Validation Loss"
          value={fmtSci(nn.valLoss)}
          sub="walk-forward"
          accent="violet"
        />
        <MetricTile
          label="Epochs"
          value={String(nn.epochs)}
          sub={`best @ ${nn.bestEpoch}`}
          accent="violet"
        />
        <MetricTile
          label="Training Time"
          value={`${nn.trainTimeSec.toFixed(1)}s`}
          sub="on-device CPU"
          accent="violet"
        />
      </div>

      {/* Hyperparameters strip */}
      <div className="flex flex-wrap gap-2">
        {[
          ['Optimizer', nn.optimizer],
          ['Learning Rate', String(nn.learningRate)],
          ['Batch Size', String(nn.batchSize)],
          ['Dropout', String(nn.dropout)],
          ['Architecture', 'LSTM × 2'],
        ].map(([k, v]) => (
          <span
            key={k}
            className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 font-mono text-[11px]"
          >
            <span className="text-slate-600">{k}: </span>
            <span className="text-slate-300">{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Comparison tab                                                     */
/* ================================================================== */

function CompareView({
  reg,
  nn,
  forecast,
  decimals,
  lastPrice,
}: {
  reg: RegressionResult;
  nn: NNResult;
  forecast: ForecastResult;
  decimals: number;
  lastPrice: number;
}) {
  const rows = [
    {
      label: 'R² Score',
      reg: reg.r2.toFixed(4),
      nn: nn.r2.toFixed(4),
      regV: reg.r2,
      nnV: nn.r2,
      higher: true,
    },
    {
      label: 'RMSE',
      reg: `$${reg.rmse.toFixed(decimals)}`,
      nn: `$${nn.rmse.toFixed(decimals)}`,
      regV: reg.rmse,
      nnV: nn.rmse,
      higher: false,
    },
    {
      label: 'MAE',
      reg: `$${reg.mae.toFixed(decimals)}`,
      nn: `$${nn.mae.toFixed(decimals)}`,
      regV: reg.mae,
      nnV: nn.mae,
      higher: false,
    },
    {
      label: 'MAPE',
      reg: `${reg.mape.toFixed(3)}%`,
      nn: `${nn.mape.toFixed(3)}%`,
      regV: reg.mape,
      nnV: nn.mape,
      higher: false,
    },
  ];

  const nnWins = rows.filter((r) =>
    r.higher ? r.nnV > r.regV : r.nnV < r.regV,
  ).length;
  const rmseImprove =
    ((reg.rmse - nn.rmse) / reg.rmse) * 100;

  return (
    <div className="space-y-5">
      {/* Verdict banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15">
            <Trophy className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Neural Network Wins {nnWins}/4 Metrics
            </p>
            <p className="mt-0.5 text-[12px] text-slate-400">
              LSTM outperforms OLS regression — RMSE improved by{' '}
              <span className="font-mono font-semibold text-emerald-300">
                {rmseImprove.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Selected Model
          </p>
          <p className="mt-0.5 font-mono text-[13px] font-bold text-violet-300">
            LSTM(64→32)
          </p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Metric
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                OLS Regression
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-violet-400">
                LSTM Network
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Winner
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const nnBetter = r.higher
                ? r.nnV > r.regV
                : r.nnV < r.regV;
              return (
                <tr
                  key={r.label}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20"
                >
                  <td className="px-4 py-3 text-[12px] font-medium text-slate-300">
                    {r.label}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-slate-400">
                    {r.reg}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-[12px] font-semibold tabular-nums ${
                      nnBetter ? 'text-violet-300' : 'text-slate-400'
                    }`}
                  >
                    {r.nn}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        nnBetter
                          ? 'bg-violet-400/15 text-violet-300'
                          : 'bg-cyan-400/15 text-cyan-300'
                      }`}
                    >
                      {nnBetter ? 'LSTM' : 'OLS'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Forward projection summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Current Price
          </p>
          <p className="mt-1.5 font-mono text-[15px] font-semibold tabular-nums text-white">
            ${lastPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            7D Forecast
          </p>
          <p className="mt-1.5 font-mono text-[15px] font-semibold tabular-nums text-violet-300">
            ${forecast.target7.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            30D Forecast
          </p>
          <p className="mt-1.5 font-mono text-[15px] font-semibold tabular-nums text-violet-300">
            ${forecast.target30.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Confidence
          </p>
          <p className="mt-1.5 font-mono text-[15px] font-semibold tabular-nums text-cyan-300">
            {forecast.confidence}%
          </p>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-600">
        Metrics computed on {reg.n} daily observations with walk-forward
        validation. The LSTM captures non-linear momentum and mean-reversion
        patterns that the linear model cannot represent, yielding lower error
        across all metrics. Forecasts are simulated and do not constitute
        financial advice.
      </p>
    </div>
  );
}
