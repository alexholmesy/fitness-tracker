'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function upsertWeight(data: { date: string; weight: string; notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('weight_entries').upsert({
    user_id: user.id, date: data.date, weight: parseFloat(data.weight), notes: data.notes || null,
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/weight')
}

export async function deleteWeight(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('weight_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/weight')
}

export async function upsertCalories(data: { date: string; calories: string; notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('calorie_entries').upsert({
    user_id: user.id, date: data.date, calories: parseInt(data.calories), notes: data.notes || null,
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/calories')
}

export async function upsertSteps(data: { date: string; steps: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('step_entries').upsert({
    user_id: user.id, date: data.date, steps: parseInt(data.steps),
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/steps')
}

export async function createWorkout(data: {
  name: string; date: string; notes?: string
  exercises: { exercise_name: string; sets: string; reps: string; weight: string }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: workout, error: workoutError } = await supabase
    .from('workouts').insert({ user_id: user.id, name: data.name, date: data.date, notes: data.notes || null })
    .select().single()
  if (workoutError) throw workoutError
  if (data.exercises?.length > 0) {
    const exercises = data.exercises.filter(e => e.exercise_name.trim()).map((e, i) => ({
      workout_id: workout.id, exercise_name: e.exercise_name,
      sets: e.sets ? parseInt(e.sets) : null, reps: e.reps ? parseInt(e.reps) : null,
      weight: e.weight ? parseFloat(e.weight) : null, sort_order: i,
    }))
    if (exercises.length > 0) {
      const { error } = await supabase.from('workout_exercises').insert(exercises)
      if (error) throw error
    }
  }
  revalidatePath('/dashboard')
  revalidatePath('/workouts')
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('workouts').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/workouts')
}

export async function createCardio(data: {
  date: string; activity: string; duration_minutes?: string; distance_km?: string; calories_burned?: string; notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('cardio_entries').insert({
    user_id: user.id, date: data.date, activity: data.activity,
    duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
    distance_km: data.distance_km ? parseFloat(data.distance_km) : null,
    calories_burned: data.calories_burned ? parseInt(data.calories_burned) : null,
    notes: data.notes || null,
  })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/cardio')
}

export async function upsertSleep(data: { date: string; hours_slept: string; notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('sleep_entries').upsert({
    user_id: user.id, date: data.date, hours_slept: parseFloat(data.hours_slept), notes: data.notes || null,
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/sleep')
}

export async function upsertWater(data: { date: string; litres: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('water_entries').upsert({
    user_id: user.id, date: data.date, litres: parseFloat(data.litres),
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/water')
}

export async function upsertNote(date: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('daily_notes').upsert({
    user_id: user.id, date, content, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/notes')
}

export async function updateSettings(data: {
  full_name: string; goal_weight: string; daily_calorie_target: string
  daily_step_target: string; water_target: string; sleep_target: string; weight_unit: 'kg' | 'lbs'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('profiles').update({
    full_name: data.full_name || null,
    goal_weight: data.goal_weight ? parseFloat(data.goal_weight) : null,
    daily_calorie_target: parseInt(data.daily_calorie_target),
    daily_step_target: parseInt(data.daily_step_target),
    water_target: parseFloat(data.water_target),
    sleep_target: parseFloat(data.sleep_target),
    weight_unit: data.weight_unit,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) throw error
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}
