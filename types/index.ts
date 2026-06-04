export type WeightUnit = 'kg' | 'lbs'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  goal_weight: number | null
  daily_calorie_target: number
  daily_step_target: number
  water_target: number
  sleep_target: number
  weight_unit: WeightUnit
  created_at: string
  updated_at: string
}

export interface WeightEntry {
  id: string
  user_id: string
  date: string
  weight: number
  notes: string | null
  created_at: string
}

export interface CalorieEntry {
  id: string
  user_id: string
  date: string
  calories: number
  notes: string | null
  created_at: string
}

export interface StepEntry {
  id: string
  user_id: string
  date: string
  steps: number
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
  sort_order: number
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  date: string
  notes: string | null
  created_at: string
  workout_exercises?: WorkoutExercise[]
}

export interface CardioEntry {
  id: string
  user_id: string
  date: string
  activity: string
  duration_minutes: number | null
  distance_km: number | null
  calories_burned: number | null
  notes: string | null
  created_at: string
}

export interface SleepEntry {
  id: string
  user_id: string
  date: string
  hours_slept: number
  quality: number | null
  notes: string | null
  created_at: string
}

export interface WaterEntry {
  id: string
  user_id: string
  date: string
  litres: number
  created_at: string
}

export interface ProgressPhoto {
  id: string
  user_id: string
  date: string
  storage_path: string
  public_url: string | null
  notes: string | null
  created_at: string
}

export interface DailyNote {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
  updated_at: string
}

export type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

export interface DashboardStats {
  currentWeight: number | null
  weightChangeWeek: number | null
  caloriesToday: number | null
  stepsToday: number | null
  waterToday: number | null
  workoutsThisWeek: number
  avgSleepThisWeek: number | null
  calorieTarget: number
  stepTarget: number
  waterTarget: number
}

export interface Analytics {
  weightLossPerWeek: number | null
  avgCalorieIntake: number | null
  workoutFrequencyPerWeek: number | null
  consistencyScore: number | null
  avgSteps: number | null
  avgSleep: number | null
}
