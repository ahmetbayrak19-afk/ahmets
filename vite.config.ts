import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  
  // 🟢 ÖNEMLİ: Android'de dosya yollarının başına '.' koyarak çalışmasını sağlar.
  base: '', 

  // Not: 'assetsInclude' satırını sildik çünkü artık public klasörünü kullanıyoruz.
  // Vite, public klasöründeki her şeyi otomatik olarak ana dizine kopyalar.

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets', // Klasör düzeni standart kalsın
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        // 🚀 Dosya isimlerini sabitleme (Hash kaldırma)
        // Bu sayede Android, 'human.glb' veya script dosyalarını her zaman bulur.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
