import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kazanimtakip.app',
  appName: 'Kazanım Takip',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
