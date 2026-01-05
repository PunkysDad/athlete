import { WorkoutData } from "../interfaces/interfaces";

export type RootStackParamList = {
  MainTabs: undefined;
  EditProfile: { userId: string };
  WorkoutRequest: undefined;
  WorkoutDisplay: { workoutData: WorkoutData };
};