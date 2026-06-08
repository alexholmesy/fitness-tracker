'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Input, SubmitButton } from '@/components/ui-kit'

const ALL_METRICS = [
  { id: 'weight', label: 'Weight' },
  { id: 'calories', label: 'Calories' },
  { id: 'steps', label: 'Steps' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'water', label: 'Water' },
  { id: 'photos', label: 'Progress Photos' },
  { id: 'notes', label: 'Notes' },
]

const QUICK_LOG_OPTIONS = [
  { id: 'weight', label: 'Weight' },
  { id: 'calories', label: 'Calories (+ Protein)' },
  { id: 'steps', label: 'Steps' },
  { id: 'water', label: 'Water' },
]

const DASHBOARD_STAT_OPTIONS = [
  { id: 'calories', label: 'Calories' },
  { id: 'steps', label: 'Steps' },
  { id: 'water', label: 'Water' },
  { id: 'weight', label: 'Weight' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'sleep', label: 'Sleep' },
]

const STREAK_CONDITIONS = [
  { id: 'calories_under', label: 'Under calorie target' },
  { id: 'protein_met', label: 'Hit protein target' },
  { id: 'steps_met', label: 'Hit step target' },
  { id: 'weight_logged', label: 'Logged weight' },
  { id: 'workout_done', label: 'Completed a workout' },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackedMetrics, setTrackedMetrics] = useState<string[]>([])
  const [quickLog, setQuickLog] = useState<string[]>([])
  const [dashboardStats, setDashboardStats] = useState<string[]>([])
  const [streakConditions, setStreakConditions] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setTrackedMetrics(data?.tracked_metrics ?? ALL_METRICS.map(m => m.id))
      setQuickLog(data?.dashboard_quick_log ?? ['weight', 'calories', 'steps', 'water'])
      setDashboardStats(data?.dashboard_stats ?? ['calories', 'steps', 'water', 'weight', 'workouts', 'sleep'])
      setStreakConditions(data?.streak_conditions ?? ['calories_under', 'protein_met', 'steps_met'])
    }
    fetchProfile()
  }, [])

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter(i => i !== id))
    } else {
      setList([...list, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').update({
        full_name: fd.get('full_name') as string || null,
        goal_weight: fd.get('goal_weight') ? parseFloat(fd.get('goal_weight') as string) : null,
        daily_calorie_target: parseInt(fd.get('daily_calorie_target') as string),
        daily_protein_target: parseInt(fd.get('daily_protein_target') as string),
        daily_step_target: parseInt(fd.get('daily_step_target') as string),
        water_target: parseFloat(fd.get('water_target') as string),
        sleep_target: parseFloat(fd.get('sleep_target') as string),
        weight_unit: fd.get('weight_unit') as string,
        tracked_metrics: trackedMetrics,
        dashboard_quick_log: quickLog,
        dashboard_stats: dashboardStats,
        streak_conditions: streakConditions,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) throw error
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <p className="text-muted-foreground text-sm mt-2">Loading...</p>
    </div>
  )

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      <PageHeader title="Settings" subtitle="Personalise your experience" />
      <div className="px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {saved && <div className="px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">Settings saved!</div>}
          {error && <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}

          {/* Profile */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>
            <Input label="Name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Your name" />
          </div>

          {/* Goals */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Goals</h2>
            <Input label="Goal Weight (kg)" name="goal_weight" type="number" step="0.1" defaultValue={profile?.goal_weight ?? ''} placeholder="85" />
            <Input label="Daily Calorie Target" name="daily_calorie_target" type="number" defaultValue={profile?.daily_calorie_target ?? 2000} required />
            <Input label="Daily Protein Target (g)" name="daily_protein_target" type="number" defaultValue={profile?.daily_protein_target ?? 190} placeholder="190" required />
            <Input label="Daily Step Target" name="daily_step_target" type="number" defaultValue={profile?.daily_step_target ?? 10000} required />
            <Input label="Water Target (litres)" name="water_target" type="number" step="0.25" defaultValue={profile?.water_target ?? 2.5} required />
            <Input label="Sleep Target (hours)" name="sleep_target" type="number" step="0.5" defaultValue={profile?.sleep_target ?? 8} required />
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preferences</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Weight Unit</label>
              <div className="flex gap-3">
                {(['kg', 'lbs'] as const).map(unit => (
                  <label key={unit} className="flex-1">
                    <input type="radio" name="weight_unit" value={unit} defaultChecked={profile?.weight_unit === unit} className="sr-only peer" />
                    <div className="flex items-center justify-center py-3 rounded-xl bg-secondary border border-border peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary text-muted-foreground font-medium text-sm cursor-pointer transition-all">
                      {unit}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* What to track */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">What to Track</h2>
            <p className="text-xs text-muted-foreground">Choose which sections appear in your app.</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_METRICS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => toggleItem(trackedMetrics, setTrackedMetrics, id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all press-effect text-left ${
                    trackedMetrics.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                  {trackedMetrics.includes(id) ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick log buttons */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Log Buttons</h2>
            <p className="text-xs text-muted-foreground">Choose which buttons appear at the top of your dashboard.</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LOG_OPTIONS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => toggleItem(quickLog, setQuickLog, id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all press-effect text-left ${
                    quickLog.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                  {quickLog.includes(id) ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard stats */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dashboard Stats</h2>
            <p className="text-xs text-muted-foreground">Choose which stat cards appear on your dashboard.</p>
            <div className="grid grid-cols-2 gap-2">
              {DASHBOARD_STAT_OPTIONS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => toggleItem(dashboardStats, setDashboardStats, id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all press-effect text-left ${
                    dashboardStats.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                  {dashboardStats.includes(id) ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Streak conditions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">🔥 Streak Goals</h2>
            <p className="text-xs text-muted-foreground">All selected conditions must be met each day to keep your streak alive.</p>
            <div className="grid grid-cols-1 gap-2">
              {STREAK_CONDITIONS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => toggleItem(streakConditions, setStreakConditions, id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all press-effect text-left ${
                    streakConditions.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                  }`}>
                  {streakConditions.includes(id) ? '✓ ' : ''}{label}
                </button>
              ))}
            </div>
          </div>

          <SubmitButton loading={loading} label="Save Settings" />
        </form>
      </div>
    </div>
  )
}
