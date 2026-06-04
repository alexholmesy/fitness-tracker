import { createClient } from '@/lib/supabase/server'
import { subDays, startOfWeek, format } from 'date-fns'
import type { DateRange, DashboardStats, Analytics } from '@/types'

export function getDateFilter(range: DateRange): string {
  const now = new Date()
  switch (range) {
    case '7d': return format(subDays(now, 7), 'yyyy-MM-dd')
    case '30d': return format(subDays(now, 30), 'yyyy-MM-dd')
    case '90d': return format(subDays(now, 90), 'yyyy-MM-dd')
    case '1y': return format(subDays(now, 365), 'yyyy-MM-dd')
    case 'all': return '2000-01-01'
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [
    { data: profile },
    { data: latestWeight },
    { data: lastWeekWeight },
    { data: todayCalories },
    { data: todaySteps },
    { data: todayWater },
    { data: weekWorkouts },
    { data: weekSleep },
  ] = await Promise.all([
    supabase.from('profiles').select('daily_calorie_target, daily_step_target, water_target').eq('id', user.id).single(),
    supabase.from('weight_entries').select('weight').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
    supabase.from('weight_entries').select('weight').eq('user_id', user.id).lte('date', weekAgo).order('date', { ascending: false }).limit(1).single(),
    supabase.from('calorie_entries').select('calories').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('step_entries').select('steps').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('water_entries').select('litres').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('workouts').select('id').eq('user_id', user.id).gte('date', weekStart),
    supabase.from('sleep_entries').select('hours_slept').eq('user_id', user.id).gte('date', weekStart),
  ])

  const avgSleep = weekSleep && weekSleep.length > 0
    ? weekSleep.reduce((sum, s) => sum + s.hours_slept, 0) / weekSleep.length
    : null

  const weightChange = latestWeight?.weight && lastWeekWeight?.weight
    ? latestWeight.weight - lastWeekWeight.weight
    : null

  return {
    currentWeight: latestWeight?.weight ?? null,
    weightChangeWeek: weightChange,
    caloriesToday: todayCalories?.calories ?? null,
    stepsToday: todaySteps?.steps ?? null,
    waterToday: todayWater?.litres ?? null,
    workoutsThisWeek: weekWorkouts?.length ?? 0,
    avgSleepThisWeek: avgSleep ? Math.round(avgSleep * 10) / 10 : null,
    calorieTarget: profile?.daily_calorie_target ?? 2000,
    stepTarget: profile?.daily_step_target ?? 10000,
    waterTarget: profile?.water_target ?? 2.5,
  }
}

export async function getWeightEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('weight_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getCalorieEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('calorie_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getStepEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('step_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getWorkouts(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('workouts').select('*, workout_exercises(*)').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCardioEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('cardio_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getSleepEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('sleep_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getWaterEntries(range: DateRange = '30d') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('water_entries').select('*').eq('user_id', user.id)
    .gte('date', getDateFilter(range)).order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProgressPhotos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('progress_photos').select('*').eq('user_id', user.id)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getDailyNotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('daily_notes').select('*').eq('user_id', user.id)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return data
}

export async function getAnalytics(): Promise<Analytics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [
    { data: weights },
    { data: calories },
    { data: workouts },
    { data: steps },
    { data: sleep },
  ] = await Promise.all([
    supabase.from('weight_entries').select('date, weight').eq('user_id', user.id).gte('date', thirtyDaysAgo).order('date', { ascending: true }),
    supabase.from('calorie_entries').select('calories').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('workouts').select('date').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('step_entries').select('steps').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('sleep_entries').select('hours_slept').eq('user_id', user.id).gte('date', thirtyDaysAgo),
  ])

  let weightLossPerWeek: number | null = null
  if (weights && weights.length >= 2) {
    const totalLoss = weights[0].weight - weights[weights.length - 1].weight
    weightLossPerWeek = Math.round((totalLoss / (30 / 7)) * 100) / 100
  }

  const avgCalorieIntake = calories && calories.length > 0
    ? Math.round(calories.reduce((sum, c) => sum + c.calories, 0) / calories.length)
    : null

  const workoutFrequencyPerWeek = workouts
    ? Math.round((workouts.length / 30 * 7) * 10) / 10
    : null

  const avgSteps = steps && steps.length > 0
    ? Math.round(steps.reduce((sum, s) => sum + s.steps, 0) / steps.length)
    : null

  const avgSleep = sleep && sleep.length > 0
    ? Math.round(sleep.reduce((sum, s) => sum + s.hours_slept, 0) / sleep.length * 10) / 10
    : null

  const consistencyScore = weights && calories
    ? Math.round(((weights.length + calories.length) / 2 / 30) * 100)
    : null

  return {
    weightLossPerWeek,
    avgCalorieIntake,
    workoutFrequencyPerWeek,
    consistencyScore,
    avgSteps,
    avgSleep,
  }
}
