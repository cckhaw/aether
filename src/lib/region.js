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

const CODES =
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS YE ZA ZM ZW'.split(' ');

/** All selectable countries as [{ code, name }], sorted by name. */
export const COUNTRIES = CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
  a.name.localeCompare(b.name)
);

const COUNTRY_KEY = 'aether.country.v1';

export function loadCountryOverride() {
  try {
    const c = localStorage.getItem(COUNTRY_KEY);
    return /^[A-Z]{2}$/.test(c || '') ? c : null;
  } catch {
    return null;
  }
}

export function saveCountryOverride(code) {
  try {
    localStorage.setItem(COUNTRY_KEY, code);
  } catch {
    /* storage unavailable */
  }
}
