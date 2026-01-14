import 'dotenv/config';

export default {
  expo: {
    name: "GameIQ",
    slug: "gameiq-app", 
    version: "1.0.0",
    orientation: "portrait",
    jsEngine: 'hermes',
    newArchEnabled: true,
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
      bundleIdentifier: "com.justinbooth.gameiq",
      googleServicesFile: "./GoogleService-Info.plist",
      usesAppleSignIn: true, // Required for Apple Sign-In
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
      package: "com.justinbooth.gameiq",
      googleServicesFile: "./google-services.json"
    },
    web: {
      bundler: "metro"
    },
    extra: {
      facebookAppId: process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE",
      facebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN || "YOUR_CLIENT_TOKEN_HERE",
      backendUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080",
      appEnv: process.env.APP_ENV || "development",
      eas: {
        projectId: "ecaaa5e4-f225-44ee-a214-bdf423f43020"
      },
      // Firebase configuration from GoogleService-Info.plist
      firebaseConfig: {
        apiKey: "AIzaSyAOuvLI7rp5jPzLVgKk2ckh84UHgO8ZGb8",
        projectId: "gameiq-37d8d",
        storageBucket: "gameiq-37d8d.firebasestorage.app",
        iosClientId: "413016117016-mt8rq2cjaenq5qn3meek9s228sipf16j.apps.googleusercontent.com",
        iosBundleId: "com.justinbooth.gameiq"
      }
    },
    // Development build plugins for authentication
    plugins: [
      "expo-dev-client", // Required for development builds
      "expo-apple-authentication", // Apple Sign-In
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
      ],
      // [
      //   "react-native-purchases",
      //   {
      //     useAmazon: false
      //   }
      // ],
      // Facebook will be added later if needed
      // [
      //   "react-native-fbsdk-next",
      //   {
      //     appID: process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE",
      //     clientToken: process.env.FACEBOOK_CLIENT_TOKEN || "YOUR_CLIENT_TOKEN_HERE",
      //     displayName: "GameIQ",
      //     scheme: `fb${process.env.FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID_HERE"}`,
      //     advertiserIDCollectionEnabled: false,
      //     autoLogAppEventsEnabled: false,
      //     isAutoInitEnabled: true,
      //     iosUserTrackingPermission: "This identifier will be used to deliver personalized ads to you."
      //   }
      // ]
    ]
  }
};