import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './db.js';

let jwks;
let neonOrigin;

function config() {
  const base = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!base) throw new HttpError(503, 'Auth is not configured (NEON_AUTH_BASE_URL missing)');
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${base.replace(/\/$/, '')}/.well-known/jwks.json`));
    neonOrigin = new URL(base).origin;
  }
  return { jwks, neonOrigin };
}

/** Verifies the Neon Auth JWT in `Authorization: Bearer …`. Returns { id, email, name }. */
export async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Sign in required');
  const { jwks: keys, neonOrigin: neon } = config();
  // The browser reaches Neon Auth through our own /neon-auth rewrite, so the token's issuer may be
  // either Neon's origin or ours. The signature is still checked against Neon's JWKS either way.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const issuers = host ? [neon, `https://${host}`, `http://${host}`] : [neon];
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: issuers });
    if (!payload.sub) throw new Error('no sub');
    return { id: String(payload.sub), email: payload.email, name: payload.name };
  } catch {
    throw new HttpError(401, 'Invalid or expired session');
  }
}
