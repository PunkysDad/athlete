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
import { Card, Button, Avatar } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { appTheme } from '../theme/appTheme';
import { theme, commonStyles } from '../theme';
import { apiService } from '../services/apiService';
import { UserService } from '../services/userService';
import { getAuth } from 'firebase/auth';
import {
  ActivityStats,
  TagWithItems,
  TaggedItem,
} from '../interfaces/interfaces';
import TagContentBottomSheet from '../components/TagContentBottomSheet';
import HistoryListModal from '../components/HistoryListModal';

export default function HomeScreen() {
  const auth = getAuth();
  const userService = new UserService();
  const [activeTab, setActiveTab] = useState('overview');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [backendConnected, setBackendConnected] = useState(false);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalChats: 0,
    totalWorkouts: 0,
    recentActivity: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [tagsWithItems, setTagsWithItems] = useState<TagWithItems[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());

  const [selectedItem, setSelectedItem] = useState<TaggedItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalType, setHistoryModalType] = useState<'chat' | 'workout'>('chat');

  // -------------------------------------------------------------------------
  // User resolution
  // -------------------------------------------------------------------------

  const getCurrentUser = async (): Promise<{ user: any; userId: number } | null> => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      const userData = await userService.checkUserExists(firebaseUser.uid);
      if (userData) return { user: userData, userId: userData.id };
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // -------------------------------------------------------------------------
  // Activity stats
  // -------------------------------------------------------------------------

  const loadActivityStats = async (userId: number) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const statsResult = await apiService.getUserStats(userId);
      if (statsResult.success) {
        setActivityStats({
          totalChats: statsResult.data.totalConversations || 0,
          totalWorkouts: statsResult.data.totalWorkouts || 0,
          recentActivity: statsResult.data.daysSinceLastActivity || 0,
        });
        setBackendConnected(true);
      } else {
        const [chatsResult, workoutsResult] = await Promise.all([
          apiService.getUserConversations(userId),
          apiService.getUserWorkouts(userId),
        ]);
        if (chatsResult.success && workoutsResult.success) {
          const allActivities = [
            ...chatsResult.data.map((c: any) => new Date(c.timestamp || c.createdAt)),
            ...workoutsResult.data.map((w: any) => new Date(w.createdAt)),
          ];
          const mostRecent = allActivities.length > 0
            ? Math.max(...allActivities.map(d => d.getTime()))
            : 0;
          const daysSince = mostRecent > 0
            ? Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24))
            : 0;
          setActivityStats({
            totalChats: chatsResult.data.length,
            totalWorkouts: workoutsResult.data.length,
            recentActivity: daysSince,
          });
          setBackendConnected(true);
        } else {
          setStatsError('Failed to load activity data');
        }
      }
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setStatsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const result = await apiService.checkHealth();
      setBackendConnected(result.success);
    } catch {
      setBackendConnected(false);
    }
  };

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const loadTagsWithContent = async (userId: number) => {
    setTagsLoading(true);
    try {
      const tagsResult = await apiService.getUserTags(userId);
      if (!tagsResult.success) return;

      const enriched: TagWithItems[] = await Promise.all(
        tagsResult.data.map(async (tag) => {
          const [convResult, workoutResult] = await Promise.all([
            apiService.getConversationsByTag(userId, tag.id),
            apiService.getWorkoutsByTag(userId, tag.id),
          ]);

          const chatItems: TaggedItem[] = (convResult.success ? convResult.data : []).map((c: any) => ({
            id: c.id,
            title: c.title || 'Coaching conversation',
            type: 'chat' as const,
            date: formatDate(c.createdAt),
          }));

          const workoutItems: TaggedItem[] = (workoutResult.success ? workoutResult.data : []).map((w: any) => ({
            id: w.id,
            title: w.title || `${w.position || ''} ${w.sport || ''} workout`.trim(),
            type: 'workout' as const,
            date: formatDate(w.createdAt),
          }));

          return { ...tag, items: [...chatItems, ...workoutItems] };
        })
      );

      const withContent = enriched.filter(t => t.items.length > 0);
      setTagsWithItems(withContent);
      setExpandedTags(new Set(withContent.map(t => t.id)));
    } catch (err) {
      console.error('Error loading tags:', err);
    } finally {
      setTagsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
  };

  const totalTaggedItems = tagsWithItems.reduce((sum, t) => sum + t.items.length, 0);

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      const initializeUser = async () => {
        setUserLoading(true);
        const result = await getCurrentUser();
        if (result) {
          setCurrentUser(result.user);
          setCurrentUserId(result.userId);
          testBackendConnection();
          await loadActivityStats(result.userId);
          await loadTagsWithContent(result.userId);
        } else {
          setStatsError('Please log in to view your activity stats');
        }
        setUserLoading(false);
        setFocusCount(prev => prev + 1);
      };
      initializeUser();
    }, [])
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStatCard = (label: string, value: number, icon: string, subtitle: string, onPress?: () => void) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Icon name={icon as any} size={22} color={appTheme.neonGreen} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View>
      {/* Profile Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <View>
              <Text style={styles.cardHeading}>
                {currentUser?.displayName || currentUser?.email || 'Athlete'}
              </Text>
              <Text style={styles.cardBody}>
                {currentUser?.primarySport || 'Sport'} • {currentUser?.primaryPosition || 'Position'}
              </Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>
                  {currentUser?.subscriptionTier || 'FREE'}
                </Text>
              </View>
            </View>
            {/* <Avatar.Icon
              size={64}
              icon="account"
              style={styles.avatar}
              color={appTheme.navy}
            /> */}
          </View>
        </Card.Content>
      </Card>

      {/* Activity Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.cardHeading}>Training Activity</Text>
            <Button
              mode="text"
              onPress={() => currentUserId && loadActivityStats(currentUserId)}
              textColor={appTheme.navy}
              disabled={statsLoading || !currentUserId}
            >
              {statsLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </View>

          {userLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={appTheme.navy} />
              <Text style={styles.cardCaption}>Loading user data...</Text>
            </View>
          ) : !currentUserId ? (
            <View style={styles.centered}>
              <Text style={[styles.cardCaption, { color: '#f59e0b' }]}>
                Please log in to view your training stats
              </Text>
            </View>
          ) : statsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={appTheme.navy} />
              <Text style={styles.cardCaption}>Loading activity stats...</Text>
            </View>
          ) : statsError ? (
            <View style={styles.centered}>
              <Text style={[styles.cardCaption, { color: appTheme.red }]}>{statsError}</Text>
              <Button
                mode="text"
                onPress={() => currentUserId && loadActivityStats(currentUserId)}
                textColor={appTheme.navy}
                compact
              >
                Retry
              </Button>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {renderStatCard('AI Chats', activityStats.totalChats, 'chat', 'Coaching conversations',
                () => { setHistoryModalType('chat'); setHistoryModalVisible(true); })}
              {renderStatCard('Workouts', activityStats.totalWorkouts, 'fitness-center', 'Generated plans',
                () => { setHistoryModalType('workout'); setHistoryModalVisible(true); })}
              {renderStatCard('Days Ago', activityStats.recentActivity, 'access-time', 'Last activity')}
              {renderStatCard('Total', activityStats.totalChats + activityStats.totalWorkouts, 'trending-up', 'AI interactions')}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const renderTagsTab = () => (
    <View>
      <View style={[commonStyles.rowBetween, { marginBottom: theme.spacing.base }]}>
        <Text style={styles.cardHeading}>My Tagged Content</Text>
        {tagsWithItems.length > 0 && (
          <Text style={styles.cardCaption}>
            {tagsWithItems.length} tags · {totalTaggedItems} items
          </Text>
        )}
      </View>

      {tagsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={appTheme.navy} />
          <Text style={[styles.cardCaption, { marginTop: theme.spacing.sm }]}>Loading tags...</Text>
        </View>
      ) : tagsWithItems.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.emptyState}>
              <Icon name="label-outline" size={48} color={appTheme.silver} />
              <Text style={[styles.cardBody, { marginTop: theme.spacing.base, textAlign: 'center' }]}>
                No tagged content yet
              </Text>
              <Text style={[styles.cardCaption, { marginTop: theme.spacing.xs, textAlign: 'center' }]}>
                Tag your coaching chats and workout plans to organize them here
              </Text>
            </View>
          </Card.Content>
        </Card>
      ) : (
        tagsWithItems.map(tag => {
          const isExpanded = expandedTags.has(tag.id);
          return (
            <View key={tag.id} style={styles.tagGroup}>
              <TouchableOpacity
                style={[styles.tagPill, { backgroundColor: tag.color + '33', borderColor: tag.color }]}
                onPress={() => toggleTag(tag.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagPillText, { color: tag.color }]}>{tag.name}</Text>
                <View style={[styles.tagCount, { backgroundColor: tag.color }]}>
                  <Text style={styles.tagCountText}>{tag.items.length}</Text>
                </View>
                <Icon
                  name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={18}
                  color={tag.color}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              {isExpanded && tag.items.map(item => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  style={styles.taggedItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedItem(item);
                    setSheetVisible(true);
                  }}
                >
                  <View style={styles.taggedItemIcon}>
                    <Icon
                      name={item.type === 'chat' ? 'chat' : 'fitness-center'}
                      size={18}
                      color={appTheme.neonGreen}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taggedItemTitle} numberOfLines={2} ellipsizeMode="tail">
                      {item.title}
                    </Text>
                    <Text style={styles.cardCaption}>
                      {item.type === 'chat' ? 'Chat' : 'Workout'} · {item.date}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={appTheme.silver} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })
      )}
    </View>
  );

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <View style={commonStyles.container}>
      {/* Header — matches site nav style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser?.primarySport
            ? `${currentUser.primarySport} · ${currentUser.primaryPosition}`
            : 'Your training overview'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview' },
          ...(currentUser?.subscriptionTier === 'PREMIUM'
            ? [{ key: 'tags', label: 'Tags' }]
            : []),
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'tags' && renderTagsTab()}
      </ScrollView>

      <TagContentBottomSheet
        item={selectedItem}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />

      <HistoryListModal
        visible={historyModalVisible}
        type={historyModalType}
        userId={currentUserId!}
        onClose={() => setHistoryModalVisible(false)}
        onSelectItem={(item) => {
          setHistoryModalVisible(false);
          setSelectedItem(item);
          setSheetVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: appTheme.navyDark,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appTheme.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: appTheme.textMuted,
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: appTheme.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: appTheme.red,
  },
  tabText: {
    fontSize: 15,
    color: appTheme.textMuted,
  },
  tabTextActive: {
    color: appTheme.white,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    padding: theme.spacing.base,
    backgroundColor: appTheme.bg,
  },

  // Cards
  card: {
    backgroundColor: appTheme.bgCard,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.base,
    borderWidth: 6,
    borderColor: appTheme.border,
    ...theme.shadows.sm,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.white,
  },
  cardBody: {
    fontSize: 14,
    color: appTheme.textMuted,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  cardCaption: {
    fontSize: 12,
    color: appTheme.textMuted,
    lineHeight: 16,
  },

  // Tier badge
  tierBadge: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: appTheme.red + '25',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: appTheme.red + '60',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.red,
    letterSpacing: 0.5,
  },

  avatar: {
    backgroundColor: appTheme.navyLight,
  },

  // Stats grid
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
    backgroundColor: appTheme.bgElevated,
    borderWidth: 1,
    borderColor: appTheme.border,
    borderLeftWidth: 3,
    borderLeftColor: appTheme.red,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: appTheme.white,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
    color: appTheme.text,
  },
  statSubtitle: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 10,
    color: appTheme.textMuted,
  },

  centered: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  // Tags
  tagGroup: {
    marginBottom: theme.spacing.lg,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: theme.spacing.sm,
  },
  tagPillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  tagCount: {
    marginLeft: theme.spacing.sm,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tagCountText: {
    color: appTheme.white,
    fontSize: 12,
    fontWeight: '700',
  },
  taggedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.bgElevated,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  taggedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appTheme.neonGreen + '20',  // ← change this line
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.base,
  },
  taggedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 2,
  },
});