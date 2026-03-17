// src/components/onboarding/OnboardingFlow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { revenueCatService, SUBSCRIPTION_PRODUCTS } from '../../services/revenueCatService';
import { OnboardingData, OnboardingFlowProps } from '../../interfaces/interfaces';

// Sport and Position data
const SPORTS_DATA = {
  football: {
    name: 'Football',
    emoji: '🏈',
    positions: ['QB', 'RB', 'WR', 'OL', 'TE', 'LB', 'DB', 'DL']
  },
  basketball: {
    name: 'Basketball',
    emoji: '🏀',
    positions: ['PG', 'SG', 'SF', 'PF', 'C']
  },
  baseball: {
    name: 'Baseball',
    emoji: '⚾',
    positions: ['Pitcher', 'Catcher', 'Infield', 'Outfield']
  },
  soccer: {
    name: 'Soccer',
    emoji: '⚽',
    positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
  },
  hockey: {
    name: 'Hockey',
    emoji: '🏒',
    positions: ['Center', 'Winger', 'Defenseman', 'Goalie']
  }
};

// Subscription tiers (BASIC & PREMIUM only)
const SUBSCRIPTION_TIERS = [
  {
    id: 'BASIC',
    name: 'Basic',
    monthlyPrice: '$12.99/month',
    emoji: '⭐',
    features: [
      'AI coaching for your position',
      'Position-specific workout plans',
    ],
    popular: false
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    monthlyPrice: '$19.99/month', 
    emoji: '🚀',
    features: [
      'Approximately twice the amount of AI coaching chats than Basic',
      'Approximately twice the amount of workout plans than Basic',
      'SportsIQ tagging system to organize your chats and workouts',
      'Early access to new features'
    ],
    popular: true
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete, startAtStep, hideTrial }) => {
  const [currentStep, setCurrentStep] = useState(startAtStep ?? 1);
  const initialStep = startAtStep ?? 1;
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    sport: null,
    position: null,
    subscriptionTier: null,
    billingCycle: 'monthly'
  });

  const handleSportSelection = (sport: string) => {
    setOnboardingData(prev => ({ ...prev, sport, position: null }));
    setCurrentStep(2);
  };

  const handlePositionSelection = (position: string) => {
    setOnboardingData(prev => ({ ...prev, position }));
    setCurrentStep(3);
  };

  const syncSubscriptionToBackend = async (userId: number, tier: 'BASIC' | 'PREMIUM' | 'TRIAL') => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/${userId}/subscription`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionTier: tier }),
        }
      );
      if (!res.ok) {
        console.error('Failed to sync subscription tier to backend:', await res.text());
      }
    } catch (err) {
      console.error('Error syncing subscription to backend:', err);
    }
  };

  const handleSubscriptionSelection = async (tierData: { tier: string, billing: 'monthly' | 'annual' }) => {
    setIsLoading(true);
    try {
      const packages = await revenueCatService.getAvailablePackages();

      const targetProductId = tierData.tier === 'PREMIUM'
        ? SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY
        : SUBSCRIPTION_PRODUCTS.BASIC_MONTHLY;

      const packageToPurchase = packages.find(pkg =>
        pkg.product.identifier === targetProductId
      );

      if (!packageToPurchase) {
        throw new Error(`Subscription package not found: ${targetProductId}`);
      }

      const subscriptionInfo = await revenueCatService.purchaseSubscription(packageToPurchase);

      // Sync confirmed tier to backend so API enforcement stays in sync
      try {
        const firebaseUid = user?.uid;
        if (firebaseUid) {
          const userRes = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/firebase/${firebaseUid}`
          );
          const userData = await userRes.json();
          await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/${userData.id}/subscription`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriptionTier: subscriptionInfo.tier }),
            }
          );
        }
      } catch (syncErr) {
        // Non-fatal — user has paid, don't block onboarding completion
        console.error('Backend subscription sync failed:', syncErr);
      }

      onComplete({
        ...onboardingData,
        subscriptionTier: subscriptionInfo.tier,
        billingCycle: tierData.billing,
      });

    } catch (error: any) {
      const msg = error?.message ?? '';
      let errorMessage = 'Failed to process subscription. Please try again.';

      if (msg.includes('cancelled')) {
        errorMessage = 'Purchase was cancelled. You can try again anytime.';
      } else if (msg.includes('pending')) {
        errorMessage = 'Payment is pending approval. Check back in a few minutes.';
      } else if (msg.includes('not found')) {
        errorMessage = 'Subscription option temporarily unavailable. Please try again.';
      }

      Alert.alert(
        'Subscription Error',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => setIsLoading(false) },
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: () => onComplete({
              ...onboardingData,
              subscriptionTier: 'TRIAL',
              billingCycle: tierData.billing,
            }),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackButton = () => {
    if (currentStep > initialStep) {
      setCurrentStep(currentStep - 1);
    } else {
      onComplete({
        sport: null,
        position: null,
        subscriptionTier: null,
        billingCycle: 'monthly',
      });
    }
  };

  const renderSportSelection = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to SportsIQ!</Text>
        <Text style={styles.subtitle}>What sport do you want to master?</Text>
        <Text style={styles.stepIndicator}>Step 1 of 3</Text>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {Object.entries(SPORTS_DATA).map(([key, sport]) => (
            <TouchableOpacity
              key={key}
              style={styles.optionCard}
              onPress={() => handleSportSelection(key)}
            >
              <Text style={styles.optionEmoji}>{sport.emoji}</Text>
              <Text style={styles.optionText}>{sport.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  const renderPositionSelection = () => {
    const selectedSport = onboardingData.sport ? SPORTS_DATA[onboardingData.sport] : null;
    if (!selectedSport) return null;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Choose Your Position</Text>
          <Text style={styles.subtitle}>
            Select your primary position in {selectedSport.name}
          </Text>
          <Text style={styles.stepIndicator}>Step 2 of 3</Text>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {selectedSport.positions.map((position) => (
              <TouchableOpacity
                key={position}
                style={styles.optionCard}
                onPress={() => handlePositionSelection(position)}
              >
                <Text style={styles.optionEmoji}>{selectedSport.emoji}</Text>
                <Text style={styles.optionText}>{position}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  };

  const renderSubscriptionSelection = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Select the plan that works best for you
        </Text>
        <Text style={styles.stepIndicator}>Step 3 of 3</Text>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {/* Free Trial Option — hidden when existing subscriber is changing plans */}
          {!hideTrial && (
            <TouchableOpacity
              style={styles.trialCard}
              onPress={() => onComplete({
                ...onboardingData,
                subscriptionTier: 'TRIAL',
                billingCycle: 'monthly',
              })}
            >
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionEmoji}>🎯</Text>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionName}>Start Free Trial</Text>
                  <Text style={styles.trialPrice}>No credit card required</Text>
                </View>
              </View>
              <View style={styles.featuresList}>
                <Text style={styles.featureText}>• 3 AI coaching questions</Text>
                <Text style={styles.featureText}>• 1 position-specific workout plan</Text>
                <Text style={styles.featureText}>• Upgrade anytime</Text>
              </View>
            </TouchableOpacity>
          )}

          {!hideTrial && <Text style={styles.orDivider}>— or subscribe for full access —</Text>}

          {/* Paid Tiers */}
          {SUBSCRIPTION_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierSection}>
              <TouchableOpacity
                style={[styles.subscriptionCard, tier.popular && styles.popularCard]}
                onPress={() => handleSubscriptionSelection({ tier: tier.id, billing: 'monthly' })}
              >
                {tier.popular && <Text style={styles.popularBadge}>MOST POPULAR</Text>}

                <View style={styles.subscriptionHeader}>
                  <Text style={styles.subscriptionEmoji}>{tier.emoji}</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionName}>{tier.name}</Text>
                    <Text style={styles.subscriptionPrice}>{tier.monthlyPrice}</Text>
                  </View>
                </View>

                <View style={styles.featuresList}>
                  {tier.features.map((feature, index) => (
                    <Text key={index} style={styles.featureText}>• {feature}</Text>
                  ))}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  // Main render logic
  if (currentStep === 1) return renderSportSelection();
  if (currentStep === 2) return renderPositionSelection();
  if (currentStep === 3) return renderSubscriptionSelection();

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 20,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '500',
  },
  tierSection: {
    marginBottom: 24,
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularCard: {
    borderColor: '#0066FF',
    backgroundColor: '#f8f9ff',
  },
  annualCard: {
    backgroundColor: '#f0f8f0',
    borderColor: '#28a745',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#0066FF',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  annualBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#28a745',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066FF',
  },
  savingsText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 2,
  },
  featuresList: {
    paddingLeft: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  trialCard: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#0066FF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
  },
  trialPrice: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
    marginTop: 2,
  },
  orDivider: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginVertical: 16,
  },
});