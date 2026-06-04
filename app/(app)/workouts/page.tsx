'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { WorkoutClient } from './workout-client'

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 3650
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase.from('workouts').select('*, workout_exercises(*)').eq('user_id', user.id).gte('date', fromDate).order('date', { ascending: false })
    setWorkouts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [range])

  const totalVolume = workouts.reduce((total: number, w: any) => {
    const vol = (w.workout_exercises ?? []).reduce((s: number, e: any) => s + (e.sets ?? 0) * (e.reps ?? 0) * (e.weight ?? 0), 0)
    return total + vol
  }, 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Workouts" subtitle={`${workouts.length} sessions logged`} action={<WorkoutClient onSave={fetchData} />} />
      <div className="px-4">
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {['7d', '30d', '90d', '1y', 'all'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all press-effect ${range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '1y' ? '1Y' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Sessions</p>
          <p className="text-xl font-bold">{workouts.length}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Per Week</p>
          <p className="text-xl font-bold">{workouts.length > 0 ? Math.round(workouts.length / (range === '7d' ? 1 : range === '30d' ? 4.3 : 12.9) * 10) / 10 : 0}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Volume</p>
          <p className="text-xl font-bold">{totalVolume > 0 ? `${(totalVolume / 1000).toFixed(0)}t` : '--'}</p>
        </div>
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : workouts.length === 0 ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">No workouts logged. Tap + to add one.</p></div>
        ) : workouts.map((workout: any) => {
          const exercises = workout.workout_exercises ?? []
          const volume = exercises.reduce((s: number, e: any) => s + (e.sets ?? 0) * (e.reps ?? 0) * (e.weight ?? 0), 0)
          return (
            <div key={workout.id} className="stat-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{workout.name}</h3>
                  <p className="text-xs text-muted-foreground">{workout.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{exercises.length} exercises</p>
                  {volume > 0 && <p className="text-xs text-primary font-medium">{volume.toLocaleString()} kg vol</p>}
                </div>
              </div>
              {exercises.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-border">
                  {exercises.slice(0, 4).map((ex: any) => (
                    <div key={ex.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground/80">{ex.exercise_name}</span>
                      <span className="text-muted-foreground text-xs">
                        {[ex.sets && `${ex.sets}×${ex.reps}`, ex.weight && `${ex.weight}kg`].filter(Boolean).join(' @ ')}
                      </span>
                    </div>
                  ))}
                  {exercises.length > 4 && <p className="text-xs text-muted-foreground">+{exercises.length - 4} more</p>}
                </div>
              )}
              {workout.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{workout.notes}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
