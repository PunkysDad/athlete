import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from './src/hooks/useAuth';
import AuthenticationFlow from './src/components/AuthenticationFlow';

// Type for authenticated user
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface MainAppFlowProps {
  user: AuthUser;
}

// Simple main app component for authenticated users
const MainAppFlow: React.FC<MainAppFlowProps> = ({ user }) => {
  const { signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    try {
      console.log('🔵 Signing out...');
      await signOut();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, Athlete! 🏆</Text>
        <Text style={styles.userInfo}>
          {user.displayName || 'Athlete'} • {user.email}
        </Text>
        <Text style={styles.userUID}>
          User ID: {user.uid}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.contentTitle}>🎯 Authentication Successful!</Text>
        
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✅ Facebook Login Working</Text>
          <Text style={styles.successDescription}>
            Your authentication system is properly configured and working!
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>📹 Next: Upload Videos</Text>
          <Text style={styles.cardDescription}>
            Video upload functionality coming next
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>🤖 Next: AI Assessment</Text>
          <Text style={styles.cardDescription}>
            AI-powered skill analysis coming soon
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>🎓 Next: Recruiter Network</Text>
          <Text style={styles.cardDescription}>
            Connect with college scouts and recruiters
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Loading screen component
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1877F2" />
      <Text style={styles.loadingText}>Initializing...</Text>
    </View>
  );
};

// Main App component with authentication flow
const App: React.FC = () => {
  const { user, initializing } = useAuth();

  console.log('🔍 App State:', { 
    initializing, 
    userExists: !!user, 
    userEmail: user?.email 
  });

  // Show loading screen while checking authentication state
  if (initializing) {
    return <LoadingScreen />;
  }

  // Show authentication flow if no user is signed in
  if (!user) {
    return <AuthenticationFlow />;
  }

  // Show main app if user is authenticated
  return <MainAppFlow user={user} />;
};

const styles = StyleSheet.create({
  // Loading Screen Styles
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

  // Main App Styles
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  userUID: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
  },
  signOutButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;