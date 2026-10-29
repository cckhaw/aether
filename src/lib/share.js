export function buildShareText({ handle, sparks, score, distanceM, seed, countryFlag }) {
  const bar = '✨'.repeat(Math.min(sparks, 10)) + '·'.repeat(Math.max(0, 10 - sparks));
  const km = (distanceM / 1000).toFixed(2);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('seed', seed);
  return [
    `🌌 Aether Drop ${countryFlag}`,
    `${handle}`,
    bar,
    `⚡ ${score} pts · 💎 ${sparks} sparks · 👟 ${km} km`,
    `Beat my run: ${url.toString()}`,
  ].join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      /* ignore */
    }
    ta.remove();
    return ok;
  }
}

export function getSeed() {
  const fromUrl = new URLSearchParams(window.location.search).get('seed');
  if (fromUrl) return fromUrl.slice(0, 24);
  return Math.random().toString(36).slice(2, 8);
}
