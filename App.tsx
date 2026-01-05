import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';

// Import simple authentication for development
import { useSimpleAuth } from './src/hooks/useSimpleAuth';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AthleteProfileScreen from './src/screens/AthleteProfileScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import CoachingScreen from './src/screens/CoachingScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import WorkoutRequestScreen from './src/screens/WorkoutRequestScreen';
import WorkoutDisplayScreen from './src/screens/WorkoutDisplayScreen';

import { RootStackParamList } from './src/types/types';

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

// Simple sign-in screen for development (replaces AuthenticationFlow)
const DevSignInScreen: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <View style={styles.signInContainer}>
      <Text style={styles.appTitle}>GameIQ</Text>
      <Text style={styles.subtitle}>AI Sports Coach</Text>
      <Text style={styles.devNote}>Development Mode</Text>
      <Text style={styles.devInstructions}>
        This will automatically sign you in with a mock user for development.
      </Text>
    </View>
  );
};

// Main Tab Navigator
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
        component={HomeScreen} // Or a WorkoutLandingScreen
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

// Root Stack Navigator
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
          headerShown: false, // Since we have custom header in the component
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, initializing, signIn } = useSimpleAuth();

  return (
    <PaperProvider>
      {initializing ? (
        <LoadingScreen />
      ) : user ? (
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      ) : (
        <DevSignInScreen onSignIn={signIn} />
      )}
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
    backgroundColor: '#ffffff',
    padding: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 40,
  },
  devNote: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 16,
  },
  devInstructions: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});