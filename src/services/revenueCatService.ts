// src/services/revenueCatService.ts
import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';

export const SUBSCRIPTION_PRODUCTS = {
  BASIC_MONTHLY:   'gameiq_basic_monthly',
  PREMIUM_MONTHLY: 'gameiq_premium_monthly',
};

export const ENTITLEMENTS = {
  BASIC:   'gameiq_basic',
  PREMIUM: 'gameiq_premium',
};

export interface SubscriptionInfo {
  isActive: boolean;
  tier: 'BASIC' | 'PREMIUM' | 'TRIAL';
  productId?: string;
  expirationDate?: Date;
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId: string): Promise<void> {
    try {
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) throw new Error('RevenueCat API key not found in environment variables');

      await Purchases.configure({ apiKey });
      await Purchases.logIn(userId);
      this.isInitialized = true;
      console.log('RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    if (!this.isInitialized) throw new Error('RevenueCat not initialized');
    const customerInfo = await Purchases.getCustomerInfo();
    return this.parseCustomerInfo(customerInfo);
  }

  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    if (!this.isInitialized) throw new Error('RevenueCat not initialized');
    try {
      const offerings = await Purchases.getOfferings();
      const packages: PurchasesPackage[] = [];

      const basicOffering   = offerings.all['default_basic'];
      const premiumOffering = offerings.all['default_premium'];

      if (basicOffering)   packages.push(...basicOffering.availablePackages);
      if (premiumOffering) packages.push(...premiumOffering.availablePackages);

      console.log('Available packages:', packages.map(p => p.product.identifier));
      return packages;
    } catch (error) {
      console.error('Error getting packages:', error);
      return [];
    }
  }

  async purchaseSubscription(packageToPurchase: PurchasesPackage): Promise<SubscriptionInfo> {
    if (!this.isInitialized) throw new Error('RevenueCat not initialized');
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return this.parseCustomerInfo(customerInfo);
    } catch (error: any) {
      if (error?.code === 'PURCHASE_CANCELLED') throw new Error('Purchase was cancelled');
      if (error?.code === 'PAYMENT_PENDING')    throw new Error('Payment is pending approval');
      if (error?.code === 'PRODUCT_NOT_AVAILABLE') throw new Error('Product not available');
      throw new Error(`Purchase failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async restorePurchases(): Promise<SubscriptionInfo> {
    if (!this.isInitialized) throw new Error('RevenueCat not initialized');
    const customerInfo = await Purchases.restorePurchases();
    return this.parseCustomerInfo(customerInfo);
  }

  // ─── Use entitlements (not product ID string matching) ────────────────────
  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
    const active = customerInfo.entitlements.active;

    if (active[ENTITLEMENTS.PREMIUM]) {
      const ent = active[ENTITLEMENTS.PREMIUM];
      return {
        isActive: true,
        tier: 'PREMIUM',
        productId: ent.productIdentifier,
        expirationDate: ent.expirationDate ? new Date(ent.expirationDate) : undefined,
      };
    }

    if (active[ENTITLEMENTS.BASIC]) {
      const ent = active[ENTITLEMENTS.BASIC];
      return {
        isActive: true,
        tier: 'BASIC',
        productId: ent.productIdentifier,
        expirationDate: ent.expirationDate ? new Date(ent.expirationDate) : undefined,
      };
    }

    return { isActive: false, tier: 'TRIAL' };
  }
}

export const revenueCatService = new RevenueCatService();