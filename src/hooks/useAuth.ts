import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import ENV_CONFIG from '../config/environment';

// Only import native modules on mobile platforms (and not in Expo Go)
let auth: any = null;
let authInstance: any = null;
let LoginManager: any = null;
let AccessToken: any = null;

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
const isWebPlatform = Platform.OS === 'web';

if (!isWebPlatform && !isExpoGo) {
  // Import Firebase
  const firebaseAuth = require('@react-native-firebase/auth');
  auth = firebaseAuth.default;
  authInstance = auth();
  
  // Import Facebook SDK
  const fbSdk = require('react-native-fbsdk-next');
  LoginManager = fbSdk.LoginManager;
  AccessToken = fbSdk.AccessToken;
}

// Use a simple User type that works across platforms
type User = any;

// Types for our auth hook
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AthleteProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tier: string;
  sport: string | null;
  position: string | null;
  createdAt: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  initializing: boolean;
  onFacebookSignIn: () => Promise<User>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Listen to authentication state changes
  useEffect(() => {
    // ALWAYS handle Expo Go and web first - before any Firebase code
    if (isWebPlatform || isExpoGo) {
      if (isExpoGo) {
        // Mock authentication for Expo Go development
        console.log('Running in Expo Go - using mock authentication');
        
        // Simulate loading time
        setTimeout(() => {
          const mockUser: AuthUser = {
            uid: 'mock-dev-user-123',
            email: 'developer@athleteapp.dev',
            displayName: 'Dev Athlete',
            photoURL: 'https://via.placeholder.com/150'
          };
          
          setUser(mockUser);
          setInitializing(false);
          
          console.log('Mock user authenticated:', mockUser);
        }, 1000);
      } else {
        // Web platform
        setInitializing(false);
      }
      return; // Exit early - no Firebase code should run
    }

    // Only run Firebase code on real mobile builds
    if (!authInstance) {
      console.warn('Firebase auth not available');
      setInitializing(false);
      return;
    }

    const subscriber = authInstance.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Convert Firebase User to our AuthUser interface
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(authUser);
      } else {
        setUser(null);
      }
      
      if (initializing) setInitializing(false);
    });

    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  const onFacebookSignIn = async (): Promise<User> => {
    try {
      // Check if platform supports Facebook login
      if (isWebPlatform || isExpoGo) {
        if (isExpoGo) {
          // Mock Facebook login for Expo Go
          console.log('Mock Facebook login in Expo Go');
          
          // Simulate login process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const mockUser: AuthUser = {
            uid: 'mock-facebook-user-456',
            email: 'facebook@athleteapp.dev',
            displayName: 'Facebook Dev User',
            photoURL: 'https://via.placeholder.com/150'
          };
          
          setUser(mockUser);
          
          // Mock profile creation
          await createMockAthleteProfile(mockUser);
          
          console.log('Mock Facebook login successful');
          return mockUser as User;
        } else {
          throw new Error('Facebook login is not available on web. Please download and use the mobile app for full authentication features.');
        }
      }

      if (!authInstance || !auth) {
        throw new Error('Firebase authentication is not available on this platform.');
      }

      console.log('Starting Facebook login...');

      // Perform standard Facebook Login (no Limited Login)
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }

      console.log('Facebook login successful, getting access token...');

      // Get Facebook access token
      const tokenData = await AccessToken.getCurrentAccessToken();
      
      if (!tokenData?.accessToken) {
        throw new Error('Failed to obtain access token from Facebook');
      }

      console.log('Got Facebook token, creating Firebase credential...');

      // Create Firebase credential (simplified - no nonce needed)
      const facebookCredential = auth.FacebookAuthProvider.credential(tokenData.accessToken);

      // Sign in with Firebase
      console.log('Signing in with Firebase...');
      const userCredential = await authInstance.signInWithCredential(facebookCredential);
      const firebaseUser = userCredential.user;

      console.log('Firebase sign-in successful:', firebaseUser.uid);

      // Create or update athlete profile in your backend
      await createAthleteProfile(firebaseUser);

      return firebaseUser;

    } catch (error) {
      console.error('Facebook Sign-In Error:', error);
      throw error;
    }
  };

  const createAthleteProfile = async (firebaseUser: User): Promise<void> => {
    try {
      console.log('Creating athlete profile...');
      
      // Get Firebase ID token for backend authentication
      const token = await firebaseUser.getIdToken();
      
      const profileData: Omit<AthleteProfile, 'id'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Athlete',
        photoURL: firebaseUser.photoURL,
        tier: 'basic', // Default tier, upgraded via App Store subscription
        sport: null, // To be filled by user later
        position: null, // To be filled by user later
        createdAt: new Date().toISOString()
      };
      
      // Call your Kotlin Spring Boot backend
      const response = await fetch(`${ENV_CONFIG.BACKEND_URL}/api/athlete/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorData}`);
      }

      const athleteProfile = await response.json();
      console.log('Athlete profile created:', athleteProfile);
      
    } catch (error) {
      console.error('Error creating athlete profile:', error);
      // Don't throw here - let the user proceed even if backend fails
      console.warn('User authenticated but profile creation failed. They can complete profile later.');
    }
  };

  const createMockAthleteProfile = async (mockUser: AuthUser): Promise<void> => {
    try {
      console.log('Creating mock athlete profile...');
      
      const profileData: Omit<AthleteProfile, 'id'> = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName || 'Dev Athlete',
        photoURL: mockUser.photoURL,
        tier: 'basic',
        sport: 'Basketball', // Mock sport for development
        position: 'Point Guard', // Mock position for development
        createdAt: new Date().toISOString()
      };
      
      // Mock API call to your backend
      console.log('Mock backend call:', profileData);
      console.log('Mock profile created successfully');
      
      // In a real development scenario, you could test actual backend calls:
      // const response = await fetch(`${ENV_CONFIG.BACKEND_URL}/api/athlete/profile`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer mock-jwt-token`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(profileData)
      // });
      
    } catch (error) {
      console.error('Error creating mock athlete profile:', error);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      if (isWebPlatform || isExpoGo) {
        if (isExpoGo) {
          // Mock sign out for Expo Go
          console.log('Mock sign out in Expo Go');
          setUser(null);
          console.log('Mock user signed out successfully');
          return;
        } else {
          throw new Error('Sign out is not available on web. Authentication features require the mobile app.');
        }
      }

      if (!authInstance) {
        throw new Error('Firebase authentication is not available on this platform.');
      }

      await authInstance.signOut();
      // Clear Facebook session
      await LoginManager.logOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    initializing,
    onFacebookSignIn,
    signOut: signOutUser
  };
}