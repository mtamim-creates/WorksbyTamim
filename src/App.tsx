import { useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OverviewBar from './components/OverviewBar';
import PriceChart from './components/PriceChart';
import SignalCard from './components/SignalCard';
import ForecastCards from './components/ForecastCards';
import StatsPanel from './components/StatsPanel';
import { ASSETS, getAsset } from './lib/assets';
import { buildModel } from './lib/market';
import { useLivePrice } from './lib/useLivePrice';
import type { Category } from './lib/types';

export default function App() {
  const [category, setCategory] = useState<Category>('crypto');
  const [assetId, setAssetId] = useState('BTC');
  const [range, setRange] = useState(90);

  const asset = getAsset(assetId);
  const model = useMemo(
    () => buildModel(asset, range),
    [asset, range],
  );
  const { price: livePrice } = useLivePrice(model.lastPrice);

  const selectAsset = (id: string) => setAssetId(id);
  const selectCategory = (cat: Category) => {
    setCategory(cat);
    const first = ASSETS.find((a) => a.category === cat);
    if (first) setAssetId(first.id);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-200 antialiased">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(1200px 500px at 15% -10%, rgba(34,211,238,0.07), transparent 60%), radial-gradient(1000px 500px at 85% -10%, rgba(139,92,246,0.07), transparent 60%)',
        }}
      />

      <div className="relative z-10">
        <Header />

        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:gap-6">
          {/* Sidebar */}
          <Sidebar
            assets={ASSETS}
            activeId={assetId}
            onSelect={selectAsset}
          />

          {/* Main */}
          <main className="min-w-0 flex-1 space-y-4">
            {/* Category pills (mobile) */}
            <div className="flex gap-2 lg:hidden">
              {(['gold', 'crypto', 'stocks'] as Category[]).map((c) => (
                <button
                  key={c}
                  onClick={() => selectCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize transition-all ${
                    category === c
                      ? 'bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)]'
                      : 'border border-slate-800 bg-slate-900/50 text-slate-500'
                  }`}
                >
                  {c === 'gold' ? 'Gold & Metals' : c === 'crypto' ? 'Crypto' : 'Stocks'}
                </button>
              ))}
            </div>

            <OverviewBar
              asset={asset}
              model={model}
              livePrice={livePrice}
              range={range}
              onRangeChange={setRange}
            />

            <PriceChart asset={asset} model={model} />

            {/* Signal + forecast row */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-1">
                <SignalCard
                  forecast={model.forecast}
                  reg={model.reg}
                />
              </div>
              <div className="xl:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-white">
                    Forward Targets
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    LSTM projection
                  </span>
                </div>
                <ForecastCards
                  asset={asset}
                  forecast={model.forecast}
                />
              </div>
            </div>

            <StatsPanel
              reg={model.reg}
              nn={model.nn}
              forecast={model.forecast}
              decimals={asset.decimals}
              lastPrice={model.lastPrice}
            />

            <footer className="pb-4 pt-2 text-center text-[10px] text-slate-700">
              NeuralTrend Analytics · Simulated data for demonstration ·
              Not financial advice
            </footer>
          </main>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
