import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles } from '../theme';
import { Exercise, WorkoutData } from '../interfaces/interfaces';
import FormattedMessage from '../components/FormattedMessage';
import { RootStackParamList } from '../types/types';

export default function WorkoutDisplayScreen() {
  type WorkoutRequestNavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const route = useRoute();
  const navigation = useNavigation<WorkoutRequestNavigationProp>();
  const { workoutData } = route.params as { workoutData: WorkoutData };

  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const renderCustomTabBar = () => (
    <View style={styles.customTabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                state: {
                  routes: [{ name: 'Home' }],
                  index: 0, // ← This should be 0 for Home tab
                },
              },
            ],
          });
        }}
      >
        <Icon name="home" size={24} color="#666" />
        <Text style={styles.tabLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                state: {
                  routes: [{ name: 'Home' }, { name: 'Profile' }], // ← Add all tabs up to Profile
                  index: 1, // ← This should be 1 for Profile tab
                },
              },
            ],
          });
        }}
      >
        <Icon name="person" size={24} color="#666" />
        <Text style={styles.tabLabel}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, styles.activeTab]}
        onPress={() => navigation.navigate('WorkoutRequest')}
      >
        <Icon name="fitness-center" size={24} color="#0066FF" />
        <Text style={[styles.tabLabel, styles.activeTabLabel]}>Workouts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                state: {
                  routes: [
                    { name: 'Home' },
                    { name: 'Profile' },
                    { name: 'Workouts' },
                    { name: 'Coaching' }
                  ], // ← Include all tabs
                  index: 3, // ← This should be 3 for Coaching tab (0-indexed)
                },
              },
            ],
          });
        }}
      >
        <Icon name="psychology" size={24} color="#666" />
        <Text style={styles.tabLabel}>Coaching</Text>
      </TouchableOpacity>
    </View>
  );
  // Parse the generated content if it exists (from Claude JSON)
  const parseWorkoutContent = () => {
    // If we have structured exercise data, use it
    if (workoutData.exercises && workoutData.exercises.length > 0) {
      return {
        title: workoutData.workoutTitle || workoutData.title,
        description: workoutData.positionFocus || workoutData.description,
        exercises: workoutData.exercises
      };
    }

    // Fallback for empty exercises array
    return {
      title: workoutData.title,
      description: workoutData.description,
      exercises: []
    };
  };

  const { title: workoutTitle, description: workoutDescription, exercises } = parseWorkoutContent();

  const handleSaveWorkout = async () => {
    try {
      // TODO: Call API to mark workout as saved (isSaved = true)
      // const result = await workoutApiService.saveWorkout(workoutData.id);

      // For now, simulate the save
      setSavedToLibrary(true);
      Alert.alert(
        'Workout Saved!',
        'This workout has been added to your personal library.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Save Failed',
        'Unable to save workout. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleExerciseDetails = (index: number) => {
    setExpandedExercise(expandedExercise === index ? null : index);
  };

  const renderExercise = (exercise: Exercise, index: number) => {
    const isExpanded = expandedExercise === index;

    return (
      <Card key={index} style={styles.exerciseCard}>
        <TouchableOpacity onPress={() => toggleExerciseDetails(index)}>
          <Card.Content>
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={[commonStyles.body, styles.exerciseName]}>{exercise.name}</Text>
                <Text style={[commonStyles.caption, styles.exerciseStats]}>
                  {exercise.sets} sets • {exercise.reps} reps
                  {exercise.restSeconds && ` • ${Math.floor(exercise.restSeconds / 60)}:${(exercise.restSeconds % 60).toString().padStart(2, '0')} rest`}
                </Text>
              </View>
              <Icon
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={24}
                color={theme.colors.primary}
              />
            </View>

            {/* Basic Description - Always Visible */}
            <Text style={[commonStyles.caption, styles.exerciseDescription]}>
              {exercise.description}
            </Text>

            {/* Expanded Details */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                <Divider style={styles.sectionDivider} />

                {exercise.positionBenefit && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>🎯 Position Benefit</Text>
                    <Text style={styles.detailText}>{exercise.positionBenefit}</Text>
                  </View>
                )}

                {exercise.gameApplication && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>🏈 Game Application</Text>
                    <Text style={styles.detailText}>{exercise.gameApplication}</Text>
                  </View>
                )}

                {exercise.coachingCue && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>💬 Coaching Cue</Text>
                    <Text style={[styles.detailText, styles.coachingCue]}>
                      "{exercise.coachingCue}"
                    </Text>
                  </View>
                )}

                {exercise.injuryPrevention && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>🛡️ Injury Prevention</Text>
                    <Text style={styles.detailText}>{exercise.injuryPrevention}</Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.primary}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerContent}>
          <Text style={[commonStyles.heading2, styles.headerTitle]} numberOfLines={1}>
            {workoutTitle}
          </Text>
          <Text style={[commonStyles.caption, styles.headerSubtitle]}>
            {workoutData.sport} • {workoutData.position}
          </Text>
        </View>
        <IconButton
          icon={savedToLibrary ? "bookmark" : "bookmark-outline"}
          size={24}
          iconColor={savedToLibrary ? theme.colors.primary : theme.colors.textSecondary}
          onPress={handleSaveWorkout}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Workout Overview */}
        <Card style={[commonStyles.card, styles.overviewCard]}>
          <Card.Content>
            <View style={styles.overviewHeader}>
              <Icon name="fitness-center" size={20} color={theme.colors.primary} />
              <Text style={[commonStyles.body, styles.overviewTitle]}>Workout Overview</Text>
            </View>

            <Text style={[commonStyles.caption, styles.overviewDescription]}>
              {workoutDescription}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutData.estimatedDuration}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{exercises.length}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutData.focusAreas.length}</Text>
                <Text style={styles.statLabel}>Focus Areas</Text>
              </View>
            </View>

            {/* Focus Areas */}
            <View style={styles.focusAreasContainer}>
              <Text style={[commonStyles.caption, styles.focusAreasLabel]}>Focus Areas:</Text>
              <View style={styles.focusAreasChips}>
                {workoutData.focusAreas.map((area, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    textStyle={styles.chipText}
                    style={styles.focusChip}
                  >
                    {area}
                  </Chip>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Exercises Section */}
        <View style={styles.exercisesSection}>
          <Text style={[commonStyles.heading3, styles.sectionTitle]}>
            Workout Details
          </Text>

          {workoutData.generatedContent ? (
            <FormattedMessage
              text={workoutData.generatedContent}
              isUser={false}
            />
          ) : (
            <Card style={styles.placeholderCard}>
              <Card.Content>
                <Text style={[commonStyles.body, { textAlign: 'center' }]}>
                  Loading workout details...
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleSaveWorkout}
            disabled={savedToLibrary}
            style={[styles.actionButton, styles.secondaryButton]}
            textColor={theme.colors.primary}
            contentStyle={styles.buttonContent}
          >
            {savedToLibrary ? 'Saved to Library' : 'Save to Library'}
          </Button>
        </View>

        {/* Workout Metadata */}
        <Card style={[commonStyles.card, styles.metadataCard]}>
          <Card.Content>
            <Text style={[commonStyles.caption, styles.metadataText]}>
              Generated on {new Date(workoutData.createdAt).toLocaleDateString()}
            </Text>
            <Text style={[commonStyles.caption, styles.metadataText]}>
              Workout ID: {workoutData.id}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
      {renderCustomTabBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  overviewCard: {
    backgroundColor: theme.colors.primaryLight + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  overviewTitle: {
    marginLeft: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  overviewDescription: {
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  focusAreasContainer: {
    marginTop: theme.spacing.sm,
  },
  focusAreasLabel: {
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  focusAreasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  focusChip: {
    marginBottom: theme.spacing.xs,
  },
  chipText: {
    fontSize: 12,
  },
  exercisesSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  exerciseCard: {
    marginBottom: theme.spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
  },
  exerciseStats: {
    color: theme.colors.primary,
    marginTop: 2,
  },
  exerciseDescription: {
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  expandedContent: {
    marginTop: theme.spacing.sm,
  },
  sectionDivider: {
    marginBottom: theme.spacing.sm,
  },
  detailSection: {
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  coachingCue: {
    fontStyle: 'italic',
    color: theme.colors.primary,
  },
  placeholderCard: {
    backgroundColor: theme.colors.surface,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtons: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    borderRadius: theme.borderRadius.base,
  },
  primaryButton: {
    elevation: 0,
  },
  secondaryButton: {
    borderColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  metadataCard: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  metadataText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active tab styling
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#0066FF',
    fontWeight: '600',
  },
});