'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createCardio } from '@/lib/actions'
import { format } from 'date-fns'

const activities = ['Running', 'Cycling', 'Swimming', 'Walking', 'Rowing', 'HIIT', 'Football', 'Tennis', 'Other']

export function CardioClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activity, setActivity] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createCardio({
        date: fd.get('date') as string,
        activity: activity || fd.get('activity') as string,
        duration_minutes: fd.get('duration_minutes') as string,
        distance_km: fd.get('distance_km') as string,
        calories_burned: fd.get('calories_burned') as string,
        notes: fd.get('notes') as string,
      })
      setOpen(false)
      setActivity('')
      router.refresh()
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
      <Modal open={open} onClose={() => setOpen(false)} title="Log Cardio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity</label>
            <div className="flex flex-wrap gap-2">
              {activities.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setActivity(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all press-effect ${
                    activity === a
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-muted-foreground'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {(!activity || activity === 'Other') && (
              <input
                name="activity"
                placeholder="Or type activity..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Duration (min)" name="duration_minutes" type="number" placeholder="30" />
            <Input label="Distance (km)" name="distance_km" type="number" step="0.1" placeholder="5.0" />
            <Input label="Calories" name="calories_burned" type="number" placeholder="300" />
          </div>
          <Input label="Notes (optional)" name="notes" placeholder="Zone 2, intervals..." />
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
