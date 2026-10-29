import { useCallback, useEffect, useRef, useState } from 'react';
import { authClient, authEnabled } from '../lib/auth.js';
import { api } from '../lib/api.js';

/**
 * Neon Auth session + the player's profile row (handle) from /api/me.
 * status: 'loading' | 'out' | 'in'
 */
export function useAccount({ guestHandle, country }) {
  const [status, setStatus] = useState(authEnabled ? 'loading' : 'out');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const hint = useRef({ guestHandle, country });
  hint.current = { guestHandle, country };

  const refresh = useCallback(async () => {
    if (!authClient) return;
    try {
      const { data } = await authClient.getSession();
      if (!data?.session || !data?.user) {
        setUser(null);
        setProfile(null);
        setStatus('out');
        return;
      }
      setUser(data.user);
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
    } catch {
      setStatus('out');
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

  return { enabled: authEnabled, status, user, profile, refresh, signOut, rename };
}
