'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { upsertNote } from '@/lib/actions'
import { format } from 'date-fns'

export function NotesClient() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await upsertNote(fd.get('date') as string, content)
      setOpen(false)
      setContent('')
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
        Note
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Note">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            name="date"
            type="date"
            defaultValue={format(new Date(), 'yyyy-MM-dd')}
            required
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Good gym session today. Hit a new PR on bench press..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
            />
          </div>
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
