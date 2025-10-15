import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏃‍♂️ Athlete Performance</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>
      
      {/* Your existing content can go here */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <Paragraph>Your performance tracking dashboard</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
});

export default HomeScreen;