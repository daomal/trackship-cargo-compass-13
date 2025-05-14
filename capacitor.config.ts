
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.01e40f8027244c728c9ca8241418b3bd',
  appName: 'trackship-cargo-compass-13',
  webDir: 'dist',
  server: {
    url: 'https://01e40f80-2724-4c72-8c9c-a8241418b3bd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      keystorePassword: null,
      keystoreAliasPassword: null,
    }
  }
};

export default config;
