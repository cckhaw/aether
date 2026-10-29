// Same-origin proxy to Neon Auth, so the session cookie is first-party to this site.
// (A plain vercel.json rewrite forwards our Host header, which Neon rejects with INVALID_HOSTNAME.)
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-encoding',
  'content-length',
  'set-cookie',
]);
const FORWARD_REQUEST_HEADERS = [
  'cookie',
  'content-type',
  'accept',
  'accept-language',
  'authorization',
  'origin',
  'referer',
  'user-agent',
  'x-neon-client-info',
];

function fail(res, status, error) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error }));
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') return req.body;
    return JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  const base = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!base) return fail(res, 503, 'Auth is not configured (NEON_AUTH_BASE_URL missing)');

  const { path, ...query } = req.query || {};
  const segments = [].concat(path || []);
  if (segments.some((s) => s === '.' || s === '..' || s.includes('/'))) {
    return fail(res, 400, 'Bad path');
  }
  const url = new URL(`${base.replace(/\/$/, '')}/${segments.map(encodeURIComponent).join('/')}`);
  for (const [k, v] of Object.entries(query)) {
    for (const val of [].concat(v)) url.searchParams.append(k, val);
  }

  const headers = {};
  for (const name of FORWARD_REQUEST_HEADERS) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }

  let upstream;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: await readBody(req),
      redirect: 'manual', // pass redirects (e.g. to Google) back to the browser untouched
    });
  } catch {
    return fail(res, 502, 'Could not reach the sign-in service');
  }

  res.statusCode = upstream.status;
  for (const [name, value] of upstream.headers) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) res.setHeader(name, value);
  }
  // Cookies must belong to this site: drop any Domain attribute Neon sets.
  const cookies = upstream.headers.getSetCookie().map((c) => c.replace(/;\s*Domain=[^;]*/i, ''));
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(await upstream.arrayBuffer()));
}
