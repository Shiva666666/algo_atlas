import { after } from 'node:test';
import { createServer } from 'vite';

// One transform server per test process, with no HTTP/WebSocket listener.
export const server = await createServer({
  configFile: false,
  // SSR tests do not need client prebundles. Parallel workers must not race to
  // rename the same Windows dependency cache after a tooling update.
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
});
after(() => server.close());
export const load = (path) => server.ssrLoadModule(`/src/features/visualizers/${path}`);
