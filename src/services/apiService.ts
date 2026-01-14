import { Platform } from 'react-native';
import { ActivityStats, ApiResponse } from '../interfaces/interfaces';

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

  // Get user stats from /users/{userId}/stats endpoint
  async getUserStats(userId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/stats`);
  },

  // Get user's conversation history
  async getUserConversations(userId: number): Promise<ApiResponse<any[]>> {
    return apiCall(`/api/v1/conversations/user/${userId}`);
  },

  // Get user's workout history
  async getUserWorkouts(userId: number): Promise<ApiResponse<any[]>> {
    return apiCall(`/api/v1/workouts/user/${userId}`);
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

// Activity stats helper function (transforms backend data to frontend format)
export const getActivityStats = async (userId: number): Promise<ApiResponse<ActivityStats>> => {
  try {
    // Try to get stats from the stats endpoint first
    const statsResult = await apiService.getUserStats(userId);
    
    if (statsResult.success && statsResult.data.totalConversations !== undefined) {
      // Transform backend UserStatsResponse to frontend ActivityStats
      const activityStats: ActivityStats = {
        totalChats: statsResult.data.totalConversations || 0,
        totalWorkouts: statsResult.data.totalWorkouts || 0,
        recentActivity: statsResult.data.daysSinceLastActivity || 0
      };
      return { success: true, data: activityStats };
    }

    // Fallback: Get data from individual endpoints
    const [chatsResult, workoutsResult] = await Promise.all([
      apiService.getUserConversations(userId),
      apiService.getUserWorkouts(userId)
    ]);

    if (chatsResult.success && workoutsResult.success) {
      // Calculate recent activity (days since last chat or workout)
      const allActivities = [
        ...chatsResult.data.map((c: any) => new Date(c.timestamp || c.createdAt)),
        ...workoutsResult.data.map((w: any) => new Date(w.createdAt))
      ];
      
      const mostRecentActivity = allActivities.length > 0 
        ? Math.max(...allActivities.map(d => d.getTime()))
        : 0;
      
      const daysSinceLastActivity = mostRecentActivity > 0 
        ? Math.floor((Date.now() - mostRecentActivity) / (1000 * 60 * 60 * 24))
        : 0;
      
      const activityStats: ActivityStats = {
        totalChats: chatsResult.data.length,
        totalWorkouts: workoutsResult.data.length,
        recentActivity: daysSinceLastActivity
      };
      
      return { success: true, data: activityStats };
    } else {
      return { 
        success: false, 
        error: 'Failed to load activity data from individual endpoints' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error while fetching activity stats' 
    };
  }
};