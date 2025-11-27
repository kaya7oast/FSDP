import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // vite.config.js
  server: {
    proxy: {
      '/agents': 'http://localhost:3000',
      '/conversations': 'http://localhost:3000',
    }
  }
})


