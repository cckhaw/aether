import { createAuthClient } from '@neondatabase/neon-js/auth';

/** Auth is "enabled" when the Neon Auth URL was provided at build time. */
export const authEnabled = !!import.meta.env.VITE_NEON_AUTH_URL;

/**
 * The client talks to /neon-auth on *our own origin* (rewritten to Neon Auth by vercel.json /
 * the Vite dev proxy). That keeps the session cookie first-party; calling Neon's domain directly
 * makes it a third-party cookie, which Safari, Brave and strict Chrome settings block.
 */
export const authClient = authEnabled
  ? createAuthClient(`${window.location.origin}/neon-auth`, {
      fetchOptions: { credentials: 'include' },
    })
  : null;

/**
 * Short-lived (15 min) JWT the API routes verify against Neon Auth's JWKS.
 * In the browser the SDK serves `token()` from the session cache, so the JWT arrives as
 * `data.session.token` (copied from the `set-auth-jwt` header), not `data.token`.
 */
export async function getToken() {
  if (!authClient) return null;
  const { data, error } = await authClient.token();
  if (error) return null;
  return data?.token ?? data?.session?.token ?? null;
}
