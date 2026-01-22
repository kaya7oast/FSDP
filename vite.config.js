import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/agents': {
        target: 'http://127.0.0.1:4001',
        changeOrigin: true,
        secure: false,
      },
      '/conversations': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/ingestion': {
        target: 'http://127.0.0.1:4006', // Use port 4006 from your app.js
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ingestion/, '') // This turns /ingestion/upload into /upload/
      },
      '/retrieve': {
        target: 'http://127.0.0.1:4005',
        changeOrigin : true,
        secure: false,
      },
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