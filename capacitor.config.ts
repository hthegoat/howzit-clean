import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hwztsurf.app',
  appName: 'Howzit',

  // `nuxt generate` with ssr:false writes the SPA shell and assets here.
  webDir: '.output/public',

  // Deep links and push payloads will reference hwztsurf.com; this keeps the
  // WebView origin consistent with it rather than the capacitor:// scheme.
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'hwztsurf.com',
  },

  ios: {
    // Match the page background so the bounce-scroll gutter isn't white.
    backgroundColor: '#f9fafb',
    contentInset: 'always',
  },

  android: {
    backgroundColor: '#f9fafb',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#FACC15',
      showSpinner: false,
    },
  },
}

export default config
