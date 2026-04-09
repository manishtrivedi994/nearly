import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../',  // load .env from repo root
  server: {
    // Proxy /api to the backend in dev so VITE_API_BASE_URL can be left empty
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
