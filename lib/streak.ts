export interface DayData {
  date: string
  calories?: number | null
  protein_g?: number | null
  steps?: number | null
  weight?: number | null
  workout?: boolean
}

export interface Targets {
  daily_calorie_target: number
  daily_protein_target: number
  daily_step_target: number
  streak_conditions: string[]
}

export function dayMeetsStreak(day: DayData, targets: Targets): boolean {
  const conditions = targets.streak_conditions
  if (conditions.length === 0) return false

  for (const condition of conditions) {
    if (condition === 'calories_under') {
      if (!day.calories || day.calories > targets.daily_calorie_target) return false
    }
    if (condition === 'protein_met') {
      if (!day.protein_g || day.protein_g < targets.daily_protein_target) return false
    }
    if (condition === 'steps_met') {
      if (!day.steps || day.steps < targets.daily_step_target) return false
    }
    if (condition === 'weight_logged') {
      if (!day.weight) return false
    }
    if (condition === 'workout_done') {
      if (!day.workout) return false
    }
  }

  return true
}

export function calculateStreak(days: DayData[], targets: Targets): number {
  if (!days || days.length === 0) return 0

  // Sort descending (most recent first)
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Streak must start from today or yesterday
  const mostRecent = sorted[0]?.date
  if (mostRecent !== today && mostRecent !== yesterday) return 0

  let streak = 0
  let expectedDate = mostRecent

  for (const day of sorted) {
    if (day.date !== expectedDate) break
    if (!dayMeetsStreak(day, targets)) break
    streak++
    // Move to previous day
    const prev = new Date(expectedDate)
    prev.setDate(prev.getDate() - 1)
    expectedDate = prev.toISOString().split('T')[0]
  }

  return streak
}
