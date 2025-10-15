import Constants from 'expo-constants';

// Type definition for environment configuration
interface EnvironmentConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_CLIENT_TOKEN: string;
  BACKEND_URL: string;
  APP_ENV: string;
}

// Extract environment variables from Expo config
const extra = Constants.expoConfig?.extra || {};

// Centralized configuration object
export const ENV_CONFIG: EnvironmentConfig = {
  FACEBOOK_APP_ID: extra.facebookAppId || '',
  FACEBOOK_CLIENT_TOKEN: extra.facebookClientToken || '',
  BACKEND_URL: extra.backendUrl || 'http://localhost:8080',
  APP_ENV: extra.appEnv || 'development',
};

// Validation function
const validateConfig = (): void => {
  const required: (keyof EnvironmentConfig)[] = ['FACEBOOK_APP_ID', 'FACEBOOK_CLIENT_TOKEN'];
  const missing = required.filter(key => {
    const value = ENV_CONFIG[key];
    return !value || value === 'undefined' || value === '';
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on import (skip in test environment)
if (ENV_CONFIG.APP_ENV !== 'test') {
  validateConfig();
}

export default ENV_CONFIG;