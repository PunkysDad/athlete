import { ActivityStats, ApiResponse, TagResponse, TaggedConversationResponse, TaggedWorkoutResponse } from '../interfaces/interfaces';

const BASE_URL = 'http://192.168.254.5:8080';

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };
    console.log(`API Call: ${config.method || 'GET'} ${url}`);
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    console.error('API Error:', error);
    return {
      data: {} as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export const apiService = {
  // Health check
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return apiCall('/actuator/health');
  },

  // User stats
  async getUserStats(userId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/stats`);
  },

  // Conversation history
  async getUserConversations(userId: number): Promise<ApiResponse<any[]>> {
    return apiCall(`/api/v1/conversations/user/${userId}`);
  },

  // Workout history
  async getUserWorkouts(userId: number): Promise<ApiResponse<any[]>> {
    return apiCall(`/api/v1/workouts/user/${userId}`);
  },

  // Get single user profile
  async getUserProfile(userId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}`);
  },

  // Get user by Firebase UID
  async getUserByFirebaseUid(firebaseUid: string): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/firebase/${firebaseUid}`);
  },

  // Update user profile
  async updateUserProfile(
    userId: number,
    data: {
      displayName?: string | null;
      primarySport?: string | null;
      primaryPosition?: string | null;
      age?: number | null;
    }
  ): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // -------------------------------------------------------------------------
  // Single item fetches — used by TagContentBottomSheet
  // -------------------------------------------------------------------------

  async getConversationById(conversationId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/conversations/${conversationId}`);
  },

  async getWorkoutById(workoutId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/workouts/${workoutId}`);
  },

  // -------------------------------------------------------------------------
  // Tag endpoints
  // -------------------------------------------------------------------------

  async getUserTags(userId: number): Promise<ApiResponse<TagResponse[]>> {
    return apiCall(`/api/v1/users/${userId}/tags`);
  },

  async addTagToWorkout(userId: number, workoutPlanId: number, tagId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/tags/workouts/${workoutPlanId}`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    });
  },

  async removeTagFromWorkout(userId: number, workoutPlanId: number, tagId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/tags/workouts/${workoutPlanId}/${tagId}`, {
      method: 'DELETE',
    });
  },

  async addTagToConversation(userId: number, conversationId: number, tagId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/tags/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    });
  },

  async removeTagFromConversation(userId: number, conversationId: number, tagId: number): Promise<ApiResponse<any>> {
    return apiCall(`/api/v1/users/${userId}/tags/conversations/${conversationId}/${tagId}`, {
      method: 'DELETE',
    });
  },

  async createTag(userId: number, name: string, color: string): Promise<ApiResponse<TagResponse>> {
    return apiCall(`/api/v1/users/${userId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  },

  async getConversationsByTag(userId: number, tagId: number): Promise<ApiResponse<TaggedConversationResponse[]>> {
    return apiCall(`/api/v1/users/${userId}/tags/${tagId}/conversations`);
  },

  async getWorkoutsByTag(userId: number, tagId: number): Promise<ApiResponse<TaggedWorkoutResponse[]>> {
    return apiCall(`/api/v1/users/${userId}/tags/${tagId}/workouts`);
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

// Activity stats helper
export const getActivityStats = async (userId: number): Promise<ApiResponse<ActivityStats>> => {
  try {
    const statsResult = await apiService.getUserStats(userId);

    if (statsResult.success && statsResult.data.totalConversations !== undefined) {
      return {
        success: true,
        data: {
          totalChats: statsResult.data.totalConversations || 0,
          totalWorkouts: statsResult.data.totalWorkouts || 0,
          recentActivity: statsResult.data.daysSinceLastActivity || 0,
        },
      };
    }

    const [chatsResult, workoutsResult] = await Promise.all([
      apiService.getUserConversations(userId),
      apiService.getUserWorkouts(userId),
    ]);

    if (chatsResult.success && workoutsResult.success) {
      const allActivities = [
        ...chatsResult.data.map((c: any) => new Date(c.timestamp || c.createdAt)),
        ...workoutsResult.data.map((w: any) => new Date(w.createdAt)),
      ];
      const mostRecent = allActivities.length > 0
        ? Math.max(...allActivities.map(d => d.getTime()))
        : 0;
      const daysSince = mostRecent > 0
        ? Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        success: true,
        data: {
          totalChats: chatsResult.data.length,
          totalWorkouts: workoutsResult.data.length,
          recentActivity: daysSince,
        },
      };
    }

    return { success: false, error: 'Failed to load activity data from individual endpoints' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error while fetching activity stats',
    };
  }
};