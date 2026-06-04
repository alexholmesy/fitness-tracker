'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { upsertSleep } from '@/lib/actions'
import { format } from 'date-fns'

export function SleepClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await upsertSleep({
        date: fd.get('date') as string,
        hours_slept: fd.get('hours_slept') as string,
        notes: fd.get('notes') as string,
      })
      setOpen(false)
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
      <Modal open={open} onClose={() => setOpen(false)} title="Log Sleep">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <Input label="Hours Slept" name="hours_slept" type="number" step="0.5" placeholder="7.5" required autoFocus />
          <Input label="Notes (optional)" name="notes" placeholder="Good sleep, woke up early..." />
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
