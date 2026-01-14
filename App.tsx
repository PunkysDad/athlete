import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
// Using Firebase JS SDK v9+ (current recommended approach)
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithCredential, OAuthProvider } from 'firebase/auth';
import { revenueCatService } from './src/services/revenueCatService';

// Import screens
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

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOuvLI7rp5jPzLVgKk2ckh84UHgO8ZGb8",
  authDomain: "gameiq-37d8d.firebaseapp.com", 
  projectId: "gameiq-37d8d",
  storageBucket: "gameiq-37d8d.firebasestorage.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize UserService
const userService = new UserService();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Loading screen component
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0066FF" />
      <Text style={styles.loadingText}>Loading GameIQ...</Text>
    </View>
  );
};

// Firebase Apple Sign-In screen using Firebase JS SDK
const AuthScreen: React.FC<{ onAuthSuccess: (user: any) => void }> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Apple Sign-In is not available on this device');
        return;
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', credential.identityToken ? 'Token present' : 'No token');

      // Create Firebase Apple credential using Firebase JS SDK
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken!,
        rawNonce: credential.realUserStatus !== undefined ? 'nonce' : undefined,
      });

      // Sign in to Firebase using Firebase JS SDK
      const result = await signInWithCredential(auth, firebaseCredential);
      console.log('Firebase sign-in successful:', result.user.uid);

      // Call success callback
      onAuthSuccess(result.user);

    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign-In');
        return;
      }
      
      Alert.alert(
        'Sign-In Error',
        error.message || 'Failed to sign in with Apple. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSignIn = () => {
    // Keep the mock user option for development
    const mockUser = {
      uid: 'dev-user-123',
      email: 'dev@gameiq.com',
      displayName: 'Dev User'
    };
    onAuthSuccess(mockUser);
  };

  return (
    <View style={styles.signInContainer}>
      <Text style={styles.appTitle}>GameIQ</Text>
      <Text style={styles.subtitle}>Master YOUR Position</Text>
      <Text style={styles.tagline}>Train Smarter with AI</Text>
      
      {/* Apple Sign-In Button */}
      <TouchableOpacity
        style={styles.appleButton}
        onPress={handleAppleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Text style={styles.appleIcon}>🍎</Text>
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Development Mock Sign-In */}
      <TouchableOpacity
        style={styles.devButton}
        onPress={handleDevSignIn}
      >
        <Text style={styles.devButtonText}>Continue as Dev User</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to GameIQ's Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};

// Main Tab Navigator (unchanged)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Workouts':
              iconName = 'fitness-center';
              break;
            case 'Coaching':
              iconName = 'psychology';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#0066FF' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={AthleteProfileScreen} />
      <Tab.Screen 
        name="Workouts" 
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('WorkoutRequest');
          }
        })}
      />
      <Tab.Screen name="Coaching" component={CoachingScreen} />
    </Tab.Navigator>
  );
}

// Root Stack Navigator (unchanged)
function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#0066FF' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="WorkoutRequest" 
        component={WorkoutRequestScreen}
        options={{
          title: 'Generate Workout',
          headerStyle: { backgroundColor: '#0066FF' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="WorkoutDisplay" 
        component={WorkoutDisplayScreen}
        options={{
          title: 'Your Workout',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Move testRevenueCat INSIDE the component so it can access user state
  const testRevenueCat = async () => {
    if (!user?.uid) {
      console.log('❌ No user available for RevenueCat test');
      return;
    }

    console.log('🔑 Checking environment variables...');
    console.log('iOS key:', process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ? 'Present' : 'Missing');
    console.log('Android key:', process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ? 'Present' : 'Missing');

    try {
      console.log('🧪 Testing RevenueCat...');
      await revenueCatService.initialize(user.uid);
      console.log('✅ RevenueCat initialized successfully');
      
      const packages = await revenueCatService.getAvailablePackages();
      console.log(`📦 Found ${packages.length} packages`);
    } catch (error) {
      console.error('❌ RevenueCat test failed:', error);
    }
  };

  // Test RevenueCat when user changes
  useEffect(() => {
    if (user?.uid) {
      testRevenueCat();
    }
  }, [user]);

  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, check if they exist in our database
        try {
          const existingUser = await userService.checkUserExists(firebaseUser.uid);
          
          if (existingUser) {
            // User exists in database, proceed to main app
            setUser(firebaseUser);
            setUserProfile(existingUser);
            setShowOnboarding(false);
          } else {
            // New user, show onboarding
            setUser(firebaseUser);
            setUserProfile(null);
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking user:', error);
          // On error, treat as new user and show onboarding
          setUser(firebaseUser);
          setUserProfile(null);
          setShowOnboarding(true);
        }
      } else {
        // User is signed out
        setUser(null);
        setUserProfile(null);
        setShowOnboarding(false);
      }
      
      setInitializing(false);
      console.log('Auth state changed:', firebaseUser?.uid || 'no user');
    });

    return () => unsubscribe();
  }, []);

  // Rest of your component code remains the same...
  const handleAuthSuccess = (authenticatedUser: any) => {
    console.log('Authentication successful for:', authenticatedUser.uid);
  };

  const handleOnboardingComplete = async (onboardingData: { sport: string | null; position: string | null; subscriptionTier: string | null; billingCycle: 'monthly' | 'annual' }) => {
    try {
      console.log('Completing onboarding with data:', onboardingData);
      
      const userData = {
        email: user.email || '',
        firebaseUid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'GameIQ Athlete',
        primarySport: onboardingData.sport?.toUpperCase(),
        primaryPosition: onboardingData.position?.toUpperCase(),
        subscriptionTier: onboardingData.subscriptionTier,
        billingCycle: onboardingData.billingCycle,
        age: null
      };

      console.log('Sending user data to backend:', userData);
      const newUser = await userService.createUser(userData);
      console.log('User created successfully:', newUser);
      
      // Update state to exit onboarding
      setUserProfile(newUser);
      setShowOnboarding(false);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Onboarding Error',
        'Failed to save your profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Render logic remains the same
  if (initializing) {
    return (
      <PaperProvider>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  if (!user) {
    return (
      <PaperProvider>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </PaperProvider>
    );
  }

  if (showOnboarding) {
    return (
      <PaperProvider>
        <OnboardingFlow user={user} onComplete={handleOnboardingComplete} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  devButton: {
    borderWidth: 2,
    borderColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});