import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../',  // load .env from repo root
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    // Inline assets smaller than 4 KB
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Split vendor libs into a separate chunk — long-term cacheable
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        // Deterministic file names for better CDN caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
