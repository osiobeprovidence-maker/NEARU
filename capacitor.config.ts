import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lalao.com',
  appName: 'lalao',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      // Use native Android Google Sign-In SDK instead of web-based OAuth popup/redirect.
      // The web OAuth popup/redirect both fail in the Capacitor WebView because
      // sessionStorage is not shared between WebView windows, causing
      // "auth/missing-initial-state" errors. Native sign-in bypasses this entirely.
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
