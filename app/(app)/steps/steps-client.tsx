'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { DeleteButton } from '@/components/delete-button'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function StepsClient({ onSave, editingEntry, onEditClose }: {
  onSave: () => void
  editingEntry: any
  onEditClose: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (editingEntry) setOpen(true)
  }, [editingEntry])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingEntry) {
        await supabase.from('step_entries').update({
          date: fd.get('date') as string,
          steps: parseInt(fd.get('steps') as string),
        }).eq('id', editingEntry.id)
      } else {
        await supabase.from('step_entries').upsert({
          user_id: user.id,
          date: fd.get('date') as string,
          steps: parseInt(fd.get('steps') as string),
        }, { onConflict: 'user_id,date' })
      }

      setOpen(false)
      onEditClose()
      onSave()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    onEditClose()
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
      <Modal open={open} onClose={handleClose} title={editingEntry ? 'Edit Steps' : 'Log Steps'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            name="date"
            type="date"
            defaultValue={editingEntry ? editingEntry.date : format(new Date(), 'yyyy-MM-dd')}
            key={editingEntry?.id ?? 'new'}
            required
          />
          <Input
            label="Steps"
            name="steps"
            type="number"
            placeholder="8000"
            defaultValue={editingEntry ? editingEntry.steps : ''}
            key={`steps-${editingEntry?.id ?? 'new'}`}
            required
            autoFocus
          />
          <SubmitButton loading={loading} label={editingEntry ? 'Save Changes' : 'Save'} />
        </form>
      </Modal>
    </>
  )
}

export function StepsHistoryList({ entries, onDelete, onEdit }: {
  entries: any[]
  onDelete: () => void
  onEdit: (entry: any) => void
}) {
  const supabase = createClient()

  if (entries.length === 0) {
    return (
      <div className="stat-card text-center py-8">
        <p className="text-sm text-muted-foreground">No entries yet. Tap + to log steps.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {[...entries].reverse().map(entry => (
        <div key={entry.id} className="stat-card flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">{entry.steps.toLocaleString()} steps</p>
            <p className="text-xs text-muted-foreground">{entry.date}</p>
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
                await supabase.from('step_entries').delete().eq('id', entry.id)
                onDelete()
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
