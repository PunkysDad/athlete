import 'dotenv/config';

export default {
  expo: {
    name: "Athlete Performance",
    slug: "athlete-performance-app",
    version: "1.0.0",
    orientation: "portrait",
    // Temporarily remove icon reference
    // icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    // Temporarily remove splash reference  
    // splash: {
    //   image: "./assets/splash.png",
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },
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
      // Temporarily remove adaptive icon
      // adaptiveIcon: {
      //   foregroundImage: "./assets/adaptive-icon.png",
      //   backgroundColor: "#FFFFFF"
      // },
      package: "com.athleteperformance.app",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: null,
      bundler: "metro"
    },
    extra: {
      facebookAppId: process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE",
      facebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN || "YOUR_CLIENT_TOKEN_HERE",
      backendUrl: process.env.BACKEND_URL || "http://localhost:8080",
      appEnv: process.env.APP_ENV || "development",
      eas: {
        projectId: "9f1dd9fe-d4a6-4b6c-abfb-60b996db6113"
      }
    },
    plugins: [
      "expo-dev-client",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0",
            javaVersion: "17"
          },
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      [
        "react-native-fbsdk-next",
        {
          appID: process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE",
          clientToken: process.env.FACEBOOK_CLIENT_TOKEN || "YOUR_CLIENT_TOKEN_HERE",
          displayName: "Athlete Performance",
          scheme: `fb${process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE"}`,
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
          iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
};