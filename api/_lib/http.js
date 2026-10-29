import { HttpError } from './db.js';

/** Wraps a handler: method gate, JSON errors, no-store caching. */
export function route(methods, fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (!methods.includes(req.method)) throw new HttpError(405, 'Method not allowed');
      const body = await fn(req);
      res.status(200).json(body);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
    }
  };
}
