import 'dotenv/config';

export default {
  expo: {
    name: "Athlete Performance",
    slug: "athlete-performance-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.athleteperformance.app",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.athleteperformance.app",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: null,
      bundler: "metro"
    },
    extra: {
      // Expose environment variables to the app
      facebookAppId: process.env.FACEBOOK_APP_ID,
      facebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN,
      backendUrl: process.env.BACKEND_URL,
      appEnv: process.env.APP_ENV,
      // EAS Build configuration
      eas: {
        projectId: "9f1dd9fe-d4a6-4b6c-abfb-60b996db6113"
      }
    },
    plugins: [
      "expo-camera",
      "expo-av", 
      "expo-tracking-transparency",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      [
        "react-native-fbsdk-next",
        {
          appID: process.env.FACEBOOK_APP_ID,
          clientToken: process.env.FACEBOOK_CLIENT_TOKEN,
          displayName: "Athlete Performance",
          scheme: `fb${process.env.FACEBOOK_APP_ID}`,
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
          iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
};