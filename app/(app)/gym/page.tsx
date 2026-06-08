'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Play, ChevronRight, Trophy, Trash2 } from 'lucide-react'
import { HevyImport } from '../workouts/hevy-import'
import { format } from 'date-fns'

export default function GymPage() {
  const [routines, setRoutines] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'routines' | 'history' | 'prs'>('routines')
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from('routines').select('*, routine_exercises(*)').eq('user_id', user.id).order('sort_order'),
      supabase.from('workout_sessions').select('*, workout_sets(*)').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
    ])

    setRoutines(r ?? [])
    setSessions(s ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const startEmptyWorkout = () => {
    window.location.href = '/gym/session?new=true'
  }

  const startRoutine = (routineId: string) => {
    window.location.href = `/gym/session?routine=${routineId}`
  }

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      <div className="flex items-start justify-between px-4 pt-4">
        <div>
          <h1 className="text-xl font-bold">Gym</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sessions.length} sessions logged</p>
        </div>
        <div className="flex gap-2">
          <HevyImport onImport={fetchData} />
          <button
            onClick={startEmptyWorkout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {(['routines', 'history', 'prs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all press-effect capitalize ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {t === 'prs' ? 'PRs' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-4 stat-card text-center py-8">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {/* Routines tab */}
          {tab === 'routines' && (
            <div className="px-4 space-y-3">
              {routines.length === 0 ? (
                <div className="stat-card text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">No routines yet.</p>
                  <a href="/gym/routine/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect">
                    <Plus className="w-4 h-4" /> Create Routine
                  </a>
                </div>
              ) : (
                <>
                  {routines.map(routine => (
                    <div key={routine.id} className="stat-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{routine.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {routine.routine_exercises?.length ?? 0} exercises
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a href={`/gym/routine/${routine.id}`}
                            className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium press-effect">
                            Edit
                          </a>
                          <button
                            onClick={() => startRoutine(routine.id)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold press-effect flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Start
                          </button>
                        </div>
                      </div>
                      {routine.routine_exercises?.slice(0, 4).map((ex: any) => (
                        <p key={ex.id} className="text-xs text-muted-foreground mt-1">{ex.exercise_name}</p>
                      ))}
                      {(routine.routine_exercises?.length ?? 0) > 4 && (
                        <p className="text-xs text-muted-foreground">+{routine.routine_exercises.length - 4} more</p>
                      )}
                    </div>
                  ))}
                  <a href="/gym/routine/new"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground press-effect hover:border-primary/50 transition-all">
                    <Plus className="w-4 h-4" /> New Routine
                  </a>
                </>
              )}
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
  <div className="px-4 space-y-3">
    {sessions.length === 0 ? (
      <div className="stat-card text-center py-8">
        <p className="text-sm text-muted-foreground">No sessions yet. Start a workout!</p>
      </div>
    ) : sessions.map(session => {
      const exercises = [...new Set((session.workout_sets ?? []).map((s: any) => s.exercise_name))]
      const volume = (session.workout_sets ?? []).reduce((sum: number, s: any) =>
        sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
      const duration = session.finished_at
        ? Math.round((new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000)
        : null

      return (
        <div key={session.id} className="stat-card">
          <div className="flex items-start justify-between">
            <a href={`/gym/session/${session.id}`} className="flex-1 min-w-0">
              <p className="font-semibold">{session.name}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(session.started_at), 'EEE, MMM d')}
                {duration && ` · ${duration} min`}
              </p>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  {exercises.length} exercises · {volume.toLocaleString()} kg vol
                </p>
              </div>
            </a>
            <button
              onClick={async () => {
                await supabase.from('workout_sessions').delete().eq('id', session.id)
                fetchData()
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 press-effect flex-shrink-0 ml-2"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(exercises as string[]).slice(0, 4).map((ex: string) => (
              <span key={ex} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                {ex}
              </span>
            ))}
            {exercises.length > 4 && (
              <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                +{exercises.length - 4}
              </span>
            )}
          </div>
        </div>
      )
    })}
  </div>
)}


          {/* PRs tab */}
          {tab === 'prs' && <PRsTab />}
        </>
      )}
    </div>
  )
}

function PRsTab() {
  const [prs, setPrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPRs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workout_sets')
        .select('exercise_name, weight_kg, reps, workout_sessions!inner(user_id, started_at)')
        .eq('workout_sessions.user_id', user.id)
        .eq('completed', true)
        .not('weight_kg', 'is', null)
        .order('weight_kg', { ascending: false })

      if (!data) return

      // Find PR per exercise
      const prMap = new Map<string, any>()
      for (const set of data) {
        const name = set.exercise_name
        if (!prMap.has(name) || (set.weight_kg ?? 0) > prMap.get(name).weight_kg) {
          prMap.set(name, set)
        }
      }

      setPrs(Array.from(prMap.values()).sort((a, b) => b.weight_kg - a.weight_kg))
      setLoading(false)
    }
    fetchPRs()
  }, [])

  if (loading) return (
    <div className="px-4 stat-card text-center py-8">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )

  return (
    <div className="px-4 space-y-2">
      {prs.length === 0 ? (
        <div className="stat-card text-center py-8">
          <p className="text-sm text-muted-foreground">No PRs yet. Start lifting!</p>
        </div>
      ) : prs.map(pr => (
        <div key={pr.exercise_name} className="stat-card flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{pr.exercise_name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date((pr.workout_sessions as any).started_at), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-sm font-bold text-yellow-400">{pr.weight_kg}kg</p>
              <p className="text-xs text-muted-foreground">{pr.reps} reps</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
