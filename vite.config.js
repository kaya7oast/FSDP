import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    host: true, // allow access from other containers
    proxy: {
      '/agents': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
      '/conversations': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
      '/ingestion': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
      '/retrieval': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
    },
  },
});
