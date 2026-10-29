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
- Leaderboard (`src/lib/leaderboard.js`) is a mock Supabase-style adapter over `localStorage` plus seeded rivals. Country comes from browser locale, falling back to lat/lng bounds.
- **Share run** copies an emoji summary and a `?seed=` challenge link; opening it spawns the same sparks for the same start point.
