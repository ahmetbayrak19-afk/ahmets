import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kazanimtakip.app',
  appName: 'Kazanım Takip',
  webDir: 'dist',

  // ✅ Android’de asset loading için en stabil
  server: {
    androidScheme: 'http',
  },
};

export default config;
