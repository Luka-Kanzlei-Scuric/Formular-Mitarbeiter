import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // Falls du lokal testest
    strictPort: true
  },
  build: {
    outDir: 'dist'
  },
  base: '/',  // Stellt sicher, dass Routen korrekt funktionieren
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})