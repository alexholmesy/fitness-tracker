'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'
import { Input, SubmitButton } from '@/components/ui-kit'

export default function RoutinePage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [allExercises, setAllExercises] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => setAllExercises(data ?? []))

    if (!isNew) {
      supabase.from('routines').select('*, routine_exercises(*)').eq('id', params.id).single().then(({ data }) => {
        if (data) {
          setName(data.name)
          setNotes(data.notes ?? '')
          setExercises((data.routine_exercises ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order))
        }
        setLoading(false)
      })
    }
  }, [])

  const addExercise = (exName: string) => {
    setExercises(prev => [...prev, {
      exercise_name: exName,
      target_sets: 3,
      target_reps: 10,
      sort_order: prev.length,
    }])
    setShowPicker(false)
    setSearch('')
  }

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  const moveExercise = (idx: number, dir: 'up' | 'down') => {
    setExercises(prev => {
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (isNew) {
      const { data: routine } = await supabase.from('routines').insert({
        user_id: user.id, name, notes: notes || null,
      }).select().single()

      if (routine && exercises.length > 0) {
        await supabase.from('routine_exercises').insert(
          exercises.map((ex, i) => ({
            routine_id: routine.id,
            exercise_name: ex.exercise_name,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            sort_order: i,
          }))
        )
      }
    } else {
      await supabase.from('routines').update({ name, notes: notes || null }).eq('id', params.id)
      await supabase.from('routine_exercises').delete().eq('routine_id', params.id)
      if (exercises.length > 0) {
        await supabase.from('routine_exercises').insert(
          exercises.map((ex, i) => ({
            routine_id: params.id,
            exercise_name: ex.exercise_name,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            sort_order: i,
          }))
        )
      }
    }

    setSaving(false)
    router.push('/gym')
  }

  const filtered = allExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="pb-6 animate-fade-in">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => router.push('/gym')} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary press-effect">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">{isNew ? 'New Routine' : 'Edit Routine'}</h1>
      </div>

      <div className="px-4 space-y-4 mt-2">
        <Input label="Routine Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Push Day, Pull Day..." />
        <Input label="Notes (optional)" value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} placeholder="Focus on..." />

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Exercises</h2>
          {exercises.map((ex, idx) => (
            <div key={idx} className="stat-card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{ex.exercise_name}</p>
                <div className="flex gap-1">
                  <button onClick={() => moveExercise(idx, 'up')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary press-effect">
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => moveExercise(idx, 'down')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary press-effect">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => removeExercise(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 press-effect">
                    <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Sets</label>
                  <input
                    type="number"
                    value={ex.target_sets}
                    onChange={e => setExercises(prev => prev.map((e2, i) => i === idx ? { ...e2, target_sets: parseInt(e.target.value) } : e2))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Target Reps</label>
                  <input
                    type="number"
                    value={ex.target_reps}
                    onChange={e => setExercises(prev => prev.map((e2, i) => i === idx ? { ...e2, target_reps: parseInt(e.target.value) } : e2))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 press-effect hover:border-primary/50 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>

        <button onClick={handleSave} disabled={saving || !name}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm press-effect disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Routine'}
        </button>
      </div>

      {/* Exercise picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPicker(false)} />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl shadow-2xl" style={{ maxHeight: '80vh' }}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Add Exercise</h2>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." autoFocus
                className="w-full mt-3 px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {filtered.map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex.name)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary transition-colors text-left border-b border-border/50 press-effect">
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.muscle_group} · {ex.equipment}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
              {search && !filtered.find(e => e.name.toLowerCase() === search.toLowerCase()) && (
                <button onClick={() => addExercise(search)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors press-effect">
                  <Plus className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Add "{search}"</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
