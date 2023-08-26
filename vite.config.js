import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  root: './gui/',
  publicDir: 'public/',
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  build: {
    minify: 'esbuild',
    ssr: false,
    target: 'es6',
    reportCompressedSize: true,
    outDir: 'build',
  },
  plugins: [
    react({
      include: 'gui/src/**/*.jsx', // This includes all the .jsx files under src correctly
    }),
  ],
})
