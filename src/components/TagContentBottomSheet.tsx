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
import { appTheme } from '../theme/appTheme';
import { theme, commonStyles } from '../theme';
import { TaggedItem } from '../interfaces/interfaces';
import { apiService } from '../services/apiService';
import FormattedMessage from './FormattedMessage';

interface Props {
  item: TaggedItem | null;
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function TagContentBottomSheet({ item, visible, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            color="#0066FF"
          />
          <Text style={styles.headerType}>
            {item?.type === 'chat' ? 'Coaching Chat' : 'Workout Plan'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="close" size={22} color={appTheme.textLight} />
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
        {/* User question — highlight block matching site style */}
        <View style={styles.questionBubble}>
          <Text style={styles.questionLabel}>Your question</Text>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* Coach response */}
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
    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sport / position chips */}
        <View style={styles.chipRow}>
          {[content.sport, content.position, content.difficultyLevel].filter(Boolean).map((val) => (
            <View key={val} style={styles.chip}>
              <Text style={styles.chipText}>{val}</Text>
            </View>
          ))}
        </View>

        {content.generatedContent ? (
          <FormattedMessage text={content.generatedContent} isUser={false} />
        ) : (
          <Text style={{ color: appTheme.textLight }}>No workout content available.</Text>
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
            <ActivityIndicator size="large" color={appTheme.navy} />
            <Text style={[styles.metadata, { marginTop: theme.spacing.sm }]}>
              Loading content...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Icon name="error-outline" size={36} color={appTheme.silver} />
            <Text style={[styles.metadata, { marginTop: theme.spacing.sm, color: appTheme.red }]}>
              {error}
            </Text>
          </View>
        ) : (
          item?.type === 'chat' ? renderChatContent() : renderWorkoutContent()
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: appTheme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...theme.shadows.sm,
  },

  // Header — white with navy text, matching site card style
  header: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.gray,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: appTheme.silver,
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
  },
  headerType: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.navy,
    marginBottom: theme.spacing.xs,
  },
  headerDate: {
    fontSize: 12,
    color: appTheme.textLight,
  },

  scrollContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.base,
    backgroundColor: appTheme.gray,
  },

  // Question bubble — mirrors site .highlight block
  questionBubble: {
    backgroundColor: appTheme.white,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: appTheme.navy,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.navy,
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
    color: appTheme.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },

  metadata: {
    fontSize: 11,
    color: appTheme.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.base,
  },

  // Chips — navy tint background matching site palette
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.base,
  },
  chip: {
    backgroundColor: appTheme.navy + '18',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: appTheme.navy + '30',
  },
  chipText: {
    fontSize: 13,
    color: appTheme.navy,
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
});