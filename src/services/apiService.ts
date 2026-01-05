import { Platform } from 'react-native';
import { ApiResponse } from '../interfaces/interfaces';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

// For Android emulator, we need to use 10.0.2.2 instead of localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android' && __DEV__) {
    return API_BASE_URL.replace('localhost', '10.0.2.2');
  }
  return API_BASE_URL;
};

const BASE_URL = getBaseUrl();

// Generic API function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`API Call: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      data: {} as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// API Service Functions
export const apiService = {
  // Health check
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return apiCall('/actuator/health');
  },
};

// Connection test utility
export const testConnection = async (): Promise<boolean> => {
  const result = await apiService.checkHealth();
  if (result.success) {
    console.log('Backend connection successful:', result.data);
    return true;
  } else {
    console.error('Backend connection failed:', result.error);
    return false;
  }
};