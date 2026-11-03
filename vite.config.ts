import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { getVaultAllTests, getVaultTestById } from './src/services/vaultServer.ts';

function vaultProxyPlugin(): Plugin {
  return {
    name: 'vault-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        if (req.url === '/api/getAllTests' && (req.method === 'POST' || req.method === 'GET')) {
          try {
            const data = await getVaultAllTests();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Vault connection error' }));
          }
          return;
        }

        if (req.url.startsWith('/api/getTest') && (req.method === 'POST' || req.method === 'GET')) {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              let id = '';
              if (req.method === 'GET') {
                const urlObj = new URL(req.url!, 'http://localhost');
                id = urlObj.searchParams.get('id') || '';
              } else {
                const parsed = JSON.parse(body || '{}');
                id = parsed.id || '';
              }

              if (!id) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing test ID' }));
                return;
              }

              const data = await getVaultTestById(id);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to fetch test' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vaultProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
