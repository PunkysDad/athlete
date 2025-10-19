import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';

// Import authentication
import { useAuth } from './src/hooks/useAuth';
import AuthenticationFlow from './src/components/AuthenticationFlow';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AthleteProfileScreen from './src/screens/AthleteProfileScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import CoachingScreen from './src/screens/CoachingScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Loading screen component
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6200EA" />
      <Text style={styles.loadingText}>Initializing...</Text>
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
            case 'Performance':
              iconName = 'trending-up';
              break;
            case 'Coaching':
              iconName = 'psychology';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EA',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={AthleteProfileScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
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
          headerStyle: { backgroundColor: '#6200EA' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, initializing } = useAuth();

  return (
    <PaperProvider>
      {initializing ? (
        <LoadingScreen />
      ) : user ? (
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      ) : (
        <AuthenticationFlow />
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
});