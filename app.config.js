import 'dotenv/config';

export default {
  expo: {
    name: "SportsIQ",
    slug: "gameiq-app", 
    version: "1.0.0",
    orientation: "portrait",
    jsEngine: 'hermes',
    newArchEnabled: false,
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.justinbooth.gameiq",
      googleServicesFile: "./GoogleService-Info.plist",
      usesAppleSignIn: true,
      icon: "./assets/icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.justinbooth.gameiq",
      googleServicesFile: "./google-services.json"
    },
    web: {
      bundler: "metro"
    },
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080",
      appEnv: process.env.APP_ENV || "development",
      eas: {
        projectId: "ecaaa5e4-f225-44ee-a214-bdf423f43020"
      },
      firebaseConfig: {
        apiKey: "AIzaSyAOuvLI7rp5jPzLVgKk2ckh84UHgO8ZGb8",
        projectId: "gameiq-37d8d",
        storageBucket: "gameiq-37d8d.firebasestorage.app",
        iosClientId: "413016117016-mt8rq2cjaenq5qn3meek9s228sipf16j.apps.googleusercontent.com",
        iosBundleId: "com.justinbooth.gameiq"
      }
    },
    plugins: [
      "expo-dev-client",
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          },
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1"
          }
        }
      ]
    ]
  }
};