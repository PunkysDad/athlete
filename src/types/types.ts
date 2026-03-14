import { WorkoutData } from "../interfaces/interfaces";

export type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  EditProfile: { userId: string };
  WorkoutDisplay: { workoutData: WorkoutData };
};