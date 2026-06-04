'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export function WaterClient({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const quickAmounts = [1.5, 2.0, 2.5, 3.0]

  const logQuick = async (litres: number) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('water_entries').upsert({
        user_id: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        litres,
      }, { onConflict: 'user_id,date' })
      onSave()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('water_entries').upsert({
        user_id: user.id,
        date: fd.get('date') as string,
        litres: parseFloat(fd.get('litres') as string),
      }, { onConflict: 'user_id,date' })
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
      <Modal open={open} onClose={() => setOpen(false)} title="Log Water">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(amt => (
              <button key={amt} onClick={() => logQuick(amt)} disabled={loading}
                className="py-3 rounded-xl bg-secondary text-sm font-semibold hover:bg-primary/20 hover:text-primary transition-all press-effect">
                {amt}L
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or custom</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
            <Input label="Litres" name="litres" type="number" step="0.1" placeholder="2.5" required />
            <SubmitButton loading={loading} />
          </form>
        </div>
      </Modal>
    </>
  )
}
