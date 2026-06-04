'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { CardioClient } from './cardio-client'

export default function CardioPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 3650
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase.from('cardio_entries').select('*').eq('user_id', user.id).gte('date', fromDate).order('date', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [range])

  const totalMinutes = entries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0)
  const totalDistance = entries.reduce((s, e) => s + (e.distance_km ?? 0), 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Cardio" subtitle={`${entries.length} sessions`} action={<CardioClient onSave={fetchData} />} />
      <div className="px-4">
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {['7d', '30d', '90d', '1y', 'all'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all press-effect ${range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '1y' ? '1Y' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground mb-1">Sessions</p><p className="text-xl font-bold">{entries.length}</p></div>
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground mb-1">Minutes</p><p className="text-xl font-bold">{totalMinutes}</p></div>
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground mb-1">Km</p><p className="text-xl font-bold">{totalDistance.toFixed(1)}</p></div>
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : entries.length === 0 ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">No sessions yet.</p></div>
        ) : entries.map(entry => (
          <div key={entry.id} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{entry.activity}</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                {entry.duration_minutes && <p>{entry.duration_minutes} min</p>}
                {entry.distance_km && <p>{entry.distance_km} km</p>}
                {entry.calories_burned && <p>{entry.calories_burned} kcal</p>}
              </div>
            </div>
            {entry.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{entry.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
