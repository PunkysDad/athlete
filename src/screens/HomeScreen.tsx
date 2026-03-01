import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Chip, Button, Avatar, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles, getPerformanceColor, getPerformanceLevel } from '../theme';
import { apiService } from '../services/apiService';
import { UserService } from '../services/userService'; // Import UserService
import { getAuth } from 'firebase/auth'; // Import Firebase auth

type RootStackParamList = {
  MainTabs: undefined;
  ProfileEdit: { userId: string }; // Updated navigation target
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock athlete data - replace with real data from API
const mockAthleteData = {
  id: '8', // Real user ID from database
  name: 'jfrankbooth', // Real display_name from database
  sport: 'Football', // Real primary_sport from database  
  position: 'QB', // Real primary_position from database
  school: 'Central High School', // TODO: Get from user profile
  graduationYear: 2025, // TODO: Get from user profile
  profileImage: 'https://via.placeholder.com/150', // TODO: Get from user profile
  aiCompetencies: [
    { skill: 'Position Technique', level: 'Advanced', progress: 0.9 },
    { skill: 'Training Consistency', level: 'Intermediate', progress: 0.7 },
    { skill: 'Performance Analysis', level: 'Beginner', progress: 0.4 },
  ],
};

interface ActivityStats {
  totalChats: number;
  totalWorkouts: number;
  recentActivity: number; // Days since last activity
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('overview');
  const auth = getAuth(); // Initialize Firebase auth
  const userService = new UserService(); // Initialize UserService
  
  // Backend integration state
  const [backendConnected, setBackendConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalChats: 0,
    totalWorkouts: 0,
    recentActivity: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Get current user data from Firebase Auth + your UserService
  const getCurrentUser = async (): Promise<{ user: any; userId: number } | null> => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.log('❌ No Firebase user authenticated');
        return null;
      }

      console.log('🔍 Firebase user UID:', firebaseUser.uid);
      
      // Use your existing UserService to get user data
      const userData = await userService.checkUserExists(firebaseUser.uid);
      
      if (userData) {
        console.log('✅ Found user in backend:', userData);
        return {
          user: userData,
          userId: userData.id
        };
      } else {
        console.log('❌ User not found in backend database');
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const loadActivityStats = async () => {
    if (!currentUserId) {
      console.log('❌ No current user ID available');
      setStatsError('User not authenticated');
      return;
    }

    setStatsLoading(true);
    setStatsError(null);

    try {
      console.log('🔍 Starting loadActivityStats for user ID:', currentUserId);
      
      // Method 1: Use existing stats endpoint (if you update UserStatsResponse)
      const statsResult = await apiService.getUserStats(currentUserId);
      console.log('📊 Stats result:', JSON.stringify(statsResult, null, 2));
      
      if (statsResult.success) {
        console.log('✅ Stats endpoint successful, data:', statsResult.data);
        setActivityStats({
          totalChats: statsResult.data.totalConversations || 0,
          totalWorkouts: statsResult.data.totalWorkouts || 0, // You'll need to add this field
          recentActivity: statsResult.data.daysSinceLastActivity || 0 // You'll need to add this field
        });
        setBackendConnected(true);
      } else {
        console.log('❌ Stats endpoint failed, trying individual endpoints...');
        // Fallback: Try to get data from individual endpoints
        const [chatsResult, workoutsResult] = await Promise.all([
          apiService.getUserConversations(currentUserId),
          apiService.getUserWorkouts(currentUserId)
        ]);
        
        console.log('💬 Chats result:', JSON.stringify(chatsResult, null, 2));
        console.log('💪 Workouts result:', JSON.stringify(workoutsResult, null, 2));
        
        if (chatsResult.success && workoutsResult.success) {
          console.log('✅ Individual endpoints successful');
          console.log('💬 Chats data length:', chatsResult.data?.length || 'undefined');
          console.log('💪 Workouts data length:', workoutsResult.data?.length || 'undefined');
          
          // Calculate recent activity (days since last chat or workout)
          const allActivities = [
            ...chatsResult.data.map(c => new Date(c.timestamp || c.createdAt)),
            ...workoutsResult.data.map(w => new Date(w.createdAt))
          ];
          
          const mostRecentActivity = allActivities.length > 0 
            ? Math.max(...allActivities.map(d => d.getTime()))
            : 0;
          
          const daysSinceLastActivity = mostRecentActivity > 0 
            ? Math.floor((Date.now() - mostRecentActivity) / (1000 * 60 * 60 * 24))
            : 0;
          
          const finalStats = {
            totalChats: chatsResult.data.length,
            totalWorkouts: workoutsResult.data.length,
            recentActivity: daysSinceLastActivity
          };
          
          console.log('🎯 Final activity stats:', finalStats);
          setActivityStats(finalStats);
          setBackendConnected(true);
        } else {
          console.log('❌ Individual endpoints failed');
          setStatsError('Failed to load activity data from endpoints');
        }
      }
    } catch (error) {
      console.log('💥 Error in loadActivityStats:', error);
      setStatsError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Error loading activity stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const result = await apiService.checkHealth();
      setBackendConnected(result.success);
    } catch (error) {
      setBackendConnected(false);
    }
  };

  // Load data on component mount
  useFocusEffect(
    useCallback(() => {
      const initializeUser = async () => {
        setUserLoading(true);
        const result = await getCurrentUser();
        if (result) {
          setCurrentUser(result.user);
          setCurrentUserId(result.userId);
          testBackendConnection();
        } else {
          setStatsError('Please log in to view your activity stats');
        }
        setUserLoading(false);
      };

      initializeUser();
    }, [])
  );

  // Reload stats when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      loadActivityStats();
    }
  }, [currentUserId]);

  const renderActivityStatCard = (
    statName: string, 
    value: number, 
    icon: string, 
    subtitle: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.primaryLight + '15' }]}>
      <Icon name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={[styles.statValue, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={[commonStyles.caption, styles.statLabel]}>{statName}</Text>
      <Text style={[commonStyles.caption, styles.statSubtitle, { color: theme.colors.textTertiary }]}>
        {subtitle}
      </Text>
    </View>
  );

  const renderCompetencyCard = (competency: any, index: number) => (
    <Card key={index} style={commonStyles.card}>
      <Card.Content>
        <View style={commonStyles.rowBetween}>
          <Text style={[commonStyles.body, { flex: 1 }]}>{competency.skill}</Text>
          <Chip 
            mode="outlined" 
            textStyle={[commonStyles.caption]}
            style={{ backgroundColor: theme.colors.primaryLight + '20' }}
          >
            {competency.level}
          </Chip>
        </View>
        <ProgressBar 
          progress={competency.progress} 
          color={theme.colors.primary} 
          style={styles.competencyProgress} 
        />
        <Text style={[commonStyles.caption, styles.competencyPercentage]}>
          {Math.round(competency.progress * 100)}% Mastery
        </Text>
      </Card.Content>
    </Card>
  );

  const renderOverviewTab = () => (
    <View>

      {/* Basic Info Card */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <View>
              <Text style={commonStyles.heading2}>
                {currentUser?.displayName || currentUser?.email || 'Athlete'}
              </Text>
              <Text style={[commonStyles.body, { marginTop: theme.spacing.xs }]}>
                {currentUser?.primarySport || 'Sport'} • {currentUser?.primaryPosition || 'Position'}
              </Text>
              <Text style={[commonStyles.bodySecondary, { marginTop: theme.spacing.xs }]}>
                Subscription: {currentUser?.subscriptionTier || 'FREE'}
              </Text>
            </View>
            <Avatar.Image 
              size={80} 
              source={{ uri: mockAthleteData.profileImage }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Activity Stats */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.heading3}>Training Activity</Text>
            <Button 
              mode="text" 
              onPress={loadActivityStats}
              textColor={theme.colors.primary}
              disabled={statsLoading || !currentUserId}
            >
              {statsLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </View>
          
          {userLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={commonStyles.caption}>Loading user data...</Text>
            </View>
          ) : !currentUserId ? (
            <View style={styles.errorContainer}>
              <Text style={[commonStyles.caption, { color: 'orange' }]}>
                Please log in to view your training stats
              </Text>
            </View>
          ) : statsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={commonStyles.caption}>Loading activity stats...</Text>
            </View>
          ) : statsError ? (
            <View style={styles.errorContainer}>
              <Text style={[commonStyles.caption, { color: 'red' }]}>
                {statsError}
              </Text>
              <Button mode="text" onPress={loadActivityStats} compact>
                Retry
              </Button>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {renderActivityStatCard(
                'AI Chats', 
                activityStats.totalChats, 
                'chat', 
                'Coaching conversations'
              )}
              {renderActivityStatCard(
                'Workouts', 
                activityStats.totalWorkouts, 
                'fitness-center', 
                'Generated plans'
              )}
              {renderActivityStatCard(
                'Days Ago', 
                activityStats.recentActivity, 
                'access-time', 
                'Last activity'
              )}
              {renderActivityStatCard(
                'Total', 
                activityStats.totalChats + activityStats.totalWorkouts, 
                'trending-up', 
                'AI interactions'
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      {/* <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Icon name="chat" size={32} color={theme.colors.primary} />
              <Text style={[commonStyles.bodySecondary, { textAlign: 'center', marginTop: 8 }]}>
                Start AI Chat
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icon name="fitness-center" size={32} color={theme.colors.primary} />
              <Text style={[commonStyles.bodySecondary, { textAlign: 'center', marginTop: 8 }]}>
                Generate Workout
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icon name="history" size={32} color={theme.colors.primary} />
              <Text style={[commonStyles.bodySecondary, { textAlign: 'center', marginTop: 8 }]}>
                View History
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icon name="analytics" size={32} color={theme.colors.primary} />
              <Text style={[commonStyles.bodySecondary, { textAlign: 'center', marginTop: 8 }]}>
                View Analytics
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card> */}
    </View>
  );

  const renderTrainingTab = () => (
    <View>
      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Training Competencies</Text>
          <Text style={[commonStyles.bodySecondary, { marginBottom: theme.spacing.base }]}>
            Skills developed through AI coaching and workout generation
          </Text>
          {mockAthleteData.aiCompetencies.map(renderCompetencyCard)}
        </Card.Content>
      </Card>

      {/* Recent AI Interactions */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Recent AI Interactions</Text>
          <Text style={[commonStyles.bodySecondary, { marginBottom: theme.spacing.base }]}>
            Your latest coaching conversations and workout generations
          </Text>
          
          <View style={styles.recentActivityList}>
            <View style={styles.activityItem}>
              <Icon name="chat" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={commonStyles.body}>Position-specific training advice</Text>
                <Text style={commonStyles.caption}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Icon name="fitness-center" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={commonStyles.body}>Wide Receiver off-season workout</Text>
                <Text style={commonStyles.caption}>1 day ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Icon name="chat" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={commonStyles.body}>Route running technique discussion</Text>
                <Text style={commonStyles.caption}>3 days ago</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      {/* Header with Profile Edit Button */}
      <View style={styles.header}>
        <Text style={commonStyles.heading2}>GameIQ Dashboard</Text>
        <Button
          mode="outlined"
          icon="account-edit"
          onPress={() => navigation.navigate('ProfileEdit', { userId: currentUser?.id.toString() || '1' })}
          textColor={theme.colors.primary}
          style={{ borderColor: theme.colors.primary }}
        >
          Profile
        </Button>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'training', label: 'Training' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab, 
              activeTab === tab.key && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              commonStyles.body,
              { color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary },
              activeTab === tab.key && { fontWeight: 'bold' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'training' && renderTrainingTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'orange',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statSubtitle: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  quickActionCard: {
    width: '48%',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.primaryLight + '10',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight + '30',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  competencyProgress: {
    marginVertical: theme.spacing.sm,
  },
  competencyPercentage: {
    textAlign: 'right',
  },
  recentActivityList: {
    marginTop: theme.spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});