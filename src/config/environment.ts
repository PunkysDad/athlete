// Type definition for environment configuration
interface EnvironmentConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_CLIENT_TOKEN: string;
  BACKEND_URL: string;
  APP_ENV: string;
}

// Simple environment configuration for development
export const ENV_CONFIG: EnvironmentConfig = {
  FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'dev-facebook-app-id',
  FACEBOOK_CLIENT_TOKEN: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || 'dev-client-token',
  BACKEND_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
};

// For development, we'll skip validation since we're using mock auth anyway
const validateConfig = (): void => {
  if (ENV_CONFIG.APP_ENV === 'production') {
    const required: (keyof EnvironmentConfig)[] = ['FACEBOOK_APP_ID', 'FACEBOOK_CLIENT_TOKEN'];
    const missing = required.filter(key => {
      const value = ENV_CONFIG[key];
      return !value || value === 'undefined' || value === '';
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Only validate in production
if (ENV_CONFIG.APP_ENV === 'production') {
  validateConfig();
}

// Log config for development debugging
console.log('Environment Config:', {
  BACKEND_URL: ENV_CONFIG.BACKEND_URL,
  APP_ENV: ENV_CONFIG.APP_ENV,
  // Don't log sensitive keys in production
  FACEBOOK_CONFIGURED: ENV_CONFIG.FACEBOOK_APP_ID !== 'dev-facebook-app-id'
});

export default ENV_CONFIG;