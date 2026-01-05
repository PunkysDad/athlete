import { ApiResponse, WorkoutPlan, WorkoutRequest } from "../interfaces/interfaces";

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.254.5:8080/api/v1' // Development
  : 'https://your-production-api.com/api/v1'; // Production

class WorkoutApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here when implemented
          // 'Authorization': `Bearer ${authToken}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      console.log('API Response:', data);
      return {
        success: true,
        data,
        cost: data.cost || 0 // Backend should return cost info
      };

    } catch (error) {
      console.error('Network/API Error:', error);

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          error: 'Cannot connect to backend server. Make sure your backend is running on localhost:8080'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generate a new workout plan
  async generateWorkout(request: WorkoutRequest): Promise<ApiResponse<WorkoutPlan>> {
    console.log('Generating workout with request:', request);
    
    // Transform frontend request to backend format
    const backendRequest = {
      sport: request.sport,
      position: request.position,
      experienceLevel: request.experienceLevel,
      trainingPhase: request.trainingPhase,
      availableEquipment: request.equipment,
      sessionDuration: request.timeAvailable,
      focusAreas: request.trainingFocus,
      specialRequirements: request.specialRequests || null
    };

    return this.makeRequest<WorkoutPlan>('/workouts/generate', {
      method: 'POST',
      body: JSON.stringify(backendRequest),
    });
  }

  // Save a generated workout
  async saveWorkout(workoutId: string): Promise<ApiResponse<{ saved: boolean }>> {
    return this.makeRequest<{ saved: boolean }>(`/workouts/${workoutId}/save`, {
      method: 'POST',
    });
  }

  // Get user's saved workouts
  async getSavedWorkouts(): Promise<ApiResponse<WorkoutPlan[]>> {
    return this.makeRequest<WorkoutPlan[]>('/workouts/saved');
  }

  // Get a specific workout by ID
  async getWorkout(workoutId: string): Promise<ApiResponse<WorkoutPlan>> {
    return this.makeRequest<WorkoutPlan>(`/workouts/${workoutId}`);
  }

  // Add tags to a workout
  async tagWorkout(workoutId: string, tagIds: number[]): Promise<ApiResponse<{ tagged: boolean }>> {
    return this.makeRequest<{ tagged: boolean }>(`/workouts/${workoutId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagIds }),
    });
  }

  // Search workouts by tags or filters
  async searchWorkouts(filters: {
    tags?: string[];
    sport?: string;
    position?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<WorkoutPlan[]>> {
    const queryParams = new URLSearchParams();
    
    if (filters.tags?.length) {
      queryParams.append('tags', filters.tags.join(','));
    }
    if (filters.sport) {
      queryParams.append('sport', filters.sport);
    }
    if (filters.position) {
      queryParams.append('position', filters.position);
    }
    if (filters.dateFrom) {
      queryParams.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryParams.append('dateTo', filters.dateTo);
    }

    const queryString = queryParams.toString();
    const endpoint = `/workouts/search${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<WorkoutPlan[]>(endpoint);
  }

  // Test backend connection
  async testConnection(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const workoutApiService = new WorkoutApiService();