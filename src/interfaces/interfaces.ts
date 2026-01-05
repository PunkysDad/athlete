export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cost?: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  description: string;
  positionBenefit?: string;
  gameApplication?: string;
  injuryPrevention?: string;
  coachingCue?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  exercises: Exercise[];
  focusAreas: string[];
  createdAt: string;
}

export interface WorkoutData extends WorkoutPlan {
  sport: string;
  position: string;
  workoutTitle?: string;
  positionFocus?: string;
  generatedContent?: string;
}

export interface WorkoutRequest {
  sport: string;
  position: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
  equipment: string[];
  timeAvailable: number;
  trainingFocus: string[];
  specialRequests?: string;
}

export interface WorkoutResponse {
  success: boolean;
  data?: WorkoutData;
  error?: string;
  cost?: number;
}