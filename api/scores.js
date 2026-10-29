import { HttpError, ensureSchema, getSql } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { route } from './_lib/http.js';
import { parseCountry, parseRun } from './_lib/validate.js';

// POST /api/scores { score, sparks, distance_m, country } -> upserts the player's personal bests.
export default route(['POST'], async (req) => {
  const user = await requireUser(req);
  await ensureSchema();
  const sql = getSql();
  const run = parseRun(req.body);
  const country = parseCountry(req.body?.country);

  const [player] = await sql`SELECT 1 FROM players WHERE user_id = ${user.id}`;
  if (!player) throw new HttpError(409, 'Create your profile first');

  const [row] = await sql`
    INSERT INTO scores (user_id, country, score, sparks, distance_m)
    VALUES (${user.id}, ${country}, ${run.score}, ${run.sparks}, ${run.distance_m})
    ON CONFLICT (user_id) DO UPDATE SET
      country = EXCLUDED.country,
      score = GREATEST(scores.score, EXCLUDED.score),
      sparks = GREATEST(scores.sparks, EXCLUDED.sparks),
      distance_m = GREATEST(scores.distance_m, EXCLUDED.distance_m),
      updated_at = now()
    RETURNING score, sparks, distance_m`;
  return { best: row };
});
