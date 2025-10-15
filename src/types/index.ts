// Firebase User types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Athlete Profile types
export interface AthleteProfile {
  id?: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  tier: 'basic' | 'pro' | 'elite';
  sport: string | null;
  position: string | null;
  graduationYear?: number;
  videoCount?: number;
  maxVideos: number;
  createdAt: string;
  updatedAt?: string;
}

// Subscription types
export type SubscriptionTier = 'basic' | 'pro' | 'elite';

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  maxVideos: number;
  aiAssessments: boolean;
  recruiterAccess: boolean;
  prioritySupport: boolean;
}

// Video types
export interface VideoUpload {
  id?: string;
  athleteId: string;
  title: string;
  description?: string;
  sport: string;
  position: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  uploadedAt: string;
  processed: boolean;
  aiAnalysis?: AIAnalysis;
}

// AI Analysis types
export interface AIAnalysis {
  id?: string;
  videoId: string;
  skillScores: {
    technique: number;
    speed: number;
    accuracy: number;
    consistency: number;
    overall: number;
  };
  feedback: string[];
  improvements: string[];
  strengths: string[];
  analysisDate: string;
}

// Environment configuration
export interface EnvironmentConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_CLIENT_TOKEN: string;
  BACKEND_URL: string;
  APP_ENV: 'development' | 'staging' | 'production' | 'test';
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Navigation types (if using React Navigation)
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  VideoUpload: undefined;
  VideoDetails: { videoId: string };
  Settings: undefined;
};

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isValid: boolean;
  errors: ValidationError[];
  touched: string[];
}