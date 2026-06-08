'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check, X, ChevronUp, ChevronDown, RefreshCw, Timer } from 'lucide-react'
import { format } from 'date-fns'

interface SetData {
  id?: string
  exercise_name: string
  set_index: number
  weight_kg: string
  reps: string
  rpe: string
  completed: boolean
  isNew?: boolean
}

interface ExerciseGroup {
  name: string
  sets: SetData[]
  sort_order: number
}

export default function SessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const routineId = searchParams.get('routine')
  const isNew = searchParams.get('new')

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('New Workout')
  const [exercises, setExercises] = useState<ExerciseGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(new Date())
  const [elapsed, setElapsed] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restActive, setRestActive] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [swappingExercise, setSwappingExercise] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [allExercises, setAllExercises] = useState<any[]>([])
  const [previousSets, setPreviousSets] = useState<Record<string, any[]>>({})
  const [prs, setPrs] = useState<Record<string, number>>({})
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Rest timer
  useEffect(() => {
    if (restActive && restTimer !== null && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev === null || prev <= 1) {
            setRestActive(false)
            clearInterval(restIntervalRef.current!)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [restActive])

  const startRest = (seconds: number = 90) => {
    setRestTimer(seconds)
    setRestActive(true)
  }

  // Load exercise library
  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      setAllExercises(data ?? [])
    })
  }, [])

  // Initialize session
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create session
      const { data: session } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        name: 'New Workout',
        started_at: startTime.toISOString(),
        routine_id: routineId ?? null,
      }).select().single()

      if (!session) return
      setSessionId(session.id)

      // Load routine exercises if starting from routine
      if (routineId) {
        const { data: routine } = await supabase
          .from('routines')
          .select('*, routine_exercises(*)')
          .eq('id', routineId)
          .single()

        if (routine) {
          setSessionName(routine.name)
          await supabase.from('workout_sessions').update({ name: routine.name }).eq('id', session.id)

          const sortedExercises = (routine.routine_exercises ?? [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)

          const groups: ExerciseGroup[] = sortedExercises.map((ex: any, i: number) => ({
            name: ex.exercise_name,
            sort_order: i,
            sets: Array.from({ length: ex.target_sets ?? 3 }, (_, j) => ({
              exercise_name: ex.exercise_name,
              set_index: j,
              weight_kg: '',
              reps: ex.target_reps?.toString() ?? '',
              rpe: '',
              completed: false,
              isNew: true,
            }))
          }))

          setExercises(groups)
          await loadPreviousSets(sortedExercises.map((e: any) => e.exercise_name), user.id)
        }
      }

      setLoading(false)
    }
    init()
  }, [routineId])

  const loadPreviousSets = async (exerciseNames: string[], userId: string) => {
    const prev: Record<string, any[]> = {}
    const prMap: Record<string, number> = {}

    for (const name of exerciseNames) {
      const { data } = await supabase
        .from('workout_sets')
        .select('*, workout_sessions!inner(user_id, started_at)')
        .eq('workout_sessions.user_id', userId)
        .eq('exercise_name', name)
        .eq('completed', true)
        .not('weight_kg', 'is', null)
        .order('workout_sessions(started_at)', { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        // Get the most recent session's sets
        const mostRecentDate = (data[0].workout_sessions as any).started_at
        const lastSessionSets = data.filter(s => (s.workout_sessions as any).started_at === mostRecentDate)
        prev[name] = lastSessionSets

        // Get PR
        const maxWeight = Math.max(...data.map(s => s.weight_kg ?? 0))
        prMap[name] = maxWeight
      }
    }

    setPreviousSets(prev)
    setPrs(prMap)
  }

  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetData, value: string | boolean) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name !== exerciseName) return ex
      return {
        ...ex,
        sets: ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s)
      }
    }))
  }

  const completeSet = async (exerciseName: string, setIndex: number) => {
    const ex = exercises.find(e => e.name === exerciseName)
    if (!ex || !sessionId) return
    const set = ex.sets[setIndex]

    updateSet(exerciseName, setIndex, 'completed', true)

    // Save to DB
    await supabase.from('workout_sets').upsert({
      session_id: sessionId,
      exercise_name: exerciseName,
      set_index: setIndex,
      weight_kg: set.weight_kg ? parseFloat(set.weight_kg) : null,
      reps: set.reps ? parseInt(set.reps) : null,
      rpe: set.rpe ? parseFloat(set.rpe) : null,
      completed: true,
      sort_order: ex.sort_order * 100 + setIndex,
    })

    startRest()
  }

  const addSet = (exerciseName: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name !== exerciseName) return ex
      const lastSet = ex.sets[ex.sets.length - 1]
      return {
        ...ex,
        sets: [...ex.sets, {
          exercise_name: exerciseName,
          set_index: ex.sets.length,
          weight_kg: lastSet?.weight_kg ?? '',
          reps: lastSet?.reps ?? '',
          rpe: '',
          completed: false,
          isNew: true,
        }]
      }
    }))
  }

  const removeExercise = (exerciseName: string) => {
    setExercises(prev => prev.filter(ex => ex.name !== exerciseName))
  }

  const moveExercise = (exerciseName: string, direction: 'up' | 'down') => {
    setExercises(prev => {
      const idx = prev.findIndex(ex => ex.name === exerciseName)
      if (direction === 'up' && idx === 0) return prev
      if (direction === 'down' && idx === prev.length - 1) return prev
      const newExercises = [...prev]
      const swap = direction === 'up' ? idx - 1 : idx + 1
      ;[newExercises[idx], newExercises[swap]] = [newExercises[swap], newExercises[idx]]
      return newExercises
    })
  }

  const addExercise = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setExercises(prev => [...prev, {
      name,
      sort_order: prev.length,
      sets: [{
        exercise_name: name,
        set_index: 0,
        weight_kg: '',
        reps: '',
        rpe: '',
        completed: false,
        isNew: true,
      }]
    }])

    await loadPreviousSets([name], user.id)
    setShowExercisePicker(false)
    setSwappingExercise(null)
    setExerciseSearch('')
  }

  const swapExercise = async (oldName: string, newName: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setExercises(prev => prev.map(ex => {
      if (ex.name !== oldName) return ex
      return {
        ...ex,
        name: newName,
        sets: ex.sets.map(s => ({ ...s, exercise_name: newName, completed: false }))
      }
    }))

    await loadPreviousSets([newName], user.id)
    setShowExercisePicker(false)
    setSwappingExercise(null)
    setExerciseSearch('')
  }

  const finishWorkout = async () => {
    if (!sessionId) return

    // Save any incomplete sets that have data
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (!set.completed && (set.weight_kg || set.reps)) {
          await supabase.from('workout_sets').upsert({
            session_id: sessionId,
            exercise_name: ex.name,
            set_index: set.set_index,
            weight_kg: set.weight_kg ? parseFloat(set.weight_kg) : null,
            reps: set.reps ? parseInt(set.reps) : null,
            completed: false,
            sort_order: ex.sort_order * 100 + set.set_index,
          })
        }
      }
    }

    await supabase.from('workout_sessions').update({
      finished_at: new Date().toISOString(),
      name: sessionName,
    }).eq('id', sessionId)

    router.push('/gym')
  }

  const discardWorkout = async () => {
    if (sessionId) {
      await supabase.from('workout_sessions').delete().eq('id', sessionId)
    }
    router.push('/gym')
  }

  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">Starting workout...</p>
      </div>
    )
  }

  return (
    <div className="pb-32 animate-fade-in">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              className="font-bold text-lg bg-transparent border-none outline-none text-foreground w-full"
            />
            <p className="text-xs text-muted-foreground">{formatElapsed(elapsed)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={discardWorkout} className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium press-effect">
              Discard
            </button>
            <button onClick={finishWorkout} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold press-effect">
              Finish
            </button>
          </div>
        </div>

        {/* Rest timer */}
        {restActive && restTimer !== null && (
          <div className="mt-2 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
            <Timer className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-primary font-semibold">Rest Timer</p>
              <div className="w-full bg-primary/20 rounded-full h-1 mt-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${(restTimer / 90) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-bold text-primary tabular-nums">{restTimer}s</span>
            <button onClick={() => { setRestActive(false); setRestTimer(null) }}
              className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="px-4 pt-4 space-y-4">
        {exercises.length === 0 && (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No exercises added yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Tap "Add Exercise" below to get started.</p>
          </div>
        )}

        {exercises.map((ex, exIdx) => {
          const prevSets = previousSets[ex.name] ?? []
          const pr = prs[ex.name] ?? 0

          return (
            <div key={`${ex.name}-${exIdx}`} className="stat-card space-y-3">
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-primary">{ex.name}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveExercise(ex.name, 'up')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary press-effect">
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => moveExercise(ex.name, 'down')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary press-effect">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => { setSwappingExercise(ex.name); setShowExercisePicker(true) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary press-effect"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => removeExercise(ex.name)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 press-effect">
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>

              {/* Previous performance */}
              {prevSets.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {prevSets.slice(0, 4).map((s, i) => (
                    <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                      {s.weight_kg}kg × {s.reps}
                    </span>
                  ))}
                  {pr > 0 && (
                    <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full text-yellow-400 font-medium">
                      PR: {pr}kg
                    </span>
                  )}
                </div>
              )}

              {/* Set headers */}
              <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground px-1">
                <div className="col-span-1">SET</div>
                <div className="col-span-4">KG</div>
                <div className="col-span-4">REPS</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-1"></div>
              </div>

              {/* Sets */}
              {ex.sets.map((set, setIdx) => {
                const isPR = set.completed && set.weight_kg && parseFloat(set.weight_kg) > pr
                return (
                  <div key={setIdx} className={`grid grid-cols-12 gap-1 items-center px-1 py-1 rounded-lg transition-all ${
                    set.completed ? 'bg-primary/5 border border-primary/10' : ''
                  } ${isPR ? 'bg-yellow-400/5 border-yellow-400/20' : ''}`}>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground">{setIdx + 1}</div>
                    <input
                      value={set.weight_kg}
                      onChange={e => updateSet(ex.name, setIdx, 'weight_kg', e.target.value)}
                      placeholder={prevSets[setIdx]?.weight_kg?.toString() ?? '0'}
                      type="number"
                      step="0.5"
                      disabled={set.completed}
                      className="col-span-4 px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-60"
                    />
                    <input
                      value={set.reps}
                      onChange={e => updateSet(ex.name, setIdx, 'reps', e.target.value)}
                      placeholder={prevSets[setIdx]?.reps?.toString() ?? '0'}
                      type="number"
                      disabled={set.completed}
                      className="col-span-4 px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-60"
                    />
                    <input
                      value={set.rpe}
                      onChange={e => updateSet(ex.name, setIdx, 'rpe', e.target.value)}
                      placeholder="RPE"
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      disabled={set.completed}
                      className="col-span-2 px-1 py-1.5 rounded-lg bg-secondary border border-border text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-60"
                    />
                    <button
                      onClick={() => set.completed ? null : completeSet(ex.name, setIdx)}
                      disabled={set.completed}
                      className={`col-span-1 flex items-center justify-center w-7 h-7 rounded-lg press-effect transition-all ${
                        set.completed
                          ? isPR ? 'bg-yellow-400/20 text-yellow-400' : 'bg-primary/20 text-primary'
                          : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}

              {/* Add set */}
              <button
                onClick={() => addSet(ex.name)}
                className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground flex items-center justify-center gap-1 press-effect hover:border-primary/50 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Set
              </button>
            </div>
          )
        })}

        {/* Add exercise button */}
        <button
          onClick={() => { setSwappingExercise(null); setShowExercisePicker(true) }}
          className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 press-effect hover:border-primary/50 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      </div>

      {/* Exercise picker */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowExercisePicker(false); setSwappingExercise(null) }} />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl shadow-2xl" style={{ maxHeight: '80vh' }}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-base">{swappingExercise ? `Swap ${swappingExercise}` : 'Add Exercise'}</h2>
              <input
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder="Search exercises..."
                autoFocus
                className="w-full mt-3 px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => swappingExercise ? swapExercise(swappingExercise, ex.name) : addExercise(ex.name)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary transition-colors text-left border-b border-border/50 press-effect"
                >
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.muscle_group} · {ex.equipment}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
              {/* Add custom exercise */}
              {exerciseSearch && !filteredExercises.find(e => e.name.toLowerCase() === exerciseSearch.toLowerCase()) && (
                <button
                  onClick={() => swappingExercise ? swapExercise(swappingExercise, exerciseSearch) : addExercise(exerciseSearch)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors text-left press-effect"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Add "{exerciseSearch}"</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
