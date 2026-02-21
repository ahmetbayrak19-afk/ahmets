import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ⚠️ DİKKAT: Manifest dosendeki package="com.ogrenim.app" ile burası AYNI olmalı.
  appId: 'com.kazanimtakip.app', 
  appName: 'Kazanım Takip',
  webDir: 'dist',

  server: {
    // Android'in yerel dosya (balik.glb) kısıtlamalarını esnetir
    androidScheme: 'http',
    cleartext: true, // Manifest'teki usesCleartextTraffic ile el sıkışır
    allowNavigation: ['*']
  },

  // StackOverflow çözümündeki kritik ekleme
  android: {
    allowMixedContent: true
  }
};

export default config;
