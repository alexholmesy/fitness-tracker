'use client'

import { useState } from 'react'
import { Scale, Flame, Footprints, Droplets } from 'lucide-react'
import { Modal, Input, SubmitButton } from '@/components/ui-kit'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { DashboardStats } from '@/types'

type QuickLogType = 'weight' | 'calories' | 'steps' | 'water' | null

const ALL_QUICK_ACTIONS = [
  { type: 'weight' as const, icon: Scale, label: 'Weight', color: 'text-primary', bg: 'bg-primary/10' },
  { type: 'calories' as const, icon: Flame, label: 'Calories', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { type: 'steps' as const, icon: Footprints, label: 'Steps', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { type: 'water' as const, icon: Droplets, label: 'Water', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
]

export function DashboardClient({ stats, onSave, quickLog }: {
  stats: DashboardStats
  onSave: () => void
  quickLog: string[]
}) {
  const [activeLog, setActiveLog] = useState<QuickLogType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const visibleActions = ALL_QUICK_ACTIONS.filter(a => quickLog.includes(a.type))

  const handleQuickLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const value = formData.get('value') as string

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (activeLog === 'weight') {
        await supabase.from('weight_entries').upsert({ user_id: user.id, date: today, weight: parseFloat(value) }, { onConflict: 'user_id,date' })
      } else if (activeLog === 'calories') {
        await supabase.from('calorie_entries').upsert({ user_id: user.id, date: today, calories: parseInt(value) }, { onConflict: 'user_id,date' })
      } else if (activeLog === 'steps') {
        await supabase.from('step_entries').upsert({ user_id: user.id, date: today, steps: parseInt(value) }, { onConflict: 'user_id,date' })
      } else if (activeLog === 'water') {
        await supabase.from('water_entries').upsert({ user_id: user.id, date: today, litres: parseFloat(value) }, { onConflict: 'user_id,date' })
      }

      setActiveLog(null)
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const configs = {
    weight: { title: 'Log Weight', label: 'Weight (kg)', type: 'number', step: '0.1', placeholder: '85.0' },
    calories: { title: 'Log Calories', label: 'Calories (kcal)', type: 'number', placeholder: '2000' },
    steps: { title: 'Log Steps', label: 'Steps', type: 'number', placeholder: '8000' },
    water: { title: 'Log Water', label: 'Litres', type: 'number', step: '0.1', placeholder: '2.5' },
  }

  const config = activeLog ? configs[activeLog] : null

  if (visibleActions.length === 0) return null

  return (
    <>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${visibleActions.length}, 1fr)` }}>
        {visibleActions.map(({ type, icon: Icon, label, color, bg }) => (
          <button
            key={type}
            onClick={() => setActiveLog(type)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border press-effect hover:border-primary/30 transition-all"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      <Modal open={activeLog !== null} onClose={() => setActiveLog(null)} title={config?.title ?? ''}>
        <form onSubmit={handleQuickLog} className="space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          {config && (
            <Input
              label={config.label}
              name="value"
              type={config.type}
              step={(config as any).step}
              placeholder={config.placeholder}
              required
              autoFocus
            />
          )}
          <SubmitButton loading={loading} />
        </form>
      </Modal>
    </>
  )
}
