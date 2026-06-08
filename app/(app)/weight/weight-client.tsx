'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { DeleteButton } from '@/components/delete-button'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function WeightClient({ entries, onSave, editingEntry, onEditClose }: {
  entries: any[]
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
        const { error } = await supabase.from('weight_entries').update({
          date: fd.get('date') as string,
          weight: parseFloat(fd.get('weight') as string),
          notes: (fd.get('notes') as string) || null,
        }).eq('id', editingEntry.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('weight_entries').upsert({
          user_id: user.id,
          date: fd.get('date') as string,
          weight: parseFloat(fd.get('weight') as string),
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
      <Modal open={open} onClose={handleClose} title={editingEntry ? 'Edit Weight' : 'Log Weight'}>
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
            label="Weight (kg)"
            name="weight"
            type="number"
            step="0.1"
            placeholder="85.0"
            defaultValue={editingEntry ? editingEntry.weight : ''}
            key={`weight-${editingEntry?.id ?? 'new'}`}
            required
            autoFocus
          />
          <Input
            label="Notes (optional)"
            name="notes"
            type="text"
            placeholder="Morning, post-workout..."
            defaultValue={editingEntry ? editingEntry.notes ?? '' : ''}
            key={`notes-${editingEntry?.id ?? 'new'}`}
          />
          <SubmitButton loading={loading} label={editingEntry ? 'Save Changes' : 'Save'} />
        </form>
      </Modal>
    </>
  )
}

export function WeightHistoryList({ entries, onDelete, onEdit }: {
  entries: any[]
  onDelete: () => void
  onEdit: (entry: any) => void
}) {
  const supabase = createClient()

  if (entries.length === 0) {
    return (
      <div className="stat-card text-center py-8">
        <p className="text-sm text-muted-foreground">No entries yet. Tap + to log your weight.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {[...entries].reverse().map((entry, i, arr) => {
        const prev = arr[i + 1]
        const change = prev ? entry.weight - prev.weight : null
        return (
          <div key={entry.id} className="stat-card flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{entry.weight} kg</p>
                {change !== null && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    change < 0 ? 'text-emerald-400 bg-emerald-400/10' :
                    change > 0 ? 'text-red-400 bg-red-400/10' :
                    'text-muted-foreground bg-secondary'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{entry.date}</p>
              {entry.notes && (
                <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{entry.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(entry)}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all press-effect"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <DeleteButton
                onDelete={async () => {
                  await supabase.from('weight_entries').delete().eq('id', entry.id)
                  onDelete()
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
