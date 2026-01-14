// src/services/revenueCatService.ts
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  LOG_LEVEL
} from 'react-native-purchases';

// Product IDs from App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  BASIC_MONTHLY: 'gameiq_basic_monthly',
  PREMIUM_MONTHLY: 'gameiq_premium_monthly',
  BASIC_ANNUAL: 'gameiq_basic_annual', // Optional
  PREMIUM_ANNUAL: 'gameiq_premium_annual' // Optional
};

export interface SubscriptionInfo {
  isActive: boolean;
  tier: 'BASIC' | 'PREMIUM' | 'NONE';
  productId?: string;
  expirationDate?: Date;
  billingCycle?: 'monthly' | 'annual';
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId: string): Promise<void> {
    try {
      // Use your actual API keys
      const apiKey = Platform.OS === 'ios' 
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        throw new Error('RevenueCat API key not found in environment variables');
      }

      // Remove verbose logging temporarily to avoid customLogHandler error
      // Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      await Purchases.configure({ apiKey });
      
      // Identify the user
      await Purchases.logIn(userId);
      
      this.isInitialized = true;
      console.log('RevenueCat initialized successfully for user:', userId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has any active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;
      
      if (activeSubscriptions.length === 0) {
        return {
          isActive: false,
          tier: 'NONE'
        };
      }

      // Check which tier is active
      const activeProductId = activeSubscriptions[0];
      let tier: 'BASIC' | 'PREMIUM' = 'BASIC';
      let billingCycle: 'monthly' | 'annual' = 'monthly';

      if (activeProductId.includes('premium')) {
        tier = 'PREMIUM';
      }
      if (activeProductId.includes('annual')) {
        billingCycle = 'annual';
      }

      // Get expiration date
      const entitlements = customerInfo.entitlements.active;
      const activeEntitlement = Object.values(entitlements)[0];
      const expirationDate = activeEntitlement?.expirationDate 
        ? new Date(activeEntitlement.expirationDate) 
        : undefined;

      return {
        isActive: true,
        tier,
        productId: activeProductId,
        expirationDate,
        billingCycle
      };
    } catch (error) {
      console.error('Error getting subscription info:', error);
      throw error;
    }
  }

  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      const packages: PurchasesPackage[] = [];
      
      // Access offerings by your actual identifiers
      const basicOffering = offerings.all['default_basic'];
      const premiumOffering = offerings.all['default_premium'];
      
      // Get Basic offering packages
      if (basicOffering) {
        packages.push(...basicOffering.availablePackages);
        console.log('Found default_basic offering with', basicOffering.availablePackages.length, 'packages');
      } else {
        console.warn('default_basic offering not found');
      }
      
      // Get Premium offering packages  
      if (premiumOffering) {
        packages.push(...premiumOffering.availablePackages);
        console.log('Found default_premium offering with', premiumOffering.availablePackages.length, 'packages');
      } else {
        console.warn('default_premium offering not found');
      }
      
      console.log('Total packages available:', packages.length);
      return packages;
    } catch (error) {
      console.error('Error getting available packages:', error);
      return [];
    }
  }

  async purchaseSubscription(packageToPurchase: PurchasesPackage): Promise<SubscriptionInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Return updated subscription info
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Purchase error:', error);
      
      // Handle specific error cases based on error properties
      if (error && typeof error === 'object' && 'code' in error) {
        const purchaseError = error as any;
        
        switch (purchaseError.code) {
          case 'PURCHASE_CANCELLED':
            throw new Error('Purchase was cancelled');
          case 'PAYMENT_PENDING':
            throw new Error('Payment is pending approval');
          case 'PRODUCT_NOT_AVAILABLE':
            throw new Error('Product not available');
          default:
            throw new Error(`Purchase failed: ${purchaseError.message || 'Unknown error'}`);
        }
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<SubscriptionInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.parseCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
    const activeSubscriptions = customerInfo.activeSubscriptions;
    
    if (activeSubscriptions.length === 0) {
      return {
        isActive: false,
        tier: 'NONE'
      };
    }

    const activeProductId = activeSubscriptions[0];
    let tier: 'BASIC' | 'PREMIUM' = 'BASIC';
    let billingCycle: 'monthly' | 'annual' = 'monthly';

    if (activeProductId.includes('premium')) {
      tier = 'PREMIUM';
    }
    if (activeProductId.includes('annual')) {
      billingCycle = 'annual';
    }

    const entitlements = customerInfo.entitlements.active;
    const activeEntitlement = Object.values(entitlements)[0];
    const expirationDate = activeEntitlement?.expirationDate 
      ? new Date(activeEntitlement.expirationDate) 
      : undefined;

    return {
      isActive: true,
      tier,
      productId: activeProductId,
      expirationDate,
      billingCycle
    };
  }
}

export const revenueCatService = new RevenueCatService();