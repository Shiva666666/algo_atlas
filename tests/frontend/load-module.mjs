import { after } from 'node:test';
import { createServer } from 'vite';

// One transform server per test process, with no HTTP/WebSocket listener.
export const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
});
after(() => server.close());
export const load = (path) => server.ssrLoadModule(`/src/features/visualizers/${path}`);
