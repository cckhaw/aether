// Coarse lat/lng bounding boxes -> ISO country. Locale is preferred; this is the fallback.
const BOUNDS = [
  { code: 'SG', name: 'Singapore', box: [1.15, 1.48, 103.6, 104.1] },
  { code: 'MY', name: 'Malaysia', box: [0.8, 7.4, 99.6, 119.3] },
  { code: 'GB', name: 'United Kingdom', box: [49.8, 60.9, -8.7, 1.8] },
  { code: 'JP', name: 'Japan', box: [24, 46, 122.9, 146] },
  { code: 'AU', name: 'Australia', box: [-44, -10, 112, 154] },
  { code: 'DE', name: 'Germany', box: [47.2, 55.1, 5.8, 15.1] },
  { code: 'FR', name: 'France', box: [42.3, 51.1, -5.2, 8.3] },
  { code: 'CA', name: 'Canada', box: [41.6, 83.1, -141, -52.6] },
  { code: 'US', name: 'United States', box: [24.4, 49.4, -125, -66.9] },
];

const NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code) {
  try {
    return NAMES.of(code) || code;
  } catch {
    return code;
  }
}

export function flag(code) {
  if (!/^[A-Z]{2}$/.test(code)) return '🌍';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function detectRegion(pos) {
  const lang = navigator.languages?.[0] || navigator.language || '';
  const fromLocale = lang.split('-')[1]?.toUpperCase();
  if (fromLocale && /^[A-Z]{2}$/.test(fromLocale)) {
    return { code: fromLocale, name: countryName(fromLocale), source: 'locale' };
  }
  if (pos) {
    const hit = BOUNDS.find(
      ({ box: [s, n, w, e] }) => pos.lat >= s && pos.lat <= n && pos.lng >= w && pos.lng <= e
    );
    if (hit) return { code: hit.code, name: hit.name, source: 'gps' };
  }
  return { code: 'XX', name: 'Earth', source: 'default' };
}
