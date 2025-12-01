import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy agent requests
      '/agents': {
        target: 'http://127.0.0.1:3000', // Use 127.0.0.1 to avoid localhost IPv6 issues
        changeOrigin: true,
        secure: false,
      },
      // Proxy conversation requests
      '/conversations': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      // NEW: Proxy AI requests
      '/ai': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})