import React, { useState, useRef } from 'react';
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
  Alert 
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme, commonStyles } from '../theme';
import FormattedMessage from '../components/FormattedMessage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface CoachingAnalysisResponse {
  sport: string;
  situation: string;
  recommendation: string;
  reasoning: string[];
  timestamp: string;
}

export default function CoachingScreen() {
  const [isInChat, setIsInChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get backend URL from environment
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:8080';

  const startChatSession = () => {
    const welcomeMessage: Message = {
      id: '1',
      text: "Hey! I'm your personal AI coach. I know you're a Point Guard in Basketball, so I can help with position-specific training, game IQ, and strategy. What do you want to work on?",
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setIsInChat(true);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Debug: Create proper coaching situation request
      const fullUrl = `${backendUrl}/api/v1/coaching/analyze?userId=1`;
      const requestBody = {
        sport: 'BASKETBALL',
        situation: {
          'question': userMessage.text,
          'position': 'Point Guard',
          'level': 'high school',
          'context': 'skill development'
        }
      };
      
      console.log('Calling backend URL:', fullUrl);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Call your backend coaching analysis endpoint
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Get the actual error response body
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Add Claude's response to chat - using recommendation from your CoachingAnalysisResponse
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.recommendation, // This matches your CoachingAnalysisResponse.recommendation
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll to bottom after AI response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please check that your backend server is running and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert(
        'Connection Error',
        'Unable to reach the coaching server. Make sure your backend is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const endChatSession = () => {
    setIsInChat(false);
    setMessages([]);
    setInputText('');
  };

  // Chat Interface
  if (isInChat) {
    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={endChatSession} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            <Text style={styles.chatHeaderTitle}>AI Coach</Text>
            <Text style={styles.chatHeaderSubtitle}>Basketball • Point Guard</Text>
          </View>
          <View style={styles.statusIndicator}>
            <Icon name="circle" size={8} color="#4CAF50" />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <FormattedMessage 
                  text={message.text}
                  isUser={message.isUser}
                />
              </View>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Coach is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your position, training, strategy..."
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Icon 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isLoading) ? '#ccc' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Main Coaching Screen (your existing layout)
  return (
    <ScrollView style={commonStyles.containerPadded}>
      <View style={styles.header}>
        <Text style={commonStyles.heading2}>AI Sports Coaching</Text>
        <Text style={commonStyles.bodySecondary}>Build your sports knowledge</Text>
      </View>

      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.cardHeader}>
            <Icon name="psychology" size={24} color={theme.colors.primary} />
            <Text style={commonStyles.heading3}>Start New Conversation</Text>
          </View>
          <Text style={commonStyles.body}>
            Get personalized coaching for YOUR position. Ask about training, game strategy, skill development, or anything to improve your game.
          </Text>
          <Button 
            mode="contained" 
            icon="chat"
            style={styles.startButton}
            buttonColor={theme.colors.primary}
            onPress={startChatSession}
          >
            Begin AI Coaching Session
          </Button>
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Your Sports IQ Progress</Text>
          <View style={styles.competencyRow}>
            <Chip mode="outlined" style={styles.chip}>Defensive Formations: 90%</Chip>
            <Chip mode="outlined" style={styles.chip}>Route Recognition: 70%</Chip>
            <Chip mode="outlined" style={styles.chip}>Game Strategy: 40%</Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={commonStyles.cardHeader}>
            <Icon name="history" size={24} color={theme.colors.secondary} />
            <Text style={commonStyles.heading3}>Recent Sessions</Text>
          </View>
          <Text style={commonStyles.body}>Your AI coaching conversation history will appear here.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.xl,
  },
  startButton: {
    marginTop: theme.spacing.md,
  },
  competencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  chip: {
    margin: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  
  // Chat Interface Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#f1f3f5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});