import 'dotenv/config'

export default {
  expo: {
    name: 'FS Map Tool',
    description:
      "A small tool to know where you're flying in MS Flight Simulator 2020/2024.",
    privacy: 'public',
    slug: 'fsmaptool',
    version: '1.3.2',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    plugins: ['./plugins/withAndroid16KBPages', 'expo-font'],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'com.riccardolardi.fsmaptool',
      buildNumber: '1.3.2',
      supportsTablet: true,
      requireFullScreen: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.riccardolardi.fsmaptool',
      versionCode: 19,
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'ac857b12-b216-45fc-8bd7-9b79973ff436',
      },
    },
  },
}
