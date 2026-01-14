// src/components/onboarding/OnboardingFlow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { revenueCatService, SUBSCRIPTION_PRODUCTS } from '../../services/revenueCatService';

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
    monthlyPrice: '$11.99/month',
    annualPrice: '$95.99/year',
    annualSavings: 'Save $48/year',
    emoji: '⭐',
    features: [
      'AI coaching for your position',
      'Unlimited quizzes & IQ tracking',
      'Position-specific workout plans',
      'Basic progress tracking',
      'Ad-free experience'
    ],
    popular: true
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    monthlyPrice: '$16.99/month', 
    annualPrice: '$135.99/year',
    annualSavings: 'Save $68/year',
    emoji: '🚀',
    features: [
      'AI coaching for ALL sports/positions',
      'Advanced workout generation',
      'Detailed progress analytics',
      'Social sharing features',
      'Priority support',
      'Early access to new features'
    ],
    popular: false
  }
];

interface OnboardingData {
  sport: string | null;
  position: string | null;
  subscriptionTier: string | null;
  billingCycle: 'monthly' | 'annual';
}

interface OnboardingFlowProps {
  user: any; // Firebase user
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleSubscriptionSelection = async (tierData: { tier: string, billing: 'monthly' | 'annual' }) => {
    try {
      // Show loading state
      setIsLoading(true);

      // Get available packages from RevenueCat
      const packages = await revenueCatService.getAvailablePackages();
      
      // Find the matching package based on user selection
      let targetProductId = '';
      if (tierData.tier === 'BASIC' && tierData.billing === 'monthly') {
        targetProductId = SUBSCRIPTION_PRODUCTS.BASIC_MONTHLY;
      } else if (tierData.tier === 'PREMIUM' && tierData.billing === 'monthly') {
        targetProductId = SUBSCRIPTION_PRODUCTS.PREMIUM_MONTHLY;
      } else if (tierData.tier === 'BASIC' && tierData.billing === 'annual') {
        targetProductId = SUBSCRIPTION_PRODUCTS.BASIC_ANNUAL;
      } else if (tierData.tier === 'PREMIUM' && tierData.billing === 'annual') {
        targetProductId = SUBSCRIPTION_PRODUCTS.PREMIUM_ANNUAL;
      }

      console.log('Looking for product:', targetProductId);
      console.log('Available packages:', packages.map(p => p.product.identifier));

      const packageToPurchase = packages.find(pkg => 
        pkg.product.identifier === targetProductId
      );

      if (!packageToPurchase) {
        throw new Error(`Subscription package not found: ${targetProductId}`);
      }

      console.log('Attempting to purchase:', packageToPurchase.product.title);

      // Trigger actual App Store purchase
      const subscriptionInfo = await revenueCatService.purchaseSubscription(packageToPurchase);

      console.log('Purchase successful:', subscriptionInfo);

      // Purchase successful - complete onboarding with actual subscription data
      const finalData = { 
        ...onboardingData, 
        subscriptionTier: subscriptionInfo.tier,
        billingCycle: subscriptionInfo.billingCycle || tierData.billing,
        isSubscriptionActive: subscriptionInfo.isActive
      };

      setOnboardingData(finalData);
      onComplete(finalData);

    } catch (error) {
      console.error('Subscription purchase failed:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to process subscription. Please try again.';
      
      if (error.message.includes('cancelled')) {
        errorMessage = 'Purchase was cancelled. You can try again anytime.';
      } else if (error.message.includes('pending')) {
        errorMessage = 'Payment is pending approval. Check back in a few minutes.';
      } else if (error.message.includes('not found')) {
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
            onPress: () => {
              // Allow user to complete onboarding without subscription
              const finalData = { 
                ...onboardingData, 
                subscriptionTier: 'NONE',
                billingCycle: tierData.billing,
                isSubscriptionActive: false
              };
              onComplete(finalData);
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackButton = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderSportSelection = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to GameIQ!</Text>
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
          {SUBSCRIPTION_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierSection}>
              {/* Monthly Option */}
              <TouchableOpacity
                style={[
                  styles.subscriptionCard,
                  tier.popular && styles.popularCard
                ]}
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

              {/* Annual Option */}
              <TouchableOpacity
                style={[styles.subscriptionCard, styles.annualCard]}
                onPress={() => handleSubscriptionSelection({ tier: tier.id, billing: 'annual' })}
              >
                <Text style={styles.annualBadge}>SAVE MONEY</Text>
                
                <View style={styles.subscriptionHeader}>
                  <Text style={styles.subscriptionEmoji}>{tier.emoji}</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionName}>{tier.name} Annual</Text>
                    <Text style={styles.subscriptionPrice}>{tier.annualPrice}</Text>
                    <Text style={styles.savingsText}>{tier.annualSavings}</Text>
                  </View>
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
});