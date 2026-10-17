import { useEffect, useState } from 'react';
import { BrainCircuit, Activity, Radio } from 'lucide-react';

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utc = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
            <BrainCircuit className="h-5.5 w-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold tracking-tight text-white">
                NeuralTrend
              </span>
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                Pro
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wide text-slate-500">
              Analytics Dashboard
            </p>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden items-center gap-2 md:flex">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="font-mono text-[13px] tabular-nums text-slate-400">
              {utc} <span className="text-slate-600">UTC</span>
            </span>
          </div>

          <div className="hidden h-5 w-px bg-slate-800 md:block" />

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Live
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 sm:flex">
            <Radio className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-slate-400">
              Models Online
            </span>
            <span className="rounded bg-violet-400/15 px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
              2/2
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
