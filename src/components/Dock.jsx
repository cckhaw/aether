import { Backpack, Radar, Trophy, Zap } from 'lucide-react';

function DockButton({ icon: Icon, label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-fg/80 transition active:scale-90 active:bg-fg/10"
    >
      <Icon size={22} strokeWidth={2} />
      <span className="text-[10px] font-medium">{label}</span>
      {children}
    </button>
  );
}

export default function Dock({ nearest, inRange, sparkCount, walked, onHarvest, onLeaderboard }) {
  const dist = nearest ? Math.round(nearest.distance) : null;
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[500] px-4"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
    >
      <div className="glass flex items-center justify-between px-3 py-2.5">
        <DockButton icon={Backpack} label={`${sparkCount} · ${(walked / 1000).toFixed(2)}km`} />

        <button
          onClick={onHarvest}
          disabled={!inRange}
          className={[
            'relative -mt-9 flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border text-[11px] font-semibold transition active:scale-90',
            inRange
              ? 'animate-floaty border-on/40 bg-gradient-to-br from-aether-cyan to-aether-blue text-aether-ink shadow-cyan'
              : 'border-fg/10 bg-fg/10 text-fg/35',
          ].join(' ')}
        >
          <Zap size={26} fill={inRange ? 'currentColor' : 'none'} strokeWidth={2.2} />
          <span className="mt-0.5">Harvest</span>
        </button>

        <div className="flex items-center gap-1">
          <DockButton icon={Radar} label={dist != null ? `${dist} m` : 'Radar'} />
          <DockButton icon={Trophy} label="Ranks" onClick={onLeaderboard} />
        </div>
      </div>
    </div>
  );
}
