import { HttpError, ensureSchema, getSql } from './_lib/db.js';
import { requireUser } from './_lib/auth.js';
import { route } from './_lib/http.js';
import { parseCountry, parseHandle, randomHandle } from './_lib/validate.js';

const isUniqueViolation = (e) => e?.code === '23505';

async function getProfile(sql, id) {
  const [row] = await sql`
    SELECT p.user_id AS id, p.handle, p.country,
           COALESCE(s.score, 0) AS score, COALESCE(s.sparks, 0) AS sparks,
           COALESCE(s.distance_m, 0) AS distance_m
    FROM players p LEFT JOIN scores s USING (user_id)
    WHERE p.user_id = ${id}`;
  return row || null;
}

// GET  /api/me                      -> { profile | null }
// POST /api/me { handle?, country? } -> create the profile on first call, else rename / update country.
export default route(['GET', 'POST'], async (req) => {
  const user = await requireUser(req);
  await ensureSchema();
  const sql = getSql();

  if (req.method === 'GET') return { profile: await getProfile(sql, user.id) };

  const body = req.body || {};
  const existing = await getProfile(sql, user.id);
  // Only change country when the client actually sent one (a rename must not reset it).
  const country = body.country ? parseCountry(body.country) : existing?.country ?? 'XX';

  if (!existing) {
    // First sign-in: honour the handle the player already had as a guest if it's free.
    let wanted;
    try {
      wanted = body.handle ? parseHandle(body.handle) : randomHandle();
    } catch {
      wanted = randomHandle();
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await sql`INSERT INTO players (user_id, handle, country) VALUES (${user.id}, ${wanted}, ${country})`;
        break;
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
        if (e.constraint && !e.constraint.includes('handle')) break; // raced on user_id: already created
        wanted = randomHandle();
      }
    }
    return { profile: await getProfile(sql, user.id) };
  }

  if (body.handle && body.handle !== existing.handle) {
    const handle = parseHandle(body.handle);
    try {
      await sql`UPDATE players SET handle = ${handle}, country = ${country} WHERE user_id = ${user.id}`;
    } catch (e) {
      if (isUniqueViolation(e)) throw new HttpError(409, 'That handle is taken');
      throw e;
    }
  } else if (country !== existing.country) {
    await sql`UPDATE players SET country = ${country} WHERE user_id = ${user.id}`;
  }
  if (country !== existing.country) {
    // Country leaderboards read scores.country, so move the player's existing scores too.
    await sql`UPDATE scores SET country = ${country} WHERE user_id = ${user.id}`;
  }
  return { profile: await getProfile(sql, user.id) };
});
