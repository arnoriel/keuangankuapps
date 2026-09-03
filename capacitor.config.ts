import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cobamulai.keuanganku',
  appName: 'Keuanganku',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    BiometricAuth: {
      androidTitle: 'Verifikasi Identitas',
      androidSubtitle: 'Gunakan biometrik atau PIN untuk membuka Keuanganku',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#F6F7FB',
    },
  },
};

export default config;