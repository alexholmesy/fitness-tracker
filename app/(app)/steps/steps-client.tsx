'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function StepsClient({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('step_entries').upsert({
        user_id: user.id,
        date: fd.get('date') as string,
        steps: parseInt(fd.get('steps') as string),
      }, { onConflict: 'user_id,date' })
      if (error) throw error
      setOpen(false)
      onSave()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold press-effect">
        <Plus className="w-4 h-4" />Log
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Log Steps">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <Input label="Steps" name="steps" type="number" placeholder="8000" required autoFocus />
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
