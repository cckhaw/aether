import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authUrl = env.VITE_NEON_AUTH_URL;
  const target = authUrl && new URL(authUrl);

  return {
    plugins: [react()],
    server: {
      host: true,
      // Mirrors the /neon-auth rewrite in vercel.json so sessions are first-party in dev too.
      proxy: target
        ? {
            '/neon-auth': {
              target: target.origin,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/neon-auth/, target.pathname.replace(/\/$/, '')),
              // Neon only trusts configured origins; present the production one when proxying from localhost.
              configure: (proxy) =>
                proxy.on('proxyReq', (req) => {
                  if (env.NEON_AUTH_DEV_ORIGIN) req.setHeader('origin', env.NEON_AUTH_DEV_ORIGIN);
                }),
            },
          }
        : undefined,
    },
  };
});
