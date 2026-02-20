import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Root 'client' ise index.html mutlaka client klasörünün içinde olmalı
  root: 'client',
  // Capacitor'da beyaz ekranı çözmek için en garantisi budur
  base: '/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  build: {
    // Build çıktısını ana dizindeki dist'e atar
    outDir: '../dist',
    emptyOutDir: true,
  },
});
