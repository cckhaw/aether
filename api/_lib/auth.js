import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './db.js';

let jwks;
let issuer;

function config() {
  const base = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!base) throw new HttpError(503, 'Auth is not configured (NEON_AUTH_BASE_URL missing)');
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${base.replace(/\/$/, '')}/.well-known/jwks.json`));
    issuer = new URL(base).origin;
  }
  return { jwks, issuer };
}

/** Verifies the Neon Auth JWT in `Authorization: Bearer …`. Returns { id, email, name }. */
export async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Sign in required');
  const { jwks: keys, issuer: iss } = config();
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: iss });
    if (!payload.sub) throw new Error('no sub');
    return { id: String(payload.sub), email: payload.email, name: payload.name };
  } catch {
    throw new HttpError(401, 'Invalid or expired session');
  }
}
