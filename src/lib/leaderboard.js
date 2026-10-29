import { hashString, mulberry32 } from './geo.js';
import { api } from './api.js';
import { authEnabled } from './auth.js';

/**
 * Leaderboard adapter.
 *
 * With Neon Auth configured it talks to the real API (/api/leaderboard, /api/scores,
 * backed by Neon Postgres). Without it (or if the API is unreachable, e.g. `vite dev`)
 * it falls back to a localStorage mock plus seeded rivals so the UI still works.
 * Rows: { id, handle, country, score, sparks, distance_m, created_at, rank }
 */
const STORE_KEY = 'aether.scores.v1';
const SEED_COUNTRIES = ['SG', 'US', 'GB', 'JP', 'DE', 'AU', 'FR', 'CA', 'MY', 'BR', 'IN', 'KR'];
const SEED_NAMES = [
  'Nova', 'Drift', 'Lumen', 'Echo', 'Atlas', 'Pixel', 'Ember', 'Zenith', 'Orbit', 'Haze',
  'Cinder', 'Wisp', 'Comet', 'Tidal', 'Flux', 'Sable', 'Quill', 'Aurora', 'Vesper', 'Mirage',
];

function seededRows() {
  const rand = mulberry32(hashString('aether-seed-board'));
  return SEED_NAMES.map((n, i) => {
    const sparks = 4 + Math.floor(rand() * 60);
    return {
      id: `seed-${i}`,
      handle: `@${n}_${Math.floor(rand() * 90 + 10)}`,
      country: SEED_COUNTRIES[Math.floor(rand() * SEED_COUNTRIES.length)],
      score: sparks * 10 + Math.floor(rand() * 4) * 15,
      sparks,
      distance_m: Math.round(sparks * (60 + rand() * 90)),
      created_at: Date.now() - Math.floor(rand() * 86400000 * 3),
    };
  });
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Guest/demo submit: upsert the player's best run (one row per anonymous id). */
export async function submitScoreLocal(row) {
  await delay();
  const rows = readLocal();
  const i = rows.findIndex((r) => r.id === row.id);
  if (i >= 0) {
    if (row.score >= rows[i].score) rows[i] = { ...row, created_at: Date.now() };
    else rows[i] = { ...rows[i], handle: row.handle, country: row.country };
  } else {
    rows.push({ ...row, created_at: Date.now() });
  }
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable */
  }
  return rows.find((r) => r.id === row.id);
}

/** Signed-in submit: the server keeps each player's personal bests. */
export async function submitScoreLive(run, country) {
  return api('/api/scores', {
    method: 'POST',
    auth: true,
    body: { score: run.score, sparks: run.sparks, distance_m: Math.round(run.distanceM), country },
  });
}

/** scope: 'global' | 'country' | 'local'. Returns { rows, source: 'live' | 'demo' }. */
export async function fetchLeaderboard({ scope, country, metric = 'score' }) {
  if (authEnabled) {
    try {
      const qs = new URLSearchParams({ scope, country, metric });
      const { rows } = await api(`/api/leaderboard?${qs}`);
      return { rows, source: 'live' };
    } catch {
      /* fall through to the local mock */
    }
  }
  return { rows: await fetchMock({ scope, country, metric }), source: 'demo' };
}

async function fetchMock({ scope, country, metric }) {
  await delay(150);
  const mine = readLocal();
  const ids = new Set(mine.map((r) => r.id));
  let rows = [...seededRows().filter((r) => !ids.has(r.id)), ...mine];
  if (scope === 'country') rows = rows.filter((r) => r.country === country);
  if (scope === 'local') {
    // "Local" = the last 24h of runs, ranked by sparks / distance.
    const cutoff = Date.now() - 86400000;
    rows = rows.filter((r) => r.created_at >= cutoff);
  }
  return rows
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, 50)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
