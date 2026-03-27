import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Divider, ActivityIndicator as PaperIndicator, Portal } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import FormattedMessage from '../components/FormattedMessage';
import TrialLimitModal from '../components/TrialLimitModal';
import { apiService, TrialLimitError } from '../services/apiService';
import { TagResponse } from '../interfaces/interfaces';
import { useUpgrade } from '../context/UpgradeContext';
import { appTheme } from '../theme/appTheme';
import ENV_CONFIG from '../config/environment';

const TAG_COLORS = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface UserProfile {
  id: number;
  primarySport: string;
  primaryPosition: string;
  subscriptionTier?: string;
}

const COACHING_TIPS = [
  {
    sport: 'Football',
    bad:  "How do I read defenses better?",
    good: "How do I identify Cover 2 versus Cover 4 based on safety depth and corner alignment at the snap?",
  },
  {
    sport: 'Basketball',
    bad:  "How do I get better on offense?",
    good: "As a PG, how do I read a hedge-and-recover ball screen defense to decide between the pull-up, pocket pass, or reset?",
  },
  {
    sport: 'Baseball',
    bad:  "How do I hit better?",
    good: "How do I recognize a pitcher's curveball out of the hand versus a fastball based on spin and release point?",
  },
  {
    sport: 'Soccer',
    bad:  "How do I play better defensively?",
    good: "As a center back, how do I decide when to step and press versus hold my line when a striker receives the ball with their back to goal?",
  },
  {
    sport: 'Hockey',
    bad:  "How do I read plays better?",
    good: "As a defenseman, how do I identify an opposing winger's breakout pattern to anticipate an intercept opportunity at the blue line?",
  },
];

export default function CoachingScreen() {
  const [isInChat, setIsInChat]       = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [inputText, setInputText]     = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollViewRef                 = useRef<ScrollView>(null);
  const auth                          = getAuth();

  const [conversationId, setConversationId]   = useState<number | null>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [existingTags, setExistingTags]       = useState<TagResponse[]>([]);
  const [assignedTagIds, setAssignedTagIds]   = useState<Set<number>>(new Set());
  const [tagsLoading, setTagsLoading]         = useState(false);
  const [newTagName, setNewTagName]           = useState('');
  const [newTagColor, setNewTagColor]         = useState('#007AFF');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [savingTag, setSavingTag]             = useState(false);

  const [trialLimitVisible, setTrialLimitVisible] = useState(false);
  const [modalType, setModalType] = useState<'trial' | 'budgetBasic' | 'budgetPremium'>('trial');
  const { onUpgradePress } = useUpgrade();

  const backendUrl = ENV_CONFIG.BACKEND_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const res = await fetch(`${backendUrl}/api/v1/users/firebase/${currentUser.uid}`);
        if (res.ok) setUserProfile(await res.json());
      } catch (e) {
        console.error('Error fetching user profile:', e);
      }
    };
    fetchUserProfile();
  }, []);

  const startChatSession = () => {
    if (!userProfile) {
      Alert.alert('Error', 'Unable to load your profile. Please try again.');
      return;
    }
    setMessages([{
      id: '1',
      text: `Hey! I'm your personal AI coach. I know you're a ${userProfile.primaryPosition} in ${userProfile.primarySport}, so I can help with position-specific training, game IQ, and strategy. What do you want to work on?`,
      isUser: false,
      timestamp: new Date(),
    }]);
    setConversationId(null);
    setAssignedTagIds(new Set());
    setIsInChat(true);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !userProfile) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await fetch(
        `${backendUrl}/api/v1/coaching/analyze?userId=${userProfile.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sport: userProfile.primarySport,
            situation: { question: userMsg.text, position: userProfile.primaryPosition },
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        let backendMessage: string | null = null;
        try { backendMessage = JSON.parse(errText)?.message ?? null; } catch { /* not JSON */ }
        const msg = backendMessage ?? `HTTP ${res.status}: ${errText}`;

        if (backendMessage && backendMessage.includes('Monthly AI budget reached')) {
          if (userProfile?.subscriptionTier === 'PREMIUM') {
            setModalType('budgetPremium');
          } else {
            setModalType('budgetBasic');
          }
          setTrialLimitVisible(true);
          return;
        }

        if (
          backendMessage &&
          (backendMessage.includes('Trial') ||
            backendMessage.includes('trial') ||
            backendMessage.includes('limit reached') ||
            backendMessage.includes('budget reached') ||
            backendMessage.includes('subscription'))
        ) {
          setModalType('trial');
          setTrialLimitVisible(true);
          return;
        }

        throw new Error(msg);
      }
      const data = await res.json();
      if (conversationId === null && data.conversationId) {
        setConversationId(data.conversationId);
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: data.recommendation,
        isUser: false,
        timestamp: new Date(),
      }]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      if (error instanceof TrialLimitError) {
        setModalType('trial');
        setTrialLimitVisible(true);
        return;
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error.message || 'Unable to connect to coaching server'}`,
        isUser: false,
        timestamp: new Date(),
      }]);
      Alert.alert('Coaching Error', error.message || 'Unable to reach the coaching server.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const endChatSession = () => {
    setIsInChat(false);
    setMessages([]);
    setInputText('');
    setConversationId(null);
    setAssignedTagIds(new Set());
  };

  const openTagModal = async () => {
    if (!conversationId) {
      Alert.alert('Send a message first', 'Ask your coach a question before adding tags.');
      return;
    }
    if (!userProfile) return;
    setTagModalVisible(true);
    setTagsLoading(true);
    try {
      const result = await apiService.getUserTags(userProfile.id);
      if (result.success) setExistingTags(result.data);
    } finally {
      setTagsLoading(false);
    }
  };

  const toggleTagAssignment = async (tagId: number) => {
    if (!conversationId || !userProfile) return;
    const isAssigned = assignedTagIds.has(tagId);
    try {
      if (isAssigned) {
        await apiService.removeTagFromConversation(userProfile.id, conversationId, tagId);
        setAssignedTagIds(prev => { const next = new Set(prev); next.delete(tagId); return next; });
      } else {
        await apiService.addTagToConversation(userProfile.id, conversationId, tagId);
        setAssignedTagIds(prev => new Set(prev).add(tagId));
      }
    } catch {
      Alert.alert('Error', 'Failed to update tag. Please try again.');
    }
  };

  const handleCreateAndAssignTag = async () => {
    if (!newTagName.trim() || !userProfile) return;
    setSavingTag(true);
    try {
      const result = await apiService.createTag(userProfile.id, newTagName.trim(), newTagColor);
      if (!result.success) { Alert.alert('Error', result.error || 'Failed to create tag.'); return; }
      const newTag = result.data;
      setExistingTags(prev => [...prev, newTag]);
      if (conversationId) {
        await apiService.addTagToConversation(userProfile.id, conversationId, newTag.id);
        setAssignedTagIds(prev => new Set(prev).add(newTag.id));
      }
      setNewTagName('');
      setNewTagColor('#007AFF');
      setShowNewTagInput(false);
    } finally {
      setSavingTag(false);
    }
  };

  if (isInChat) {
    return (
      <View style={styles.chatContainer}>
        <TrialLimitModal
          visible={trialLimitVisible}
          limitType="chat"
          modalType={modalType}
          onDismiss={() => setTrialLimitVisible(false)}
          onUpgrade={() => {
            setTrialLimitVisible(false);
            onUpgradePress();
          }}
        />

        <Portal>
          <Modal
            visible={tagModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setTagModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Tags</Text>
                  <TouchableOpacity onPress={() => setTagModalVisible(false)} style={{ padding: 8 }}>
                    <Icon name="close" size={20} color={appTheme.white} />
                  </TouchableOpacity>
                </View>

                {tagsLoading ? (
                  <PaperIndicator style={{ marginVertical: 20 }} color={appTheme.red} />
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
                              {assigned && <Icon name="check" size={18} color={tag.color} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    <Divider style={{ marginVertical: 12, backgroundColor: appTheme.border }} />

                    {showNewTagInput ? (
                      <View style={styles.newTagForm}>
                        <TextInput
                          style={styles.newTagInput}
                          placeholder="Tag name"
                          placeholderTextColor={appTheme.textMuted}
                          value={newTagName}
                          onChangeText={setNewTagName}
                          maxLength={100}
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
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => { setShowNewTagInput(false); setNewTagName(''); }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.createButton, (!newTagName.trim() || savingTag) && { opacity: 0.5 }]}
                            onPress={handleCreateAndAssignTag}
                            disabled={!newTagName.trim() || savingTag}
                          >
                            {savingTag
                              ? <ActivityIndicator size="small" color={appTheme.white} />
                              : <Text style={styles.createButtonText}>Create & Add</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.createTagButton} onPress={() => setShowNewTagInput(true)}>
                        <Icon name="add" size={18} color={appTheme.red} />
                        <Text style={styles.createTagText}>Create new tag</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <TouchableOpacity
                  style={[styles.createButton, { marginTop: 16, alignSelf: 'stretch', alignItems: 'center' }]}
                  onPress={() => setTagModalVisible(false)}
                >
                  <Text style={styles.createButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={endChatSession} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={appTheme.white} />
            </TouchableOpacity>
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle}>AI Coach</Text>
              <Text style={styles.chatHeaderSubtitle}>
                {userProfile?.primarySport} • {userProfile?.primaryPosition}
              </Text>
            </View>
            <View style={styles.statusIndicator}>
              <Icon name="circle" size={8} color={appTheme.neonGreen} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[styles.messageWrapper, message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper]}
              >
                <View style={[styles.messageBubble, message.isUser ? styles.userMessage : styles.aiMessage]}>
                  <FormattedMessage text={message.text} isUser={message.isUser} />
                </View>
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={appTheme.red} />
                <Text style={styles.loadingText}>Coach is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {conversationId !== null && (
            <View style={styles.tagBar}>
              <TouchableOpacity style={styles.tagBarButton} onPress={openTagModal}>
                <Icon name="label" size={16} color={appTheme.red} />
                <Text style={styles.tagBarButtonText}>
                  {assignedTagIds.size > 0 ? `Tags (${assignedTagIds.size})` : 'Add Tag'}
                </Text>
              </TouchableOpacity>
              {assignedTagIds.size > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagChipScroll}>
                  {existingTags
                    .filter(t => assignedTagIds.has(t.id))
                    .map(t => (
                      <View key={t.id} style={[styles.tagChip, { borderColor: t.color, backgroundColor: t.color + '20' }]}>
                        <Text style={[styles.tagChipText, { color: t.color }]}>{t.name}</Text>
                      </View>
                    ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your position, training, strategy..."
              placeholderTextColor={appTheme.textMuted}
              multiline
              maxLength={500}
              editable={!isLoading}
              blurOnSubmit={true}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Icon name="send" size={20} color={(!inputText.trim() || isLoading) ? appTheme.textMuted : appTheme.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="psychology" size={22} color={appTheme.neonGreen} />
          <Text style={styles.cardTitle}>Start New Conversation</Text>
        </View>
        <Text style={styles.cardBody}>
          Get personalized coaching for YOUR position. Ask about training, game strategy, skill development, or anything to improve your game.
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { marginTop: 14, alignSelf: 'stretch', alignItems: 'center', opacity: userProfile ? 1 : 0.5 }]}
          onPress={startChatSession}
          disabled={!userProfile}
        >
          <Text style={styles.createButtonText}>{userProfile ? 'Begin AI Coaching Session' : 'Loading...'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <View style={styles.cardHeader}>
          <Icon name="lightbulb" size={22} color={appTheme.neonGreen} />
          <Text style={styles.cardTitle}>Tips for Better Coaching Questions</Text>
        </View>
        <Text style={styles.tipsIntro}>
          Specific questions get specific answers. Here's how to get the most out of your AI coach:
        </Text>
        {COACHING_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipSport}>{tip.sport}</Text>
            <View style={styles.tipBad}>
              <View style={styles.tipBadge}>
                <Icon name="close" size={12} color={appTheme.white} />
              </View>
              <Text style={styles.tipBadText}>{tip.bad}</Text>
            </View>
            <Icon name="arrow-downward" size={16} color={appTheme.textMuted} style={styles.tipArrow} />
            <View style={styles.tipGood}>
              <View style={[styles.tipBadge, styles.tipBadgeGood]}>
                <Icon name="check" size={12} color={appTheme.white} />
              </View>
              <Text style={styles.tipGoodText}>{tip.good}</Text>
            </View>
            {i < COACHING_TIPS.length - 1 && <View style={styles.tipDivider} />}
          </View>
        ))}
        <View style={styles.tipsHighlight}>
          <Icon name="info" size={14} color={appTheme.red} style={{ marginTop: 1 }} />
          <Text style={styles.tipsHighlightText}>
            Focus on specific game situations, formations, reads, or decisions — the more precise your question, the more actionable the answer.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appTheme.bg, padding: 16 },

  card: { backgroundColor: appTheme.bgCard, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: appTheme.border, padding: 16 },
  tipsCard: { backgroundColor: appTheme.bgCard, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: appTheme.red, marginBottom: 32, borderWidth: 1, borderColor: appTheme.border, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: appTheme.white },
  cardBody: { fontSize: 14, color: appTheme.textMuted, lineHeight: 20, marginBottom: 4 },

  tipsIntro: { fontSize: 13, color: appTheme.textMuted, lineHeight: 19, marginBottom: 16 },
  tipSport: { fontSize: 11, fontWeight: '700', color: appTheme.red, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  tipRow: { marginBottom: 4 },
  tipBad: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  tipGood: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  tipBadgeGood: { backgroundColor: '#22c55e' },
  tipBadText: { flex: 1, fontSize: 13, color: appTheme.textMuted, fontStyle: 'italic', lineHeight: 18 },
  tipGoodText: { flex: 1, fontSize: 13, color: appTheme.text, fontWeight: '500', lineHeight: 18 },
  tipArrow: { marginLeft: 4, marginVertical: 2 },
  tipDivider: { height: 1, backgroundColor: appTheme.border, marginVertical: 12 },
  tipsHighlight: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: appTheme.bgElevated, borderRadius: 6, padding: 10, marginTop: 16, gap: 6 },
  tipsHighlightText: { flex: 1, fontSize: 12, color: appTheme.textMuted, fontWeight: '500', lineHeight: 17 },

  chatContainer: { flex: 1, backgroundColor: appTheme.bg },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: appTheme.navyDark },
  backButton: { marginRight: 12 },
  chatHeaderContent: { flex: 1 },
  chatHeaderTitle: { fontSize: 17, fontWeight: '700', color: appTheme.white },
  chatHeaderSubtitle: { fontSize: 13, color: appTheme.textMuted, marginTop: 1 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, color: appTheme.neonGreen },

  messagesContainer: { flex: 1, backgroundColor: appTheme.bg },
  messagesContent: { padding: 16 },
  messageWrapper: { marginBottom: 12 },
  userMessageWrapper: { alignItems: 'flex-end' },
  aiMessageWrapper: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  userMessage: { backgroundColor: appTheme.red, borderBottomRightRadius: 4 },
  aiMessage: { backgroundColor: appTheme.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: appTheme.border },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  loadingText: { fontSize: 14, color: appTheme.textMuted, fontStyle: 'italic' },

  tagBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: appTheme.bgCard, borderTopWidth: 1, borderTopColor: appTheme.border, gap: 10 },
  tagBarButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: appTheme.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tagBarButtonText: { color: appTheme.red, fontSize: 13, fontWeight: '600' },
  tagChipScroll: { flex: 1 },
  tagChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  tagChipText: { fontSize: 12, fontWeight: '500' },

  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, backgroundColor: appTheme.bgCard, borderTopWidth: 1, borderTopColor: appTheme.border },
  textInput: { flex: 1, borderWidth: 1, borderColor: appTheme.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, marginRight: 12, maxHeight: 100, fontSize: 15, backgroundColor: appTheme.bgElevated, color: appTheme.text },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: appTheme.red, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: appTheme.border },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: appTheme.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: appTheme.border, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: appTheme.white },
  tagList: { gap: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  tagDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  tagRowName: { flex: 1, fontSize: 15, color: appTheme.text },
  createTagButton: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  createTagText: { color: appTheme.red, fontSize: 15, fontWeight: '500' },
  newTagForm: { gap: 12 },
  newTagInput: { borderWidth: 1, borderColor: appTheme.border, borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: appTheme.bgElevated, color: appTheme.text },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchSelected: { borderWidth: 3, borderColor: appTheme.white },
  newTagActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  cancelButtonText: { color: appTheme.textMuted, fontSize: 15 },
  createButton: { backgroundColor: appTheme.red, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  createButtonText: { color: appTheme.white, fontSize: 15, fontWeight: '600' },
});