import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    host: '0.0.0.0',
    allowedHosts: ['qr4c7xc3.run.complete.dev', '9c02rdal.run.complete.dev', 'l2z1hip3.run.complete.dev', '6otgwy5w.run.complete.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3005,
    host: '0.0.0.0',
    allowedHosts: ['9c02rdal.run.complete.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
