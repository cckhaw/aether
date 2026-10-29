import { HttpError } from './db.js';

export const METRICS = { score: 'score', sparks: 'sparks', distance_m: 'distance_m' };
export const SCOPES = ['global', 'country', 'local'];

/** Returns "@Name" or throws. 3–20 chars of [A-Za-z0-9_]. */
export function parseHandle(raw) {
  const name = String(raw ?? '').replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) {
    throw new HttpError(400, 'Handle must be 3–20 letters, numbers or underscores');
  }
  return `@${name}`;
}

export function parseCountry(raw) {
  const c = String(raw ?? 'XX').toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : 'XX';
}

/**
 * Plausibility checks, not security: the game runs on the client, so a
 * determined cheater can still fake GPS. These just reject absurd payloads.
 */
export function parseRun(body) {
  const int = (v, max) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > max) throw new HttpError(400, 'Invalid run data');
    return n;
  };
  const sparks = int(body?.sparks, 5000);
  const score = int(body?.score, 125000);
  const distance_m = int(body?.distance_m, 500000);
  if (score > sparks * 25 || sparks > 16 + distance_m / 5) {
    throw new HttpError(400, 'Run rejected as implausible');
  }
  return { sparks, score, distance_m };
}

export function randomHandle() {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `@Wanderer_${hex}`;
}
