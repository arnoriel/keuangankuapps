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
  },
};

export default config;
