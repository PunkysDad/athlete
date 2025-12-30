// src/services/workoutApiService.ts

interface WorkoutRequest {
  sport: string;
  position: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
  equipment: string[];
  timeAvailable: number;
  trainingFocus: string[];
  specialRequests?: string;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  exercises: Exercise[];
  focusAreas: string[];
  createdAt: string;
}

interface Exercise {
  name: string;
  description: string;
  sets: number;
  reps: string;
  duration?: string;
  restPeriod?: string;
  instructions?: string[];
  videoUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cost?: number; // Track API usage cost
}

// Your backend configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api/v1' // Development
  : 'https://your-production-api.com/api/v1'; // Production

class WorkoutApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
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
      return {
        success: true,
        data,
        cost: data.cost || 0 // Backend should return cost info
      };

    } catch (error) {
      console.error('Network/API Error:', error);
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

// Export types for use in components
export type { WorkoutRequest, WorkoutPlan, Exercise, ApiResponse };