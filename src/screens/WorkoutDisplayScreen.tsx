import React, { useState, useEffect } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles } from '../theme';
import { Exercise, WorkoutData, TagResponse } from '../interfaces/interfaces';
import FormattedMessage from '../components/FormattedMessage';
import { RootStackParamList } from '../types/types';
import { apiService } from '../services/apiService';
import { getAuth } from 'firebase/auth';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const NAVY   = '#1a2744';
const RED    = '#c0392b';
const SILVER = '#b0bec5';
const BG     = '#f5f7fa';
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkoutDisplayScreen() {
  type WorkoutRequestNavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const route = useRoute();
  const navigation = useNavigation<WorkoutRequestNavigationProp>();
  const { workoutData } = route.params as { workoutData: WorkoutData };

  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  // Tag state
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [existingTags, setExistingTags] = useState<TagResponse[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<Set<number>>(new Set());
  const [tagsLoading, setTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#007AFF');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [savingTag, setSavingTag] = useState(false);

  const TAG_COLORS = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];

  const getCurrentUserId = async (): Promise<number | null> => {
    try {
      const firebaseUser = getAuth().currentUser;
      if (!firebaseUser) return null;
      const result = await apiService.getUserByFirebaseUid(firebaseUser.uid);
      if (result.success && result.data) return result.data.id;
      return null;
    } catch {
      return null;
    }
  };

  const openTagModal = async () => {
    setTagModalVisible(true);
    setTagsLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const result = await apiService.getUserTags(userId);
      if (result.success) setExistingTags(result.data);
    } finally {
      setTagsLoading(false);
    }
  };

  const toggleTagAssignment = async (tagId: number) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const isAssigned = assignedTagIds.has(tagId);
    try {
      if (isAssigned) {
        await apiService.removeTagFromWorkout(userId, Number(workoutData.id), tagId);
        setAssignedTagIds(prev => { const next = new Set(prev); next.delete(tagId); return next; });
      } else {
        await apiService.addTagToWorkout(userId, Number(workoutData.id), tagId);
        setAssignedTagIds(prev => new Set(prev).add(tagId));
      }
    } catch {
      Alert.alert('Error', 'Failed to update tag. Please try again.');
    }
  };

  const handleCreateAndAssignTag = async () => {
    if (!newTagName.trim()) return;
    setSavingTag(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const result = await apiService.createTag(userId, newTagName.trim(), newTagColor);
      if (!result.success) { Alert.alert('Error', result.error || 'Failed to create tag.'); return; }
      const newTag = result.data;
      setExistingTags(prev => [...prev, newTag]);
      // Call the API directly instead of toggleTagAssignment to avoid the stale
      // assignedTagIds state causing the toggle to go the wrong direction.
      await apiService.addTagToWorkout(userId, Number(workoutData.id), newTag.id);
      setAssignedTagIds(prev => new Set(prev).add(newTag.id));
      setNewTagName('');
      setNewTagColor('#007AFF');
      setShowNewTagInput(false);
    } finally {
      setSavingTag(false);
    }
  };

  const renderTagModal = () => (
    <Modal
      visible={tagModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setTagModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Tags</Text>
            <IconButton icon="close" size={20} onPress={() => setTagModalVisible(false)} />
          </View>

          {tagsLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={NAVY} />
          ) : (
            <>
              {existingTags.length > 0 && (
                <View style={styles.tagList}>
                  {existingTags.map(tag => {
                    const assigned = assignedTagIds.has(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagRow, assigned && { backgroundColor: tag.color + '20' }]}
                        onPress={() => toggleTagAssignment(tag.id)}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={styles.tagRowName}>{tag.name}</Text>
                        {assigned && <Icon name="check" size={18} color={tag.color} style={styles.tagCheck} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Divider style={{ marginVertical: 12 }} />

              {showNewTagInput ? (
                <View style={styles.newTagForm}>
                  <TextInput
                    style={styles.newTagInput}
                    placeholder="Tag name"
                    value={newTagName}
                    onChangeText={setNewTagName}
                    maxLength={100}
                    autoFocus
                  />
                  <View style={styles.colorRow}>
                    {TAG_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorSwatch, { backgroundColor: c }, newTagColor === c && styles.colorSwatchSelected]}
                        onPress={() => setNewTagColor(c)}
                      />
                    ))}
                  </View>
                  <View style={styles.newTagActions}>
                    <Button mode="text" textColor={NAVY} onPress={() => { setShowNewTagInput(false); setNewTagName(''); }}>
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      buttonColor={NAVY}
                      onPress={handleCreateAndAssignTag}
                      loading={savingTag}
                      disabled={!newTagName.trim() || savingTag}
                    >
                      Create & Add
                    </Button>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.createTagButton} onPress={() => setShowNewTagInput(true)}>
                  <Icon name="add" size={18} color={NAVY} />
                  <Text style={styles.createTagText}>Create new tag</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <Button mode="contained" buttonColor={NAVY} onPress={() => setTagModalVisible(false)} style={{ marginTop: 16 }}>
            Done
          </Button>
        </View>
      </View>
    </Modal>
  );

  const renderCustomTabBar = () => (
    <View style={styles.customTabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }], index: 0 } }] })}
      >
        <Icon name="home" size={24} color={SILVER} />
        <Text style={styles.tabLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }, { name: 'Profile' }], index: 1 } }] })}
      >
        <Icon name="person" size={24} color={SILVER} />
        <Text style={styles.tabLabel}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, styles.activeTab]}
        onPress={() => navigation.navigate('WorkoutRequest')}
      >
        <Icon name="fitness-center" size={24} color="#fff" />
        <Text style={[styles.tabLabel, styles.activeTabLabel]}>Workouts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }, { name: 'Profile' }, { name: 'Workouts' }, { name: 'Coaching' }], index: 3 } }] })}
      >
        <Icon name="psychology" size={24} color={SILVER} />
        <Text style={styles.tabLabel}>Coaching</Text>
      </TouchableOpacity>
    </View>
  );

  const parseWorkoutContent = () => {
    if (workoutData.exercises && workoutData.exercises.length > 0) {
      return {
        title: workoutData.workoutTitle || workoutData.title,
        description: workoutData.positionFocus || workoutData.description,
        exercises: workoutData.exercises,
      };
    }
    return { title: workoutData.title, description: workoutData.description, exercises: [] };
  };

  const { title: workoutTitle, description: workoutDescription, exercises } = parseWorkoutContent();

  const handleSaveWorkout = async () => {
    try {
      setSavedToLibrary(true);
      Alert.alert('Workout Saved!', 'This workout has been added to your personal library.', [{ text: 'OK' }]);
    } catch {
      Alert.alert('Save Failed', 'Unable to save workout. Please try again.', [{ text: 'OK' }]);
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
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseStats}>
                  {exercise.sets} sets • {exercise.reps} reps
                  {exercise.restSeconds && ` • ${Math.floor(exercise.restSeconds / 60)}:${(exercise.restSeconds % 60).toString().padStart(2, '0')} rest`}
                </Text>
              </View>
              <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={NAVY} />
            </View>
            <Text style={styles.exerciseDescription}>{exercise.description}</Text>
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
                    <Text style={[styles.detailText, styles.coachingCue]}>"{exercise.coachingCue}"</Text>
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
    <View style={styles.screen}>
      {renderTagModal()}

      {/* Navy header bar */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} iconColor="#fff" onPress={() => navigation.goBack()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{workoutTitle}</Text>
          <Text style={styles.headerSubtitle}>{workoutData.sport} • {workoutData.position}</Text>
        </View>
        <IconButton
          icon={savedToLibrary ? 'bookmark' : 'bookmark-outline'}
          size={24}
          iconColor={savedToLibrary ? RED : 'rgba(255,255,255,0.6)'}
          onPress={handleSaveWorkout}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Workout Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <View style={styles.overviewHeader}>
              <Icon name="fitness-center" size={20} color={NAVY} />
              <Text style={styles.overviewTitle}>Workout Overview</Text>
            </View>
            <Text style={styles.overviewDescription}>{workoutDescription}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutData.estimatedDuration}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{exercises.length}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutData.focusAreas.length}</Text>
                <Text style={styles.statLabel}>Focus Areas</Text>
              </View>
            </View>
            <View style={styles.focusAreasContainer}>
              <Text style={styles.focusAreasLabel}>Focus Areas:</Text>
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

        {/* Workout Details */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Workout Details</Text>
          {workoutData.generatedContent ? (
            <FormattedMessage text={workoutData.generatedContent} isUser={false} />
          ) : (
            <Card style={styles.placeholderCard}>
              <Card.Content>
                <Text style={{ textAlign: 'center', color: SILVER }}>Loading workout details...</Text>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={openTagModal}
            style={styles.outlineButton}
            textColor={NAVY}
            contentStyle={styles.buttonContent}
            icon="tag"
          >
            {assignedTagIds.size > 0 ? `Tags (${assignedTagIds.size})` : 'Add Tag'}
          </Button>
          <Button
            mode="contained"
            onPress={handleSaveWorkout}
            disabled={savedToLibrary}
            buttonColor={savedToLibrary ? SILVER : NAVY}
            style={styles.solidButton}
            contentStyle={styles.buttonContent}
            icon={savedToLibrary ? 'check' : 'bookmark-outline'}
          >
            {savedToLibrary ? 'Saved to Library' : 'Save to Library'}
          </Button>
        </View>

        {/* Assigned tags */}
        {assignedTagIds.size > 0 && (
          <View style={styles.assignedTagsRow}>
            {existingTags
              .filter(t => assignedTagIds.has(t.id))
              .map(t => (
                <Chip
                  key={t.id}
                  style={[styles.assignedTagChip, { backgroundColor: t.color + '20', borderColor: t.color }]}
                  textStyle={{ color: t.color, fontSize: 12 }}
                  mode="outlined"
                >
                  {t.name}
                </Chip>
              ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataText}>
            Generated on {new Date(workoutData.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metadataText}>Workout ID: {workoutData.id}</Text>
        </View>
      </ScrollView>

      {renderCustomTabBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerContent: { flex: 1, marginHorizontal: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // ── Content ─────────────────────────────────────────────────────────────────
  content: { flex: 1, padding: 16 },

  // ── Overview card ────────────────────────────────────────────────────────────
  overviewCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: NAVY,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
  },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  overviewTitle: { marginLeft: 8, fontWeight: '700', fontSize: 15, color: NAVY },
  overviewDescription: { fontSize: 14, lineHeight: 20, color: '#607d8b', marginBottom: 16 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#dde2e8' },
  statValue: { fontSize: 22, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 12, color: '#607d8b', marginTop: 2 },

  focusAreasContainer: { marginTop: 4 },
  focusAreasLabel: { fontSize: 13, fontWeight: '600', color: NAVY, marginBottom: 6 },
  focusAreasChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  focusChip: { borderColor: NAVY, backgroundColor: 'transparent', marginBottom: 4 },
  chipText: { fontSize: 12, color: NAVY },

  // ── Exercises ────────────────────────────────────────────────────────────────
  exercisesSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 10 },
  exerciseCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  exerciseStats: { fontSize: 13, color: NAVY, marginTop: 2, fontWeight: '500' },
  exerciseDescription: { fontSize: 13, lineHeight: 18, color: '#607d8b' },
  expandedContent: { marginTop: 8 },
  sectionDivider: { marginBottom: 8 },
  detailSection: { marginBottom: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  detailText: { fontSize: 13, lineHeight: 18, color: '#607d8b' },
  coachingCue: { fontStyle: 'italic', color: NAVY },
  placeholderCard: { backgroundColor: '#fff', borderStyle: 'dashed', borderWidth: 1, borderColor: '#dde2e8' },

  // ── Action buttons ───────────────────────────────────────────────────────────
  actionButtons: { marginTop: 20, gap: 10 },
  outlineButton: { borderColor: NAVY, borderRadius: 8 },
  solidButton: { borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },

  // ── Assigned tags ────────────────────────────────────────────────────────────
  assignedTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingHorizontal: 2 },
  assignedTagChip: { marginBottom: 4 },

  // ── Metadata ─────────────────────────────────────────────────────────────────
  metadataCard: { marginTop: 16, marginBottom: 32, paddingHorizontal: 4 },
  metadataText: { fontSize: 12, color: SILVER, marginBottom: 2 },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  activeTab: {},
  tabLabel: { fontSize: 12, color: SILVER, marginTop: 4 },
  activeTabLabel: { color: '#fff', fontWeight: '600' },

  // ── Tag modal ────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  tagList: { gap: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  tagDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  tagRowName: { flex: 1, fontSize: 15, color: '#2c3e50' },
  tagCheck: { marginLeft: 'auto' },
  createTagButton: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  createTagText: { color: NAVY, fontSize: 15, fontWeight: '500' },
  newTagForm: { gap: 12 },
  newTagInput: { borderWidth: 1, borderColor: '#dde2e8', borderRadius: 8, padding: 10, fontSize: 15 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchSelected: { borderWidth: 3, borderColor: NAVY },
  newTagActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});