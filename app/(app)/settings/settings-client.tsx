'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, SubmitButton } from '@/components/ui-kit'
import { updateSettings } from '@/lib/actions'
import type { Profile } from '@/types'

export function SettingsClient({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)
    try {
      await updateSettings({
        full_name: fd.get('full_name') as string,
        goal_weight: fd.get('goal_weight') as string,
        daily_calorie_target: fd.get('daily_calorie_target') as string,
        daily_step_target: fd.get('daily_step_target') as string,
        water_target: fd.get('water_target') as string,
        sleep_target: fd.get('sleep_target') as string,
        weight_unit: fd.get('weight_unit') as 'kg' | 'lbs',
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {saved && (
        <div className="px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>
        <Input label="Name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Your name" />
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Goals</h2>
        <Input label="Goal Weight (kg)" name="goal_weight" type="number" step="0.1" defaultValue={profile?.goal_weight?.toString() ?? ''} placeholder="85" />
        <Input label="Daily Calorie Target" name="daily_calorie_target" type="number" defaultValue={profile?.daily_calorie_target?.toString() ?? '2000'} placeholder="2000" required />
        <Input label="Daily Step Target" name="daily_step_target" type="number" defaultValue={profile?.daily_step_target?.toString() ?? '10000'} placeholder="10000" required />
        <Input label="Water Target (litres)" name="water_target" type="number" step="0.25" defaultValue={profile?.water_target?.toString() ?? '2.5'} placeholder="2.5" required />
        <Input label="Sleep Target (hours)" name="sleep_target" type="number" step="0.5" defaultValue={profile?.sleep_target?.toString() ?? '8'} placeholder="8" required />
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preferences</h2>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Weight Unit</label>
          <div className="flex gap-3">
            {(['kg', 'lbs'] as const).map(unit => (
              <label key={unit} className="flex-1">
                <input
                  type="radio"
                  name="weight_unit"
                  value={unit}
                  defaultChecked={profile?.weight_unit === unit}
                  className="sr-only peer"
                />
                <div className="flex items-center justify-center py-3 rounded-xl bg-secondary border border-border peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary text-muted-foreground font-medium text-sm cursor-pointer transition-all">
                  {unit}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      <SubmitButton loading={loading} label="Save Settings" />
    </form>
  )
}
