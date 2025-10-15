// src/services/apiService.ts
import { Platform } from 'react-native';

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

// Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  sport: string;
  category: string;
  isFeatured: boolean;
  displayOrder: number;
  tags?: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoRequest {
  youtubeUrl: string;
  title?: string;
  description?: string;
  sport: string;
  category: string;
  datePerformed?: string;
  tags?: string[];
  isPublic?: boolean;
}

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

  // Get available sports
  async getSports(): Promise<ApiResponse<string[]>> {
    return apiCall('/api/videos/sports');
  },

  // Get performance categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    return apiCall('/api/videos/categories');
  },

  // Get user's videos
  async getMyVideos(): Promise<ApiResponse<Video[]>> {
    return apiCall('/api/videos/my-videos');
  },

  // Add a new video
  async addVideo(videoData: CreateVideoRequest): Promise<ApiResponse<Video>> {
    return apiCall('/api/videos', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
  },

  // Update video
  async updateVideo(videoId: string, videoData: Partial<CreateVideoRequest>): Promise<ApiResponse<Video>> {
    return apiCall(`/api/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(videoData),
    });
  },

  // Delete video
  async deleteVideo(videoId: string): Promise<ApiResponse<void>> {
    return apiCall(`/api/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  // Set featured video
  async setFeaturedVideo(videoId: string): Promise<ApiResponse<void>> {
    return apiCall(`/api/videos/${videoId}/featured`, {
      method: 'PUT',
    });
  },

  // Discover public videos
  async discoverVideos(sport: string, page: number = 0, size: number = 20): Promise<ApiResponse<Video[]>> {
    return apiCall(`/api/videos/discover?sport=${sport}&page=${page}&size=${size}`);
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