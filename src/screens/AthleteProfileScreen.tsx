import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Chip, Button, Avatar, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles, getPerformanceColor, getPerformanceLevel } from '../theme';
import { apiService, Video } from '../services/apiService';

type RootStackParamList = {
  MainTabs: undefined;
  EditProfile: { userId: string };
  VideoDetail: { video: Video };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// Mock athlete data - in production, this would come from your API
const mockAthleteData = {
  id: '1',
  name: 'Jordan Thompson',
  sport: 'Football',
  position: 'Wide Receiver',
  school: 'Central High School',
  graduationYear: 2025,
  profileImage: 'https://via.placeholder.com/150',
  stats: {
    speed: 85,
    strength: 72,
    agility: 88,
    endurance: 76,
    sportsIQ: 82,
  },
  aiCompetencies: [
    { skill: 'Defensive Formations', level: 'Advanced', progress: 0.9 },
    { skill: 'Route Recognition', level: 'Intermediate', progress: 0.7 },
    { skill: 'Game Strategy', level: 'Beginner', progress: 0.4 },
  ],
  coachReviews: [
    {
      id: '1',
      reviewer: 'Coach Martinez',
      role: 'Head Coach',
      comment: 'Exceptional work ethic and natural talent. Shows great potential for college-level play.',
      rating: 4.8,
      date: '2024-09-15'
    }
  ]
};

export default function AthleteProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Backend integration state
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Load videos from backend
  const loadUserVideos = async () => {
    setVideosLoading(true);
    setVideosError(null);

    try {
      const result = await apiService.getMyVideos();
      
      if (result.success) {
        setVideos(result.data);
        setBackendConnected(true);
      } else {
        setVideosError(result.error || 'Failed to load videos');
        console.error('Failed to load videos:', result.error);
      }
    } catch (error) {
      setVideosError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Error loading videos:', error);
    } finally {
      setVideosLoading(false);
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
  useEffect(() => {
    testBackendConnection();
    loadUserVideos();
  }, []);

  // Refresh videos when videos tab is selected
  useEffect(() => {
    if (activeTab === 'videos') {
      loadUserVideos();
    }
  }, [activeTab]);

  const renderStatCard = (statName: string, value: number, icon: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.primaryLight + '15' }]}>
      <Icon name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={[styles.statValue, { color: getPerformanceColor(value) }]}>{value}</Text>
      <Text style={[commonStyles.caption, styles.statLabel]}>{statName}</Text>
      <ProgressBar 
        progress={value / 100} 
        color={getPerformanceColor(value)} 
        style={styles.progressBar} 
      />
      <Text style={[commonStyles.caption, { color: getPerformanceColor(value) }]}>
        {getPerformanceLevel(value)}
      </Text>
    </View>
  );

  // Updated video card renderer using backend data
  const renderVideoCard = (video: Video, index: number) => (
    <Card key={video.id || index} style={styles.videoCard}>
      <TouchableOpacity onPress={() => handleVideoPress(video)}>
        {video.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbnail} />
        ) : (
          <View style={[styles.videoThumbnail, styles.placeholderThumbnail]}>
            <Icon name="play-circle-outline" size={40} color={theme.colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.videoOverlay}>
          <Icon name="play-circle-outline" size={40} color="white" />
        </View>
        
        <Card.Content style={styles.videoContent}>
          <Text style={[commonStyles.caption, styles.videoTitle]} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.videoMeta}>
            <Text style={[commonStyles.caption, { color: theme.colors.textTertiary }]}>
              {video.sport}
            </Text>
            {video.isFeatured && (
              <Chip 
                mode="outlined" 
                textStyle={{ fontSize: 10 }}
                style={styles.featuredChip}
              >
                ⭐ Featured
              </Chip>
            )}
          </View>
          <Text style={[commonStyles.caption, { color: theme.colors.textTertiary }]}>
            {new Date(video.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const handleVideoPress = (video: Video) => {
    // Navigate to video detail or open YouTube
    Alert.alert(
      video.title,
      `Sport: ${video.sport}\nCategory: ${video.category}\nPublic: ${video.isPublic ? 'Yes' : 'No'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Watch on YouTube', 
          onPress: () => {
            // TODO: Open YouTube app or browser
            console.log('Opening YouTube URL:', video.youtubeUrl);
          }
        }
      ]
    );
  };

  const handleAddVideo = () => {
    Alert.alert(
      'Add Video',
      'Video upload feature coming soon! You\'ll be able to add YouTube videos to your profile.',
      [{ text: 'OK' }]
    );
  };

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
      {/* Backend Connection Status */}
      <Card style={[commonStyles.card, !backendConnected && styles.warningCard]}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.body}>
              {backendConnected ? '✅ Backend Connected' : '❌ Backend Disconnected'}
            </Text>
            <Button 
              mode="text" 
              onPress={testBackendConnection}
              textColor={theme.colors.primary}
              compact
            >
              Test
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Basic Info Card */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <View>
              <Text style={commonStyles.heading2}>{mockAthleteData.name}</Text>
              <Text style={[commonStyles.body, { marginTop: theme.spacing.xs }]}>
                {mockAthleteData.sport} • {mockAthleteData.position}
              </Text>
              <Text style={[commonStyles.bodySecondary, { marginTop: theme.spacing.xs }]}>
                {mockAthleteData.school} • Class of {mockAthleteData.graduationYear}
              </Text>
            </View>
            <Avatar.Image 
              size={80} 
              source={{ uri: mockAthleteData.profileImage }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Performance Stats */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Performance Metrics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Speed', mockAthleteData.stats.speed, 'flash-on')}
            {renderStatCard('Strength', mockAthleteData.stats.strength, 'fitness-center')}
            {renderStatCard('Agility', mockAthleteData.stats.agility, 'trending-up')}
            {renderStatCard('Endurance', mockAthleteData.stats.endurance, 'favorite')}
          </View>
        </Card.Content>
      </Card>

      {/* Recent Videos from Backend */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.heading3}>Recent Videos ({videos.length})</Text>
            <Button 
              mode="text" 
              onPress={() => setActiveTab('videos')}
              textColor={theme.colors.primary}
            >
              View All
            </Button>
          </View>
          
          {videosLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={commonStyles.caption}>Loading videos...</Text>
            </View>
          ) : videosError ? (
            <View style={styles.errorContainer}>
              <Text style={[commonStyles.caption, { color: 'red' }]}>
                {videosError}
              </Text>
              <Button mode="text" onPress={loadUserVideos} compact>
                Retry
              </Button>
            </View>
          ) : videos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videos.slice(0, 3).map(renderVideoCard)}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={commonStyles.bodySecondary}>No videos yet</Text>
              <Button 
                mode="outlined" 
                onPress={handleAddVideo}
                style={{ marginTop: theme.spacing.sm }}
              >
                Add First Video
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const renderVideosTab = () => (
    <View>
      {/* Videos Header */}
      <View style={styles.videosHeader}>
        <Text style={commonStyles.heading3}>
          My Videos ({videos.length})
        </Text>
        <Button 
          mode="contained" 
          onPress={handleAddVideo}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Add Video
        </Button>
      </View>

      {videosLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={commonStyles.body}>Loading your videos...</Text>
        </View>
      ) : videosError ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={commonStyles.heading3}>Failed to Load Videos</Text>
            <Text style={commonStyles.bodySecondary}>{videosError}</Text>
            <Button 
              mode="contained" 
              onPress={loadUserVideos}
              style={{ marginTop: theme.spacing.md }}
            >
              Try Again
            </Button>
          </Card.Content>
        </Card>
      ) : videos.length > 0 ? (
        <View style={styles.videosGrid}>
          {videos.map(renderVideoCard)}
        </View>
      ) : (
        <Card style={commonStyles.card}>
          <Card.Content style={styles.emptyVideosContent}>
            <Icon name="videocam" size={60} color={theme.colors.textSecondary} />
            <Text style={commonStyles.heading3}>No Videos Yet</Text>
            <Text style={[commonStyles.bodySecondary, { textAlign: 'center', marginVertical: theme.spacing.md }]}>
              Start building your athletic profile by adding your first performance video from YouTube.
            </Text>
            <Button 
              mode="contained" 
              onPress={handleAddVideo}
              style={{ backgroundColor: theme.colors.primary }}
            >
              Add Your First Video
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderAITab = () => (
    <View>
      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Sports Knowledge Competencies</Text>
          <Text style={[commonStyles.bodySecondary, { marginBottom: theme.spacing.base }]}>
            Verified through AI coaching conversations
          </Text>
          {mockAthleteData.aiCompetencies.map(renderCompetencyCard)}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      {/* Header with Edit Button */}
      <View style={styles.header}>
        <Text style={commonStyles.heading2}>My Profile</Text>
        <Button
          mode="outlined"
          icon="edit"
          onPress={() => navigation.navigate('EditProfile', { userId: mockAthleteData.id })}
          textColor={theme.colors.primary}
          style={{ borderColor: theme.colors.primary }}
        >
          Edit
        </Button>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'videos', label: `Videos (${videos.length})` },
          { key: 'ai', label: 'Sports IQ' }
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
        {activeTab === 'videos' && renderVideosTab()}
        {activeTab === 'ai' && renderAITab()}
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
  },
  progressBar: {
    width: '100%',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  videoCard: {
    width: 150,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    ...theme.shadows.sm,
  },
  videoThumbnail: {
    width: 150,
    height: 100,
    borderTopLeftRadius: theme.borderRadius.base,
    borderTopRightRadius: theme.borderRadius.base,
  },
  placeholderThumbnail: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 30,
    left: 55,
  },
  videoContent: {
    padding: theme.spacing.sm,
  },
  videoTitle: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  featuredChip: {
    height: 20,
  },
  videosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'red',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyVideosContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  competencyProgress: {
    marginVertical: theme.spacing.sm,
  },
  competencyPercentage: {
    textAlign: 'right',
  },
});