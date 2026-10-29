import { createAuthClient } from '@neondatabase/neon-js/auth';

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

/** null when VITE_NEON_AUTH_URL isn't set: the app then runs as guest-only with the mock leaderboard. */
export const authClient = AUTH_URL
  ? createAuthClient(AUTH_URL, { fetchOptions: { credentials: 'include' } })
  : null;

export const authEnabled = !!authClient;

/** Short-lived (15 min) JWT the API routes verify against Neon Auth's JWKS. */
export async function getToken() {
  if (!authClient) return null;
  const { data, error } = await authClient.token();
  if (error) return null;
  return data?.token ?? null;
}
