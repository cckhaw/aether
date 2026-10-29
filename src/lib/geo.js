const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;

export const HARVEST_RADIUS_M = 15;
export const RESPAWN_DISTANCE_M = 50;

/** Great-circle distance in meters between two {lat, lng} points. */
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Offset a point by meters north/east. */
export function offsetPoint(origin, northM, eastM) {
  const dLat = northM / EARTH_RADIUS_M;
  const dLng = eastM / (EARTH_RADIUS_M * Math.cos(toRad(origin.lat)));
  return {
    lat: origin.lat + (dLat * 180) / Math.PI,
    lng: origin.lng + (dLng * 180) / Math.PI,
  };
}

/** Small deterministic PRNG so challenge seeds reproduce the same sparks. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Spawn 5–8 sparks in a tight ring (25–120 m) around `origin`.
 * Same seed + origin + wave => same sparks.
 */
export function spawnSparks(origin, seed, wave) {
  const rand = mulberry32(
    hashString(`${seed}|${origin.lat.toFixed(4)}|${origin.lng.toFixed(4)}|${wave}`)
  );
  const count = 5 + Math.floor(rand() * 4);
  return Array.from({ length: count }, (_, i) => {
    const angle = rand() * Math.PI * 2;
    const dist = 25 + rand() * 95;
    const pos = offsetPoint(origin, Math.cos(angle) * dist, Math.sin(angle) * dist);
    return { id: `${wave}-${i}`, ...pos, value: rand() < 0.15 ? 25 : 10 };
  });
}
