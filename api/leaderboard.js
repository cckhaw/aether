import { ensureSchema, getSql } from './_lib/db.js';
import { route } from './_lib/http.js';
import { METRICS, SCOPES, parseCountry } from './_lib/validate.js';

// GET /api/leaderboard?scope=global|country|local&country=SG&metric=score|sparks|distance_m
export default route(['GET'], async (req) => {
  await ensureSchema();
  const scope = SCOPES.includes(req.query.scope) ? req.query.scope : 'global';
  const metric = METRICS[req.query.metric] || 'score';
  const country = parseCountry(req.query.country);

  const where = [];
  const params = [];
  if (scope === 'country') {
    params.push(country);
    where.push(`s.country = $${params.length}`);
  }
  if (scope === 'local') where.push(`s.updated_at > now() - interval '24 hours'`);

  // `metric` is whitelisted above, so interpolating the column name is safe.
  const text = `
    SELECT s.user_id AS id, p.handle, s.country, s.score, s.sparks, s.distance_m,
           extract(epoch FROM s.updated_at) * 1000 AS created_at
    FROM scores s JOIN players p USING (user_id)
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY s.${metric} DESC, s.updated_at ASC
    LIMIT 50`;
  const rows = await getSql().query(text, params);
  return {
    rows: rows.map((r, i) => ({ ...r, created_at: Number(r.created_at), rank: i + 1 })),
  };
});
