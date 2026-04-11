import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { appTheme } from '../theme/appTheme';
import { theme } from '../theme';
import { componentStyles as cs } from '../theme/componentStyles';
import { TaggedItem } from '../interfaces/interfaces';
import { apiService } from '../services/apiService';
import FormattedMessage from './FormattedMessage';
import YoutubePlayerModal from './YoutubePlayerModal';

interface Props {
  item: TaggedItem | null;
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

const parseWorkoutData = (content: any) => {
  // Try to use structured exercises array first
  if (content.exercises && Array.isArray(content.exercises) && content.exercises.length > 0) {
    return {
      title: content.workoutTitle || content.title || '',
      description: content.positionFocus || content.description || '',
      exercises: content.exercises,
    };
  }
  // Fall back to parsing generatedContent JSON string
  if (content.generatedContent) {
    try {
      const parsed = JSON.parse(content.generatedContent);
      if (parsed.exercises && Array.isArray(parsed.exercises)) {
        return {
          title: parsed.workoutTitle || parsed.title || '',
          description: parsed.positionFocus || parsed.description || '',
          exercises: parsed.exercises,
        };
      }
    } catch {
      // Not JSON — return as plain text fallback
    }
    return { title: '', description: '', exercises: [], rawText: content.generatedContent };
  }
  return { title: '', description: '', exercises: [], rawText: null };
};

export default function TagContentBottomSheet({ item, visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [youtubeModalVisible, setYoutubeModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedExerciseVideoId, setSelectedExerciseVideoId] = useState<string | undefined>(undefined);
  const [selectedExerciseVideoTitle, setSelectedExerciseVideoTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!item || !visible) return;
    fetchContent(item);
  }, [item, visible]);

  const fetchContent = async (item: TaggedItem) => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      if (item.type === 'chat') {
        const result = await apiService.getConversationById(item.id);
        if (result.success) setContent(result.data);
        else setError('Failed to load conversation');
      } else {
        const result = await apiService.getWorkoutById(item.id);
        if (result.success) setContent(result.data);
        else setError('Failed to load workout');
      }
    } catch {
      setError('Something went wrong loading this content');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent(null);
    onClose();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.dragHandle} />
      <View style={styles.headerRow}>
        <View style={styles.headerMeta}>
          <Icon
            name={item?.type === 'chat' ? 'chat' : 'fitness-center'}
            size={18}
            color={appTheme.neonGreen}
          />
          <Text style={styles.headerType}>
            {item?.type === 'chat' ? 'Coaching Chat' : 'Workout Plan'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="close" size={22} color={appTheme.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle} numberOfLines={2}>{item?.title}</Text>
      <Text style={styles.headerDate}>{item?.date}</Text>
    </View>
  );

  const renderChatContent = () => {
    if (!content) return null;
    const questionMarker = 'question:';
    const idx = content.userMessage?.toLowerCase().indexOf(questionMarker) ?? -1;
    const question = idx !== -1
      ? content.userMessage.substring(idx + questionMarker.length).trim()
      : content.userMessage;

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionBubble}>
          <Text style={styles.questionLabel}>Your question</Text>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Coach response</Text>
          <FormattedMessage text={content.claudeResponse} isUser={false} />
        </View>

        <Text style={styles.metadata}>
          {content.sport} • {content.position} • {content.conversationType?.replace(/_/g, ' ')}
        </Text>
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  const renderWorkoutContent = () => {
    if (!content) return null;
    const { title, description, exercises, rawText } = parseWorkoutData(content);

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {[content.sport, content.position, content.difficultyLevel].filter(Boolean).map((val) => (
            <View key={val} style={styles.chip}>
              <Text style={styles.chipText}>{val}</Text>
            </View>
          ))}
        </View>

        {title ? <Text style={styles.workoutTitle}>{title}</Text> : null}
        {description ? <Text style={styles.workoutDescription}>{description}</Text> : null}

        {exercises.length > 0 ? (
          exercises.map((exercise: any, index: number) => {
            const isExpanded = expandedExercise === index;
            return (
              <TouchableOpacity
                key={index}
                style={styles.exerciseItem}
                onPress={() => setExpandedExercise(isExpanded ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseStats}>
                      {exercise.sets} sets • {exercise.reps} reps
                      {exercise.restSeconds ? ` • ${Math.floor(exercise.restSeconds / 60)}:${(exercise.restSeconds % 60).toString().padStart(2, '0')} rest` : ''}
                    </Text>
                  </View>
                  <Icon
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={appTheme.textMuted}
                  />
                </View>

                {exercise.description ? (
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                ) : null}

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.expandedDivider} />
                    {exercise.positionBenefit ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>🎯 Position Benefit</Text>
                        <Text style={styles.detailText}>{exercise.positionBenefit}</Text>
                      </View>
                    ) : null}
                    {exercise.gameApplication ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>🏈 Game Application</Text>
                        <Text style={styles.detailText}>{exercise.gameApplication}</Text>
                      </View>
                    ) : null}
                    {exercise.coachingCue ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>💬 Coaching Cue</Text>
                        <Text style={[styles.detailText, styles.coachingCue]}>"{exercise.coachingCue}"</Text>
                      </View>
                    ) : null}
                    {exercise.injuryPrevention ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>🛡️ Injury Prevention</Text>
                        <Text style={styles.detailText}>{exercise.injuryPrevention}</Text>
                      </View>
                    ) : null}
                    {/* Video button — shown when exercise is expanded */}
                    {exercise.videoId ? (
                      <TouchableOpacity
                        style={styles.watchAgainButton}
                        onPress={() => {
                          setSelectedExercise(exercise.name);
                          setSelectedExerciseVideoId(exercise.videoId);
                          setSelectedExerciseVideoTitle(exercise.videoTitle);
                          setYoutubeModalVisible(true);
                        }}
                      >
                        <Text style={styles.watchAgainText}>▶ Watch Again</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.showExamplesButton}
                        onPress={() => {
                          setSelectedExercise(exercise.name);
                          setSelectedExerciseVideoId(undefined);
                          setSelectedExerciseVideoTitle(undefined);
                          setYoutubeModalVisible(true);
                        }}
                      >
                        <Text style={styles.showExamplesText}>▶ Show Examples</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : rawText ? (
          <FormattedMessage text={rawText} isUser={false} />
        ) : (
          <Text style={{ color: appTheme.textMuted }}>No workout content available.</Text>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {renderHeader()}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.purple} />
            <Text style={[styles.metadata, { marginTop: theme.spacing.sm }]}>
              Loading content...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Icon name="error-outline" size={36} color={appTheme.textMuted} />
            <Text style={[styles.metadata, { marginTop: theme.spacing.sm, color: appTheme.purple }]}>
              {error}
            </Text>
          </View>
        ) : (
          item?.type === 'chat' ? renderChatContent() : renderWorkoutContent()
        )}
      </Animated.View>

      <YoutubePlayerModal
        visible={youtubeModalVisible}
        exerciseName={selectedExercise}
        onClose={() => {
          setYoutubeModalVisible(false);
          setSelectedExerciseVideoId(undefined);
          setSelectedExerciseVideoTitle(undefined);
        }}
        workoutId={Number(content?.id) || 0}
        savedVideoId={selectedExerciseVideoId}
        savedVideoTitle={selectedExerciseVideoTitle}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: 'rgba(8,11,20,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: appTheme.borderAccent,
  },

  header: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: appTheme.borderAccent,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#000'
  },
  headerType: {
    fontSize: 13,
    color: appTheme.neonGreen,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: appTheme.white,
    marginBottom: theme.spacing.xs,
  },
  headerDate: {
    fontSize: 12,
    color: appTheme.textMuted,
  },

  scrollContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.base,
    backgroundColor: 'transparent',
  },

  questionBubble: {
    backgroundColor: appTheme.bgElevated,
    borderRadius: 16,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: appTheme.purple,
    borderWidth: 1,
    borderColor: appTheme.borderAccent,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  questionText: {
    fontSize: 15,
    color: appTheme.text,
    lineHeight: 22,
  },

  responseContainer: {
    marginBottom: theme.spacing.base,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },

  metadata: {
    fontSize: 11,
    color: appTheme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.base,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.base,
  },
  chip: {
    backgroundColor: appTheme.purpleDim,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: appTheme.borderAccent,
  },
  chipText: {
    fontSize: 13,
    color: appTheme.purple,
    fontWeight: '600',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: appTheme.white,
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 14,
    color: appTheme.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  exerciseItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.white,
    marginBottom: 4,
  },
  exerciseStats: {
    fontSize: 13,
    color: appTheme.neonGreen,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 13,
    color: appTheme.textMuted,
    lineHeight: 18,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  expandedContent: {
    marginTop: 8,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: appTheme.border,
    marginBottom: 12,
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.text,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
    color: appTheme.textMuted,
  },
  coachingCue: {
    fontStyle: 'italic',
    color: appTheme.purple,
  },
  showExamplesButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: appTheme.neonGreen,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center' as const,
    backgroundColor: appTheme.neonGreenDim,
  },
  showExamplesText: {
    color: appTheme.neonGreen,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  watchAgainButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: appTheme.purple,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center' as const,
    backgroundColor: appTheme.purpleDim,
  },
  watchAgainText: {
    color: appTheme.purple,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
