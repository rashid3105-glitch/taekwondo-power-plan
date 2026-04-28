import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a65f5c861a844640b1394767189347ea',
  appName: 'Sportstalent',
  webDir: 'dist',
  server: {
    url: 'https://a65f5c86-1a84-4640-b139-4767189347ea.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
