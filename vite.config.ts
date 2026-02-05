import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Vercel is currently configured to run `vite build`.
// Our landing page lives in ./landing-page, so we point Vite at that directory.
export default defineConfig({
  root: resolve(__dirname, 'landing-page'),
  build: {
    // Put the built site at repo-root/dist so Vercel can serve it.
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
