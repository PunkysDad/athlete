import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles } from '../theme';

export default function HomeScreen() {
  return (
    <ScrollView style={commonStyles.containerPadded}>
      <View style={styles.header}>
        <Text style={commonStyles.heading2}>Welcome back, Jordan!</Text>
        <Text style={commonStyles.bodySecondary}>Ready to improve your game?</Text>
      </View>

      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="trending-up" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>This Week's Progress</Text>
          </View>
          <Text style={commonStyles.body}>3 training sessions completed</Text>
          <Text style={commonStyles.body}>2 new AI coaching conversations</Text>
          <Text style={commonStyles.body}>1 video uploaded</Text>
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="notifications" size={24} color={theme.colors.warning} />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>
          <Text style={commonStyles.body}>Coach Martinez reviewed your profile</Text>
          <Text style={commonStyles.body}>New message from teammate Alex</Text>
        </Card.Content>
      </Card>

      <Card style={commonStyles.card}>
        <Card.Content>
          <Text style={commonStyles.heading3}>Quick Actions</Text>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              icon="video" 
              style={styles.actionButton}
              buttonColor={theme.colors.primary}
            >
              Upload Video
            </Button>
            <Button 
              mode="outlined" 
              icon="psychology" 
              style={styles.actionButton}
              textColor={theme.colors.primary}
            >
              AI Coaching
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});