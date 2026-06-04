'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function CaloriesClient({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('calorie_entries').upsert({
        user_id: user.id,
        date: fd.get('date') as string,
        calories: parseInt(fd.get('calories') as string),
        notes: (fd.get('notes') as string) || null,
      }, { onConflict: 'user_id,date' })
      if (error) throw error
      setOpen(false)
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect">
        <Plus className="w-4 h-4" />Log
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log Calories">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <Input label="Calories (kcal)" name="calories" type="number" placeholder="2000" required autoFocus />
          <Input label="Notes (optional)" name="notes" type="text" placeholder="Cheat day, low carb..." />
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
