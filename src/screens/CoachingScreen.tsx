import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles } from '../theme';

export default function CoachingScreen() {
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
            Chat with AI to demonstrate your sports knowledge and improve your understanding of game strategy.
          </Text>
          <Button 
            mode="contained" 
            icon="chat"
            style={styles.startButton}
            buttonColor={theme.colors.primary}
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
});