'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { DeleteButton } from '@/components/delete-button'
import { upsertWeight, deleteWeight } from '@/lib/actions'
import { format } from 'date-fns'
import type { WeightEntry } from '@/types'

export function WeightClient({ entries }: { entries: WeightEntry[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      await upsertWeight({
        date: fd.get('date') as string,
        weight: fd.get('weight') as string,
        notes: fd.get('notes') as string,
      })
      setOpen(false)
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
      <Modal open={open} onClose={() => setOpen(false)} title="Log Weight">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <Input label="Date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
          <Input label="Weight (kg)" name="weight" type="number" step="0.1" placeholder="85.0" required autoFocus />
          <Input label="Notes (optional)" name="notes" type="text" placeholder="Morning, post-workout..." />
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}

export function WeightHistoryList({ entries }: { entries: WeightEntry[] }) {
  const router = useRouter()

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
              {entry.notes && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{entry.notes}</p>}
            </div>
            <DeleteButton
              onDelete={async () => {
                await deleteWeight(entry.id)
                router.refresh()
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
