import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy agent requests
      '/agents': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy conversation requests
      '/conversations': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      // FIX: Match the "/api" prefix used by the voice assistant
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})