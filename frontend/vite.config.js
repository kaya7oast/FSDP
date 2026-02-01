import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/agents': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      },
      '/conversations': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      },
      '/ingestion': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      },
      '/retrieval': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      },
      '/ai': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      },
      '/users': {
        target: process.env.VITE_PROXY_TARGET,
        changeOrigin: true
      }
    }
  }
})
