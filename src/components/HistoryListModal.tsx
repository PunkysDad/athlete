import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { appTheme } from '../theme/appTheme';
import { theme } from '../theme';
import { TaggedItem } from '../interfaces/interfaces';
import { apiService } from '../services/apiService';

interface Props {
  visible: boolean;
  type: 'chat' | 'workout';
  userId: number;
  onClose: () => void;
  onSelectItem: (item: TaggedItem) => void;
}

const extractQuestion = (userMessage: string): string => {
  const match = userMessage.match(/question:\s*([^,]+)/i);
  return match ? match[1].trim() : userMessage;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function HistoryListModal({ visible, type, userId, onClose, onSelectItem }: Props) {
  const [items, setItems] = useState<TaggedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    loadItems();
  }, [visible, type]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      if (type === 'chat') {
        const result = await apiService.getUserConversations(userId);
        if (result.success) {
          const sorted = [...result.data].sort(
            (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setItems(sorted.map((c: any) => ({
            id: c.id,
            title: extractQuestion(c.userMessage),
            type: 'chat' as const,
            date: formatDate(c.timestamp),
          })));
        } else {
          setError('Failed to load chat history');
        }
      } else {
        const result = await apiService.getUserWorkouts(userId);
        if (result.success) {
          const sorted = [...result.data].sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setItems(sorted.map((w: any) => ({
            id: w.id,
            title: w.title || `${w.position} ${w.sport} Workout`,
            type: 'workout' as const,
            date: formatDate(w.createdAt),
          })));
        } else {
          setError('Failed to load workout history');
        }
      }
    } catch {
      setError('Something went wrong loading history');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: TaggedItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelectItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>
        <Icon
          name={type === 'chat' ? 'chat' : 'fitness-center'}
          size={18}
          color={appTheme.neonGreen}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rowDate}>{item.date}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={appTheme.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-back" size={24} color={appTheme.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'chat' ? 'AI Chat History' : 'Workout History'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.red} />
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Icon name="error-outline" size={40} color={appTheme.textMuted} />
            <Text style={[styles.emptyText, { color: appTheme.red }]}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Icon
              name={type === 'chat' ? 'chat-bubble-outline' : 'fitness-center'}
              size={48}
              color={appTheme.textMuted}
            />
            <Text style={styles.emptyText}>
              {type === 'chat' ? 'No coaching chats yet' : 'No workouts generated yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => `${item.type}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appTheme.navyDark,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  closeButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.white,
  },
  list: {
    padding: theme.spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.bgCard,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appTheme.neonGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.base,
  },
  rowContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 3,
  },
  rowDate: {
    fontSize: 12,
    color: appTheme.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: appTheme.textMuted,
    marginTop: theme.spacing.sm,
  },
});