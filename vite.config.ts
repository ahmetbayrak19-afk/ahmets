import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  base: '', // APK için en boş ve güvenli yol
  
  // 🚀 KRİTİK EKLEME: .glb dosyalarını kod sanma, olduğu gibi paketle diyoruz.
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
    assetsDir: '.', // Klasörleme yapma, her şeyi en üste koy
    cssCodeSplit: false, // CSS'i tek dosya yap
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        // Dosya isimlerinden HASH'i kaldırıyoruz.
        // Android'in dosyaları bulamama şansı kalmıyor.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
