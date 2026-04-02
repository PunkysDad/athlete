import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getApps, initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence exists in the React Native bundle
import { initializeAuth, getReactNativePersistence, getAuth, onAuthStateChanged, signOut, signInWithCredential, OAuthProvider } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { revenueCatService } from './src/services/revenueCatService';

import HomeScreen from './src/screens/HomeScreen';
import AthleteProfileScreen from './src/screens/AthleteProfileScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import CoachingScreen from './src/screens/CoachingScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import WorkoutRequestScreen from './src/screens/WorkoutRequestScreen';
import WorkoutDisplayScreen from './src/screens/WorkoutDisplayScreen';

import { OnboardingFlow } from './src/components/onboarding/OnboardingFlow';
import { UserService } from './src/services/userService';
import { RootStackParamList } from './src/types/types';
import { appTheme } from './src/theme/appTheme';
import { UpgradeProvider } from './src/context/UpgradeContext';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Guard against missing Firebase config — causes silent white screen if any value is undefined
const missingFirebaseVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingFirebaseVars.length > 0) {
  console.error('Missing Firebase config vars:', missingFirebaseVars);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}

const userService = new UserService();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Loading Screen ───────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={appTheme.navy} />
    <Text style={styles.loadingText}>Loading SportsIQ...</Text>
  </View>
);

// ─── Auth Screen ──────────────────────────────────────────────────────────────
const AuthScreen: React.FC<{ onAuthSuccess: (user: any) => void }> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
    if (apiKey) {
      Purchases.configure({ apiKey });
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Apple Sign-In is not available on this device');
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken!,
        rawNonce: credential.realUserStatus !== undefined ? 'nonce' : undefined,
      });
      const result = await signInWithCredential(auth, firebaseCredential);
      onAuthSuccess(result.user);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign-In Error', error.message || 'Failed to sign in with Apple. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.navy} />
      <SafeAreaView style={styles.authNavSafeArea}>
        <View style={styles.authNav}>
          <Text style={styles.authNavLogo}>
            Sports<Text style={styles.authNavLogoAccent}>IQ</Text>
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.authHero}>
        <Text style={styles.authHeroTitle}>Master YOUR Position</Text>
        <Text style={styles.authHeroSubtitle}>AI-powered sports coaching & IQ training</Text>
      </View>

      <View style={styles.authCard}>
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={appTheme.white} size="small" />
            : <Text style={styles.appleButtonText}>Continue with Apple</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.restoreButton}
            onPress={async () => {
              try {
                await Purchases.restorePurchases();
                Alert.alert('Success', 'Your purchases have been restored.', [
                  { text: 'OK', onPress: () => handleAppleSignIn() },
                ]);
              } catch (error: any) {
                Alert.alert('Restore Failed', error?.message ?? 'Unable to restore purchases. Please try again.');
              }
            }}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to SportsIQ's{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://sportsiqapp.info/terms.html')}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://sportsiqapp.info/privacy.html')}>
            Privacy Policy
          </Text>
        </Text>
      </View>

      <View style={styles.authFooter}>
        <Text style={styles.authFooterText}>SportsIQ — Powered by Claude</Text>
      </View>
    </View>
  );
};

// ─── Main Tabs ────────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            Home: 'home',
            Profile: 'person',
            Workouts: 'fitness-center',
            Coaching: 'psychology',
          };
          return <Icon name={icons[route.name] ?? 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#b0bec5',
        tabBarStyle: {
          backgroundColor: '#1a2744',
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: appTheme.navy },
        headerTintColor: appTheme.white,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={AthleteProfileScreen} />
      <Tab.Screen
        name="Workouts"
        component={WorkoutRequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="fitness-center" size={size} color={color} />,
          headerStyle: { backgroundColor: appTheme.navy },
          headerTintColor: appTheme.white,
          headerTitleStyle: { fontWeight: '700' },
          headerTitle: 'Generate Workout',
        }}
      />
      <Tab.Screen name="Coaching" component={CoachingScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────
function RootStack() {
  const headerTheme = {
    headerStyle: { backgroundColor: appTheme.navy },
    headerTintColor: appTheme.white,
    headerTitleStyle: { fontWeight: '700' as const },
  };
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile', ...headerTheme }} />
      <Stack.Screen name="WorkoutDisplay" component={WorkoutDisplayScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const handleUpgradeSubscription = async () => {
    if (user) {
      try {
        const fresh = await userService.checkUserExists(user.uid);
        if (fresh) setUserProfile(fresh);
      } catch {
        // use stale profile if refresh fails
      }
    }
    setShowSubscription(true);
  };

  const handleSubscriptionComplete = async (onboardingData: {
    sport: string | null;
    position: string | null;
    subscriptionTier: string | null;
    billingCycle: 'monthly' | 'annual';
  }) => {
    setShowSubscription(false);

    if (!onboardingData.subscriptionTier) return;

    if (userProfile) {
      try {
        await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/${userProfile.id}/subscription`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionTier: onboardingData.subscriptionTier }),
          }
        );
        setUserProfile((prev: any) => ({ ...prev, subscriptionTier: onboardingData.subscriptionTier }));
      } catch (err) {
        console.error('Failed to update subscription:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          try {
            await revenueCatService.initialize(firebaseUser.uid);
          } catch (rcErr) {
            console.error('RevenueCat init error:', rcErr);
          }

          try {
            const existingUser = await userService.checkUserExists(firebaseUser.uid);
            setUser(firebaseUser);
            setUserProfile(existingUser ?? null);
            setShowOnboarding(!existingUser || !existingUser.primarySport || !existingUser.primaryPosition);

            if (existingUser) {
              try {
                await revenueCatService.syncTierIfChanged(
                  existingUser.id,
                  existingUser.subscriptionTier
                );
              } catch (syncErr) {
                console.error('RevenueCat sync error on launch:', syncErr);
              }
            }
          } catch {
            setUser(firebaseUser);
            setUserProfile(null);
            setShowOnboarding(false);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setShowOnboarding(false);
        }
      } finally {
        setInitializing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (authenticatedUser: any) => {
    console.log('Authentication successful for:', authenticatedUser.uid);
  };

  const handleOnboardingComplete = async (onboardingData: {
    sport: string | null;
    position: string | null;
    subscriptionTier: string | null;
    billingCycle: 'monthly' | 'annual';
  }) => {
    try {
      const userData = {
        email: user.email || '',
        firebaseUid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'SportsIQ Athlete',
        primarySport: onboardingData.sport?.toUpperCase(),
        primaryPosition: onboardingData.position?.toUpperCase(),
        subscriptionTier: onboardingData.subscriptionTier ?? 'TRIAL',
        billingCycle: onboardingData.billingCycle,
        age: null,
      };
      const newUser = await userService.createUser(userData);
      setUserProfile(newUser);
      setShowOnboarding(false);
    } catch {
      Alert.alert('Onboarding Error', 'Failed to save your profile. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (error) { console.error('Sign out error:', error); }
  };

  if (initializing) return <PaperProvider><LoadingScreen /></PaperProvider>;
  if (!user) return <PaperProvider><AuthScreen onAuthSuccess={handleAuthSuccess} /></PaperProvider>;
  if (showOnboarding) return <PaperProvider><OnboardingFlow user={user} onComplete={handleOnboardingComplete} /></PaperProvider>;

  if (showSubscription) {
    return (
      <PaperProvider>
        <OnboardingFlow
          user={user}
          onComplete={handleSubscriptionComplete}
          startAtStep={3}
          currentTier={userProfile?.subscriptionTier ?? undefined}
        />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <UpgradeProvider onUpgradePress={handleUpgradeSubscription}>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </UpgradeProvider>
    </PaperProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: appTheme.textLight,
  },
  authContainer: {
    flex: 1,
    backgroundColor: appTheme.white,
  },
  authNavSafeArea: {
    backgroundColor: appTheme.navy,
  },
  authNav: {
    backgroundColor: appTheme.navy,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authNavLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: appTheme.white,
  },
  authNavLogoAccent: {
    color: appTheme.silver,
  },
  authHero: {
    backgroundColor: appTheme.navy,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  authHeroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: appTheme.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  authHeroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  authCard: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
    backgroundColor: appTheme.gray,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButtonText: {
    color: appTheme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  devButton: {
    borderWidth: 2,
    borderColor: appTheme.navy,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 24,
  },
  devButtonText: {
    color: appTheme.navy,
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsLink: {
    color: '#ffffff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  authFooter: {
    backgroundColor: appTheme.navyDark,
    paddingVertical: 16,
    alignItems: 'center',
  },
  authFooterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
});