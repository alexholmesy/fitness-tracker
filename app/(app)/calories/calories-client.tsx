'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { DeleteButton } from '@/components/delete-button'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function CaloriesClient({ onSave, editingEntry, onEditClose }: {
  onSave: () => void
  editingEntry: any
  onEditClose: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (editingEntry) setOpen(true)
  }, [editingEntry])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingEntry) {
        const { error } = await supabase.from('calorie_entries').update({
          date: fd.get('date') as string,
          calories: parseInt(fd.get('calories') as string),
          notes: (fd.get('notes') as string) || null,
        }).eq('id', editingEntry.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('calorie_entries').upsert({
          user_id: user.id,
          date: fd.get('date') as string,
          calories: parseInt(fd.get('calories') as string),
          notes: (fd.get('notes') as string) || null,
        }, { onConflict: 'user_id,date' })
        if (error) throw error
      }

      setOpen(false)
      onEditClose()
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    onEditClose()
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => { onEditClose(); setOpen(true) }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect"
      >
        <Plus className="w-4 h-4" />
        Log
      </button>
      <Modal open={open} onClose={handleClose} title={editingEntry ? 'Edit Calories' : 'Log Calories'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <Input
            label="Date"
            name="date"
            type="date"
            defaultValue={editingEntry ? editingEntry.date : format(new Date(), 'yyyy-MM-dd')}
            key={editingEntry?.id ?? 'new'}
            required
          />
          <Input
            label="Calories (kcal)"
            name="calories"
            type="number"
            placeholder="2000"
            defaultValue={editingEntry ? editingEntry.calories : ''}
            key={`cal-${editingEntry?.id ?? 'new'}`}
            required
            autoFocus
          />
          <Input
            label="Notes (optional)"
            name="notes"
            type="text"
            placeholder="Cheat day, low carb..."
            defaultValue={editingEntry ? editingEntry.notes ?? '' : ''}
            key={`notes-${editingEntry?.id ?? 'new'}`}
          />
          <SubmitButton loading={loading} label={editingEntry ? 'Save Changes' : 'Save'} />
        </form>
      </Modal>
    </>
  )
}

export function CaloriesHistoryList({ entries, onDelete, onEdit, calorieTarget }: {
  entries: any[]
  onDelete: () => void
  onEdit: (entry: any) => void
  calorieTarget: number
}) {
  const supabase = createClient()

  if (entries.length === 0) {
    return (
      <div className="stat-card text-center py-8">
        <p className="text-sm text-muted-foreground">No entries yet. Tap + to log calories.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {[...entries].reverse().map(entry => (
        <div key={entry.id} className="stat-card flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{entry.calories.toLocaleString()} kcal</p>
            <p className="text-xs text-muted-foreground">{entry.date}</p>
            {entry.notes && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{entry.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            {calorieTarget && (
              <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
                entry.calories <= calorieTarget ? 'bg-primary/10 text-primary' : 'bg-red-400/10 text-red-400'
              }`}>
                {entry.calories <= calorieTarget ? 'On target' : 'Over'}
              </div>
            )}
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all press-effect"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <DeleteButton
              onDelete={async () => {
                await supabase.from('calorie_entries').delete().eq('id', entry.id)
                onDelete()
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
