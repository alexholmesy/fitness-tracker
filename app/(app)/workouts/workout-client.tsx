'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createWorkout } from '@/lib/actions'
import { format } from 'date-fns'

type Exercise = {
  exercise_name: string
  sets: string
  reps: string
  weight: string
}

const emptyExercise = (): Exercise => ({ exercise_name: '', sets: '', reps: '', weight: '' })

export function WorkoutClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])
  const router = useRouter()

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    setExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      await createWorkout({
        name: fd.get('name') as string,
        date: fd.get('date') as string,
        notes: fd.get('notes') as string,
        exercises,
      })
      setOpen(false)
      setExercises([emptyExercise()])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect"
      >
        <Plus className="w-4 h-4" />
        Log
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log Workout">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <Input label="Workout Name" name="name" placeholder="Push Day, Leg Day..." required autoFocus />
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Exercises</label>
              <button
                type="button"
                onClick={() => setExercises(prev => [...prev, emptyExercise()])}
                className="flex items-center gap-1 text-xs text-primary font-medium press-effect"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {exercises.map((ex, i) => (
              <div key={i} className="bg-secondary rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Exercise {i + 1}</span>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-destructive/60 hover:text-destructive press-effect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  value={ex.exercise_name}
                  onChange={e => updateExercise(i, 'exercise_name', e.target.value)}
                  placeholder="e.g. Bench Press"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['sets', 'reps', 'weight'] as const).map(field => (
                    <input
                      key={field}
                      value={ex[field]}
                      onChange={e => updateExercise(i, field, e.target.value)}
                      placeholder={field === 'weight' ? 'kg' : field}
                      type="number"
                      step={field === 'weight' ? '0.5' : '1'}
                      className="w-full px-2 py-2 rounded-lg bg-card border border-border text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground text-center">
                  <span>Sets</span><span>Reps</span><span>Weight</span>
                </div>
              </div>
            ))}
          </div>
          <Input label="Notes (optional)" name="notes" placeholder="Great session, felt strong..." />
          <SubmitButton loading={loading} label="Save Workout" />
        </form>
      </Modal>
    </>
  )
}
