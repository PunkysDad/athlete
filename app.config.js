import 'dotenv/config';

export default {
  expo: {
    name: "Athlete Performance",
    slug: "athlete-performance-app",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
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
      facebookAppId: "788849897282522",
      facebookClientToken: "59442a35d743a5e85fd94e2e1216eaeb",
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
          appID: "788849897282522",
          clientToken: "59442a35d743a5e85fd94e2e1216eaeb",
          displayName: "Athlete Performance",
          scheme: "fb788849897282522",
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
          iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
};