'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check, X, ChevronUp, ChevronDown, RefreshCw, Timer, MoreHorizontal } from 'lucide-react'

interface SetData {
  exercise_name: string
  set_index: number
  weight_kg: string
  reps: string
  rpe: string
  completed: boolean
}

interface ExerciseGroup {
  name: string
  sets: SetData[]
  sort_order: number
  notes: string
}

export default function SessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const routineId = searchParams.get('routine')

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('New Workout')
  const [exercises, setExercises] = useState<ExerciseGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(new Date())
  const [elapsed, setElapsed] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restMax, setRestMax] = useState(90)
  const [restActive, setRestActive] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [swappingExercise, setSwappingExercise] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [allExercises, setAllExercises] = useState<any[]>([])
  const [previousSets, setPreviousSets] = useState<Record<string, any[]>>({})
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [showRpeInput, setShowRpeInput] = useState<string | null>(null)
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null)
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
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setRestMax(seconds)
    setRestTimer(seconds)
    setRestActive(true)
  }

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      setAllExercises(data ?? [])
    })
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: session } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          name: 'New Workout',
          started_at: startTime.toISOString(),
          routine_id: routineId ?? null,
        })
        .select()
        .single()

      if (!session) return
      setSessionId(session.id)

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
            notes: '',
            sets: Array.from({ length: ex.target_sets ?? 3 }, (_, j) => ({
              exercise_name: ex.exercise_name,
              set_index: j,
              weight_kg: '',
              reps: ex.target_reps?.toString() ?? '',
              rpe: '',
              completed: false,
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
        const mostRecentDate = (data[0].workout_sessions as any).started_at
        const lastSessionSets = data
          .filter(s => (s.workout_sessions as any).started_at === mostRecentDate)
          .sort((a, b) => a.set_index - b.set_index)
        prev[name] = lastSessionSets
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

  const updateExerciseNotes = (exerciseName: string, notes: string) => {
    setExercises(prev => prev.map(ex =>
      ex.name === exerciseName ? { ...ex, notes } : ex
    ))
  }

  const completeSet = async (exerciseName: string, setIndex: number) => {
    const ex = exercises.find(e => e.name === exerciseName)
    if (!ex || !sessionId) return
    const set = ex.sets[setIndex]
    if (!set.weight_kg && !set.reps) return

    updateSet(exerciseName, setIndex, 'completed', true)

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

  const uncompleteSet = (exerciseName: string, setIndex: number) => {
    updateSet(exerciseName, setIndex, 'completed', false)
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
        }]
      }
    }))
  }

  const removeSet = (exerciseName: string, setIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name !== exerciseName) return ex
      return {
        ...ex,
        sets: ex.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, set_index: i }))
      }
    }))
  }

  const removeExercise = (exerciseName: string) => {
    setExercises(prev => prev.filter(ex => ex.name !== exerciseName))
    setShowExerciseMenu(null)
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
    setShowExerciseMenu(null)
  }

  const addExercise = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setExercises(prev => [...prev, {
      name,
      sort_order: prev.length,
      notes: '',
      sets: [{
        exercise_name: name,
        set_index: 0,
        weight_kg: '',
        reps: '',
        rpe: '',
        completed: false,
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

  // Live stats
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const totalVolume = exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.completed).reduce((s2, set) =>
      s2 + (parseFloat(set.weight_kg) || 0) * (parseInt(set.reps) || 0), 0
    ), 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">Starting workout...</p>
      </div>
    )
  }

  return (
    <div className="pb-32 animate-fade-in" onClick={() => { setShowExerciseMenu(null); setShowRpeInput(null) }}>

      {/* Sticky header */}
      <div className="sticky top-14 z-40 bg-background/98 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={discardWorkout} className="w-8 h-8 flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              className="font-bold text-base bg-transparent border-none outline-none text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary">
              <Timer className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={finishWorkout}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold press-effect"
            >
              Finish
            </button>
          </div>
        </div>

        {/* Live stats bar */}
        <div className="flex items-center gap-6 px-4 pb-3">
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-bold text-primary">{formatElapsed(elapsed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-sm font-bold">{totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '0 kg'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sets</p>
            <p className="text-sm font-bold">{totalSets}</p>
          </div>
        </div>

        {/* Rest timer bar */}
        {restActive && restTimer !== null && (
          <div
            className="mx-4 mb-3 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 cursor-pointer"
            onClick={e => { e.stopPropagation(); setRestActive(false); setRestTimer(null) }}
          >
            <Timer className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-primary font-semibold">Rest Timer</span>
                <span className="text-primary font-bold">{restTimer}s</span>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(restTimer / restMax) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">tap to dismiss</span>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-1">
        {exercises.length === 0 && (
          <div className="mx-4 mt-4 stat-card text-center py-10">
            <p className="text-sm text-muted-foreground">No exercises yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Tap "Add Exercise" below.</p>
          </div>
        )}

        {exercises.map((ex, exIdx) => {
          const prevSets = previousSets[ex.name] ?? []
          const pr = prs[ex.name] ?? 0
          const isMenuOpen = showExerciseMenu === ex.name

          return (
            <div key={`${ex.name}-${exIdx}`} className="bg-card border-b border-border">
              {/* Exercise header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💪</span>
                  </div>
                  <p className="font-bold text-primary truncate">{ex.name}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setShowExerciseMenu(isMenuOpen ? null : ex.name) }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary press-effect"
                  >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-9 z-50 bg-card border border-border rounded-xl shadow-xl w-48 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setSwappingExercise(ex.name); setShowExercisePicker(true); setShowExerciseMenu(null) }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-secondary flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Swap Exercise
                      </button>
                      <button onClick={() => moveExercise(ex.name, 'up')}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-secondary flex items-center gap-2">
                        <ChevronUp className="w-4 h-4" /> Move Up
                      </button>
                      <button onClick={() => moveExercise(ex.name, 'down')}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-secondary flex items-center gap-2">
                        <ChevronDown className="w-4 h-4" /> Move Down
                      </button>
                      <button onClick={() => removeExercise(ex.name)}
                        className="w-full px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2">
                        <X className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Exercise notes */}
              <div className="px-4 pb-2">
                <input
                  value={ex.notes}
                  onChange={e => updateExerciseNotes(ex.name, e.target.value)}
                  placeholder="Add notes here..."
                  className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Rest timer per exercise */}
              {restActive && restTimer !== null && (
                <div className="mx-4 mb-2 flex items-center gap-2 text-primary text-xs font-medium">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Rest Timer: {Math.floor(restTimer / 60)}min {restTimer % 60}s</span>
                </div>
              )}

              {/* Set headers */}
              <div className="grid grid-cols-12 gap-1 px-4 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Set</div>
                <div className="col-span-3">Previous</div>
                <div className="col-span-3 text-center">KG</div>
                <div className="col-span-3 text-center">Reps</div>
                <div className="col-span-1 text-center">RPE</div>
                <div className="col-span-1"></div>
              </div>

              {/* Sets */}
              {ex.sets.map((set, setIdx) => {
                const prevSet = prevSets[setIdx]
                const isPR = set.completed && set.weight_kg && parseFloat(set.weight_kg) > pr && pr > 0
                const isRpeOpen = showRpeInput === `${ex.name}-${setIdx}`

                return (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-12 gap-1 items-center px-4 py-2 transition-all ${
                      isPR ? 'bg-yellow-400/10' :
                      set.completed ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Set number */}
                    <div className="col-span-1 text-sm font-bold text-muted-foreground">{setIdx + 1}</div>

                    {/* Previous */}
                    <div className="col-span-3">
                      {prevSet ? (
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {prevSet.weight_kg}kg x {prevSet.reps}
                          {prevSet.rpe ? <><br />@ {prevSet.rpe} rpe</> : ''}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/40">—</p>
                      )}
                    </div>

                    {/* Weight */}
                    <input
                      value={set.weight_kg}
                      onChange={e => updateSet(ex.name, setIdx, 'weight_kg', e.target.value)}
                      placeholder={prevSet?.weight_kg?.toString() ?? '0'}
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      disabled={set.completed}
                      className={`col-span-3 px-2 py-2 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-70 transition-all ${
                        set.completed ? 'bg-transparent border-transparent' : 'bg-secondary border border-border'
                      }`}
                    />

                    {/* Reps */}
                    <input
                      value={set.reps}
                      onChange={e => updateSet(ex.name, setIdx, 'reps', e.target.value)}
                      placeholder={prevSet?.reps?.toString() ?? '0'}
                      type="number"
                      inputMode="numeric"
                      disabled={set.completed}
                      className={`col-span-3 px-2 py-2 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-70 transition-all ${
                        set.completed ? 'bg-transparent border-transparent' : 'bg-secondary border border-border'
                      }`}
                    />

                    {/* RPE button */}
                    <div className="col-span-1 relative flex justify-center">
                      {isRpeOpen ? (
                        <input
                          autoFocus
                          value={set.rpe}
                          onChange={e => updateSet(ex.name, setIdx, 'rpe', e.target.value)}
                          onBlur={() => setShowRpeInput(null)}
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          inputMode="decimal"
                          className="w-10 px-1 py-1.5 rounded-lg bg-secondary border border-primary text-xs text-center focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setShowRpeInput(`${ex.name}-${setIdx}`) }}
                          disabled={set.completed}
                          className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all press-effect ${
                            set.rpe
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-secondary border-border text-muted-foreground'
                          }`}
                        >
                          {set.rpe || 'RPE'}
                        </button>
                      )}
                    </div>

                    {/* Complete / delete */}
                    <div className="col-span-1 flex justify-center">
                      {set.completed ? (
                        <button
                          onClick={() => uncompleteSet(ex.name, setIdx)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center press-effect ${
                            isPR ? 'bg-yellow-400/30 text-yellow-400' : 'bg-primary/20 text-primary'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => completeSet(ex.name, setIdx)}
                          className="w-7 h-7 rounded-lg bg-secondary border border-border text-muted-foreground flex items-center justify-center press-effect hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Add set */}
              <div className="px-4 py-3">
                <button
                  onClick={() => addSet(ex.name)}
                  className="w-full py-2.5 rounded-xl bg-secondary text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 press-effect hover:text-foreground transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Set
                </button>
              </div>
            </div>
          )
        })}

        {/* Add exercise */}
        <div className="px-4 py-4">
          <button
            onClick={() => { setSwappingExercise(null); setShowExercisePicker(true) }}
            className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 press-effect hover:border-primary/50 hover:text-primary transition-all"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

      {/* Exercise picker */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowExercisePicker(false); setSwappingExercise(null) }}
          />
          <div
            className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl shadow-2xl flex flex-col"
            style={{ height: '80vh' }}
          >
            <div className="flex-shrink-0 px-5 pt-3 pb-3 border-b border-border">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <h2 className="font-semibold text-base mb-3">
                {swappingExercise ? `Swap: ${swappingExercise}` : 'Add Exercise'}
              </h2>
              <div className="relative">
                <input
                  value={exerciseSearch}
                  onChange={e => setExerciseSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-8"
                />
                {exerciseSearch && (
                  <button onClick={() => setExerciseSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xl leading-none">×</button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {!exerciseSearch ? (
                <>
                  <SuggestedExercises
                    swappingExercise={swappingExercise}
                    allExercises={allExercises}
                    onSelect={(name) => swappingExercise ? swapExercise(swappingExercise, name) : addExercise(name)}
                  />
                  <ExerciseListByGroup
                    exercises={allExercises}
                    onSelect={(name) => swappingExercise ? swapExercise(swappingExercise, name) : addExercise(name)}
                  />
                </>
              ) : (
                <>
                  {allExercises
                    .filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                    .map(ex => (
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
                  {exerciseSearch && !allExercises.find(e => e.name.toLowerCase() === exerciseSearch.toLowerCase()) && (
                    <button
                      onClick={() => swappingExercise ? swapExercise(swappingExercise, exerciseSearch) : addExercise(exerciseSearch)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors press-effect"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-primary">Add "{exerciseSearch}"</p>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestedExercises({
  swappingExercise,
  allExercises,
  onSelect,
}: {
  swappingExercise: string | null
  allExercises: any[]
  onSelect: (name: string) => void
}) {
  const [suggested, setSuggested] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchMostUsed() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workout_sets')
        .select('exercise_name, workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', user.id)

      if (!data) return

      const counts = new Map<string, number>()
      for (const s of data) {
        counts.set(s.exercise_name, (counts.get(s.exercise_name) ?? 0) + 1)
      }

      let filtered = Array.from(counts.entries())

      if (swappingExercise) {
        const swappingEx = allExercises.find(e => e.name === swappingExercise)
        if (swappingEx?.muscle_group) {
          const sameMuscle = new Set(
            allExercises.filter(e => e.muscle_group === swappingEx.muscle_group).map(e => e.name)
          )
          filtered = filtered.filter(([name]) => sameMuscle.has(name) && name !== swappingExercise)
        }
      }

      const top = filtered
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))

      setSuggested(top)
    }
    fetchMostUsed()
  }, [swappingExercise])

  if (suggested.length === 0) return null

  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {swappingExercise ? 'Similar Exercises' : 'Most Used'}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggested.map(({ name, count }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-medium press-effect hover:border-primary/50 hover:text-primary transition-all"
          >
            <span>{name}</span>
            <span className="text-muted-foreground opacity-60">×{count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ExerciseListByGroup({
  exercises,
  onSelect,
}: {
  exercises: any[]
  onSelect: (name: string) => void
}) {
  const groups = exercises.reduce((acc: Record<string, any[]>, ex) => {
    const group = ex.muscle_group ?? 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(ex)
    return acc
  }, {})

  const groupOrder = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Calves', 'Core', 'Cardio', 'Other']
  const sortedGroups = Object.keys(groups).sort((a, b) => {
    const ai = groupOrder.indexOf(a)
    const bi = groupOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <>
      {sortedGroups.map(group => (
        <div key={group}>
          <div className="px-5 py-2 bg-secondary/50 sticky top-0 z-10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
          </div>
          {groups[group].map((ex: any) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.name)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary transition-colors text-left border-b border-border/50 press-effect"
            >
              <div>
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-xs text-muted-foreground">{ex.equipment}</p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      ))}
    </>
  )
}
