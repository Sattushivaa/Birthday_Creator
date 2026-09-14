import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001'
    }
  },
  build: {
    // Output to repo-root /public: that's what the local server serves from
    // AND what Vercel publishes as its static output directory.
    outDir: '../public',
    emptyOutDir: true
  }
});