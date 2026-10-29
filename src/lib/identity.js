const KEY = 'aether.identity.v1';

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function sanitizeHandle(raw) {
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
  return cleaned ? `@${cleaned}` : '';
}

export function loadIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.id && saved?.handle) return saved;
  } catch {
    /* fall through */
  }
  const id = uuid();
  const identity = { id, handle: `@Wanderer_${id.replace(/-/g, '').slice(0, 4).toUpperCase()}` };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    /* storage unavailable */
  }
}
