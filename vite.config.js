import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    // historyApiFallback: true,
    proxy: {
      '/agents': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/conversation': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/ingestion': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/retrieval': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/ai': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/users': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
})
