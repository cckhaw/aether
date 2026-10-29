import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FlaskConical, LogOut } from 'lucide-react';

const STEP_M = 10;

/** Status banner + on-screen D-pad for when real GPS isn't available. */
export default function DemoControls({ status, demo, onEnter, onExit, onNudge, onRetry }) {
  if (demo) {
    const btn =
      'glass grid h-12 w-12 place-items-center !rounded-2xl transition active:scale-90 active:bg-fg/20';
    return (
      <div className="absolute bottom-[140px] left-4 z-[500] grid grid-cols-3 gap-1.5">
        <span />
        <button className={btn} aria-label="North" onClick={() => onNudge(STEP_M, 0)}>
          <ArrowUp size={20} />
        </button>
        <span />
        <button className={btn} aria-label="West" onClick={() => onNudge(0, -STEP_M)}>
          <ArrowLeft size={20} />
        </button>
        <button className={btn} aria-label="Exit demo" onClick={onExit}>
          <LogOut size={18} />
        </button>
        <button className={btn} aria-label="East" onClick={() => onNudge(0, STEP_M)}>
          <ArrowRight size={20} />
        </button>
        <span />
        <button className={btn} aria-label="South" onClick={() => onNudge(-STEP_M, 0)}>
          <ArrowDown size={20} />
        </button>
        <span />
      </div>
    );
  }

  if (status === 'tracking') return null;

  const blocked = status === 'denied' || status === 'unsupported';
  return (
    <div className="absolute inset-x-4 top-[150px] z-[500]">
      <div className="glass px-5 py-4 text-center">
        <div className="text-[15px] font-semibold">
          {blocked ? 'Location access needed' : 'Finding your position…'}
        </div>
        <p className="mt-1 text-[13px] text-fg/60">
          {blocked
            ? 'Enable location for this site in your browser settings, then retry.'
            : 'Step outside for the best signal, or try the demo.'}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          {blocked && (
            <button
              onClick={onRetry}
              className="rounded-full bg-aether-blue px-4 py-2 text-on text-[14px] font-semibold active:scale-95"
            >
              Retry
            </button>
          )}
          <button
            onClick={onEnter}
            className="flex items-center gap-1.5 rounded-full bg-fg/15 px-4 py-2 text-[14px] font-semibold active:scale-95"
          >
            <FlaskConical size={14} /> Demo mode
          </button>
        </div>
      </div>
    </div>
  );
}
