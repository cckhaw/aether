import { neon } from '@neondatabase/serverless';

let sql;
let ready;

export function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new HttpError(503, 'Database is not configured (DATABASE_URL missing)');
    sql = neon(url);
  }
  return sql;
}

/** Idempotent schema bootstrap, once per warm instance. Mirrors db/schema.sql. */
export function ensureSchema() {
  if (!ready) {
    const q = getSql();
    ready = q
      .transaction([
        q`CREATE TABLE IF NOT EXISTS players (
          user_id text PRIMARY KEY,
          handle text NOT NULL,
          country text NOT NULL DEFAULT 'XX',
          created_at timestamptz NOT NULL DEFAULT now())`,
        q`CREATE UNIQUE INDEX IF NOT EXISTS players_handle_lower_idx ON players (lower(handle))`,
        q`CREATE TABLE IF NOT EXISTS scores (
          user_id text PRIMARY KEY REFERENCES players (user_id) ON DELETE CASCADE,
          country text NOT NULL DEFAULT 'XX',
          score integer NOT NULL DEFAULT 0,
          sparks integer NOT NULL DEFAULT 0,
          distance_m integer NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now())`,
        q`CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC)`,
        q`CREATE INDEX IF NOT EXISTS scores_country_idx ON scores (country, score DESC)`,
        q`CREATE INDEX IF NOT EXISTS scores_updated_idx ON scores (updated_at DESC)`,
      ])
      .catch((err) => {
        ready = undefined;
        throw err;
      });
  }
  return ready;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
