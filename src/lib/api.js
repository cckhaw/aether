import { getToken } from './auth.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getToken();
    if (!token) throw new ApiError(401, 'Sign in required');
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON (e.g. vite dev has no /api) */
  }
  if (!res.ok) throw new ApiError(res.status, json?.error || `Request failed (${res.status})`);
  return json;
}
