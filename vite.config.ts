import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Vercel is configured to run `vite build`.
// Our frontend lives in ./landing-page, so we point Vite at that directory.
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'landing-page'),
  build: {
    // Put the built site at repo-root/dist so Vercel can serve it.
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
