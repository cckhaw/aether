-- Aether Drop schema (Neon Postgres). Also applied automatically by api/_lib/db.js.
-- user_id is the Neon Auth user id (the JWT `sub`, = neon_auth.user.id).

CREATE TABLE IF NOT EXISTS players (
  user_id    text PRIMARY KEY,
  handle     text NOT NULL,
  country    text NOT NULL DEFAULT 'XX',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS players_handle_lower_idx ON players (lower(handle));

-- One row per player: personal best of each metric.
CREATE TABLE IF NOT EXISTS scores (
  user_id     text PRIMARY KEY REFERENCES players (user_id) ON DELETE CASCADE,
  country     text NOT NULL DEFAULT 'XX',
  score       integer NOT NULL DEFAULT 0,
  sparks      integer NOT NULL DEFAULT 0,
  distance_m  integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
CREATE INDEX IF NOT EXISTS scores_country_idx ON scores (country, score DESC);
CREATE INDEX IF NOT EXISTS scores_updated_idx ON scores (updated_at DESC);
