# Aether Drop

A GPS browser game prototype. Walk outdoors, collect nearby **Aether Sparks**, and climb anonymous global / country / local leaderboards.

Stack: React 18 · Vite · Leaflet (`react-leaflet`) · Tailwind CSS · Web Audio API · Lucide.

## Run

```bash
npm install
npm run dev
```

Geolocation requires a secure context: `localhost` works on desktop; on a phone use an HTTPS tunnel (e.g. `npx localtunnel --port 5173`) or deploy the `npm run build` output.
No GPS (desktop)? Tap **Demo mode** for an on-screen D-pad that moves you 10 m per tap.

## How it plays

- Sparks (5–8) spawn 25–120 m around you at start and each time you move >50 m from the last spawn point.
- Within 15 m (Haversine) a spark turns cyan, the phone vibrates, and **Harvest** lights up. Gold-ish rare sparks are worth 25.
- Handle is `@Wanderer_XXXX` from a persistent `localStorage` UUID; tap the pencil in Ranks to rename.
- Accounts: sign in with Google or an emailed code (Neon Auth). Your handle is unique, editable from Ranks, and your scores follow you across devices. Without sign-in you play as a guest (`@Wanderer_XXXX`).
- Leaderboard: Vercel API routes (`api/`) backed by Neon Postgres. One row per player holds personal bests; scopes are Global / Country / Local 24h. Country comes from browser locale, falling back to lat/lng bounds.
- If Neon Auth isn't configured (or under plain `vite dev`), the app falls back to a localStorage demo board so it still runs.
- **Share run** copies an emoji summary and a `?seed=` challenge link; opening it spawns the same sparks for the same start point.

## Setting up accounts + the live leaderboard

1. **Database**: in Vercel, Storage → Neon → connect a database to this project. That sets `DATABASE_URL`. Tables are created automatically on the first API call (see `db/schema.sql`).
2. **Neon Auth**: in the Neon Console open the project → Auth → enable it. Copy the Auth URL (Configuration tab).
   - Set `NEON_AUTH_BASE_URL` and `VITE_NEON_AUTH_URL` to that URL in Vercel (Production).
   - Enable **Email OTP** (Settings → Better Auth → Sign-up and Sign-in with Email) and **Google**.
   - Add your production domain to Neon Auth's trusted origins/domains.
3. Redeploy so the `VITE_` variable is baked into the bundle.

See `.env.example`. API: `GET /api/leaderboard`, `GET|POST /api/me`, `POST /api/scores` (the last two require the Neon Auth JWT as a Bearer token).

Scores are submitted by the client, so they're plausibility-checked on the server but not cheat-proof.
