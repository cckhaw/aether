import { useCallback, useEffect, useRef, useState } from 'react';
import { authClient, authEnabled } from '../lib/auth.js';
import { api } from '../lib/api.js';

// Captured before the SDK strips it: true when we just came back from Google.
let returningFromOAuth =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('neon_auth_session_verifier');

/**
 * Neon Auth session + the player's profile row (handle) from /api/me.
 * status: 'loading' | 'out' | 'in'
 */
export function useAccount({ guestHandle, country }) {
  const [status, setStatus] = useState(authEnabled ? 'loading' : 'out');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const hint = useRef({ guestHandle, country });
  hint.current = { guestHandle, country };

  /** Resolves { ok: true } or { ok: false, reason } so callers can say *why* sign-in didn't stick. */
  const refresh = useCallback(async () => {
    if (!authClient) return { ok: false, reason: 'Accounts are not configured.' };
    const fail = (reason, signedOutQuietly = false) => {
      setUser(null);
      setProfile(null);
      setStatus('out');
      setError(signedOutQuietly ? '' : reason);
      return { ok: false, reason };
    };
    const wasOAuthReturn = returningFromOAuth;
    returningFromOAuth = false;
    let session;
    try {
      const res = await authClient.getSession();
      if (res.error) return fail(`Couldn’t check your session: ${res.error.message || res.error.status}`);
      session = res.data;
    } catch (e) {
      return fail(`Couldn’t reach the sign-in service: ${e.message}`);
    }
    if (!session?.session || !session?.user) {
      return fail(
        'Signed in, but this browser didn’t keep the session. If you use private browsing or block cookies for this site, allow them and try again.',
        !wasOAuthReturn
      );
    }
    try {
      setUser(session.user);
      let { profile: p } = await api('/api/me', { auth: true });
      if (!p) {
        ({ profile: p } = await api('/api/me', {
          method: 'POST',
          auth: true,
          body: { handle: hint.current.guestHandle, country: hint.current.country },
        }));
      }
      setProfile(p);
      setStatus('in');
      setError('');
      return { ok: true };
    } catch (e) {
      return fail(`Signed in, but loading your profile failed: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await authClient?.signOut();
    setUser(null);
    setProfile(null);
    setStatus('out');
  }, []);

  /** Returns an error message, or null on success. */
  const rename = useCallback(async (handle) => {
    try {
      const { profile: p } = await api('/api/me', {
        method: 'POST',
        auth: true,
        body: { handle, country: hint.current.country },
      });
      setProfile(p);
      return null;
    } catch (e) {
      return e.message;
    }
  }, []);

  return { enabled: authEnabled, status, user, profile, error, refresh, signOut, rename };
}
