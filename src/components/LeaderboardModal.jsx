import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Pencil, Send, X } from 'lucide-react';
import { fetchLeaderboard, submitScoreLive, submitScoreLocal } from '../lib/leaderboard.js';
import { sanitizeHandle } from '../lib/identity.js';
import { buildShareText, copyText } from '../lib/share.js';
import { COUNTRIES, flag } from '../lib/region.js';

const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
  { id: 'local', label: 'Local 24h' },
];
const METRICS = [
  { id: 'score', label: 'Score' },
  { id: 'sparks', label: 'Sparks' },
  { id: 'distance_m', label: 'Distance' },
];

const medal = (rank) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || rank);
const fmt = (row, metric) =>
  metric === 'distance_m' ? `${(row.distance_m / 1000).toFixed(2)} km` : row[metric];

export default function LeaderboardModal({ identity, region, run, seed, account, onRename, onCountry, onSignIn, onClose }) {
  const [tab, setTab] = useState('global');
  const [metric, setMetric] = useState('score');
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('demo');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.handle.slice(1));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchLeaderboard({ scope: tab, country: region.code, metric });
    setRows(res.rows);
    setSource(res.source);
    setLoading(false);
  }, [tab, metric, region.code]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    // Real accounts: scores only count when signed in.
    if (account.enabled && account.status !== 'in') {
      onSignIn();
      return;
    }
    setSubmitting(true);
    setNotice('');
    try {
      if (account.enabled) await submitScoreLive(run, region.code);
      else
        await submitScoreLocal({
          id: identity.id,
          handle: identity.handle,
          country: region.code,
          score: run.score,
          sparks: run.sparks,
          distance_m: Math.round(run.distanceM),
        });
      setNotice('Score submitted!');
    } catch (e) {
      setNotice(e.message || 'Could not submit score');
    }
    setSubmitting(false);
    load();
  };

  const share = async () => {
    const text = buildShareText({
      handle: identity.handle,
      sparks: run.sparks,
      score: run.score,
      distanceM: run.distanceM,
      seed,
      countryFlag: flag(region.code),
    });
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveName = async () => {
    const h = sanitizeHandle(draft);
    if (!h) return setEditing(false);
    const err = await onRename(h);
    if (err) return setNotice(err);
    setNotice('');
    setEditing(false);
  };

  return (
    <div className="absolute inset-0 z-[1000] flex items-end bg-black/50" onClick={onClose}>
      <div
        className="glass !rounded-b-none flex max-h-[88%] w-full animate-sheet-up flex-col !bg-glass-strong"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-fg/25" />
        <div className="flex items-center justify-between px-5 pt-3">
          <h2 className="text-[22px] font-bold tracking-tight">Leaderboard</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-fg/15 transition active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Identity */}
        <div className="mx-5 mt-3 flex shrink-0 items-center justify-between rounded-2xl bg-fg/[0.07] px-4 py-3">
          {editing ? (
            <div className="flex w-full items-center gap-2">
              <span className="text-fg/50">@</span>
              <input
                autoFocus
                value={draft}
                maxLength={20}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none"
              />
              <button onClick={saveName} className="text-[15px] font-semibold text-aether-blue">
                Done
              </button>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[16px] font-semibold">{identity.handle}</div>
                <div className="text-[12px] text-fg/50">
                  <label className="relative inline-flex items-center gap-1 text-aether-blue">
                    {flag(region.code)} {region.name} <ChevronDown size={12} />
                    {/* Native picker laid over the label: best UX on phones. */}
                    <select
                      aria-label="Country"
                      value={region.code}
                      onChange={async (e) => {
                        const err = await onCountry(e.target.value);
                        setNotice(err || '');
                        load();
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      {!COUNTRIES.some((c) => c.code === region.code) && (
                        <option value={region.code}>{region.name}</option>
                      )}
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {flag(c.code)} {c.name}
                        </option>
                      ))}
                    </select>
                  </label>{' '}
                  · {run.score} pts · {run.sparks} sparks
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit handle"
                className="grid h-8 w-8 place-items-center rounded-full bg-fg/10 active:scale-90"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>

        {/* Segmented controls */}
        <div className="mx-5 mt-3 flex shrink-0 rounded-xl bg-fg/10 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-[10px] py-1.5 text-[13px] font-semibold transition ${
                tab === t.id ? 'bg-fg/25 text-fg shadow' : 'text-fg/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="no-scrollbar mx-5 mt-2 flex shrink-0 gap-2 overflow-x-auto">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                metric === m.id ? 'bg-aether-blue text-on' : 'bg-fg/10 text-fg/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="no-scrollbar mt-3 min-h-[160px] flex-1 overflow-y-auto px-5">
          {loading ? (
            <div className="py-10 text-center text-[14px] text-fg/40">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-fg/40">
              No runs here yet. Submit yours to claim #1.
            </div>
          ) : (
            <ul className="divide-y divide-fg/10">
              {rows.map((r) => {
                const me = r.id === identity.id;
                return (
                  <li
                    key={r.id}
                    className={`flex items-center gap-3 py-2.5 ${me ? 'text-aether-cyan' : ''}`}
                  >
                    <span className="w-8 text-center text-[15px] font-semibold tabular-nums text-fg/70">
                      {medal(r.rank)}
                    </span>
                    <span className="text-[18px]">{flag(r.country)}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                      {r.handle}
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{fmt(r, metric)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {(notice || source === 'demo') && (
          <p className="mt-2 px-5 text-center text-[12px] text-fg/45">
            {notice || 'Offline demo board — sign-in and live rankings aren’t configured here.'}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex shrink-0 gap-3 px-5">
          <button
            onClick={submit}
            disabled={submitting || (run.sparks === 0 && (!account.enabled || account.status === 'in'))}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-aether-blue py-3.5 text-on text-[15px] font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <Send size={16} />
            {submitting
              ? 'Submitting…'
              : account.enabled && account.status !== 'in'
                ? 'Sign in to submit'
                : 'Submit score'}
          </button>
          <button
            onClick={share}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-fg/15 py-3.5 text-[15px] font-semibold transition active:scale-95"
          >
            {copied ? <Check size={16} className="text-aether-cyan" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Share run'}
          </button>
        </div>
      </div>
    </div>
  );
}
