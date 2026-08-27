import {copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import { sites } from '@openai/sites-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [react(), sites(), {
    name:'algo-atlas-static-worker',
    apply:'build',
    async closeBundle(){
      const output=resolve('dist','server');
      await mkdir(output,{recursive:true});
      await copyFile(resolve('server','index.js'),resolve(output,'index.js'));
    },
  }],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: { outDir: 'dist', sourcemap: true },
});
