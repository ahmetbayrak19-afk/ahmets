import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kazanimtakip.app',
  appName: 'Kazanım Takip',
  webDir: 'dist',
  server: {
    // Yerel dosyaların 'https://localhost/' üzerinden sunulmasını sağlar
    androidScheme: 'https',
  },
};

export default config;
