import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  
  // 🟢 1. KRİTİK HAMLE: Burayı BOŞ bırakıyoruz. (Giriş Ekranı DÜZELECEK)
  base: '', 

  // 🟢 2. KRİTİK HAMLE: .glb dosyalarını tanıması için izin veriyoruz.
  assetsInclude: ['**/*.glb'],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
        
