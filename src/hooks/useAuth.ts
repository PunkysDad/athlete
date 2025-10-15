import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { 
  getAuth, 
  signInWithCredential, 
  FacebookAuthProvider, 
  onAuthStateChanged, 
  signOut,
  FirebaseAuthTypes
} from '@react-native-firebase/auth';
import { 
  LoginManager, 
  AccessToken, 
  AuthenticationToken 
} from 'react-native-fbsdk-next';
import { sha256 } from 'react-native-sha256';
import uuid from 'react-native-uuid';
import ENV_CONFIG from '../config/environment';

const auth = getAuth();

// Use Firebase's User type
type User = FirebaseAuthTypes.User;

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
    const subscriber = onAuthStateChanged(auth, (firebaseUser: User | null) => {
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
      // Create nonce for iOS Limited Login security
      const nonce = uuid.v4() as string;
      const nonceSha256 = await sha256(nonce);

      console.log('Starting Facebook login...');

      // Perform Facebook Login - fix the parameter types
      const result = await LoginManager.logInWithPermissions(
        ['public_profile', 'email'],
        Platform.OS === 'ios' ? 'limited' : undefined, // Only pass 'limited' on iOS
        Platform.OS === 'ios' ? nonceSha256 : undefined // Only pass nonce on iOS
      );

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }

      console.log('Facebook login successful, getting tokens...');

      // Get the appropriate token based on platform
      let authToken: string;

      if (Platform.OS === 'ios') {
        // iOS uses AuthenticationToken for Limited Login
        const tokenData = await AuthenticationToken.getAuthenticationTokenIOS();
        authToken = tokenData?.authenticationToken;
        
        if (!authToken) {
          throw new Error('Failed to obtain iOS authentication token from Facebook');
        }
      } else {
        // Android uses AccessToken
        const tokenData = await AccessToken.getCurrentAccessToken();
        authToken = tokenData?.accessToken;
        
        if (!authToken) {
          throw new Error('Failed to obtain Android access token from Facebook');
        }
      }

      console.log('Got Facebook token, creating Firebase credential...');

      // Create Firebase credential
      const facebookCredential = FacebookAuthProvider.credential(
        authToken,
        Platform.OS === 'ios' ? nonce : null // Only pass nonce on iOS
      );

      // Sign in with Firebase
      console.log('Signing in with Firebase...');
      const userCredential = await signInWithCredential(auth, facebookCredential);
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

  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
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