import { Gem, Locate, Navigation, Satellite, UserRound } from 'lucide-react';

const STATUS = {
  locating: { label: 'Acquiring GPS…', tone: 'text-aether-gold' },
  tracking: { label: 'GPS locked', tone: 'text-aether-cyan' },
  demo: { label: 'Demo mode', tone: 'text-aether-blue' },
  denied: { label: 'Location blocked', tone: 'text-red-400' },
  unsupported: { label: 'No GPS support', tone: 'text-red-400' },
};

export default function HUD({ handle, signedIn, onAccount, score, sparkCount, status, accuracy, follow, onRecenter }) {
  const s = STATUS[status] || STATUS.locating;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-col gap-2 px-4"
      style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}
    >
      <div className="glass pointer-events-auto flex items-center justify-between px-5 py-3">
        <div className="min-w-0">
          <button
            onClick={onAccount}
            className="flex max-w-full items-center gap-1.5 text-[13px] font-medium text-white/60 active:opacity-60"
          >
            <UserRound size={13} className={signedIn ? 'text-aether-cyan' : ''} />
            <span className="truncate">{handle}</span>
            {!signedIn && <span className="text-aether-blue">· Sign in</span>}
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-semibold leading-none tracking-tight tabular-nums">
              {score}
            </span>
            <span className="text-[13px] font-medium text-white/50">pts</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[15px] font-semibold text-aether-gold">
          <Gem size={16} strokeWidth={2.5} />
          <span className="tabular-nums">{sparkCount}</span>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="glass pointer-events-auto flex items-center gap-2 !rounded-full px-3.5 py-2 text-[12px] font-medium">
          <Satellite size={14} className={s.tone} />
          <span className={s.tone}>{s.label}</span>
          {accuracy != null && status === 'tracking' && (
            <span className="text-white/45">±{Math.round(accuracy)}m</span>
          )}
        </div>
        <button
          onClick={onRecenter}
          aria-label="Recenter map"
          className="glass pointer-events-auto grid h-11 w-11 place-items-center !rounded-full transition active:scale-90"
        >
          {follow ? (
            <Navigation size={18} className="text-aether-blue" fill="currentColor" />
          ) : (
            <Locate size={18} className="text-white/80" />
          )}
        </button>
      </div>
    </div>
  );
}
