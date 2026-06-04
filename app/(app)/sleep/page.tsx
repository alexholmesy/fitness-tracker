'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { SleepClient } from './sleep-client'

export default function SleepPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 3650
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase.from('sleep_entries').select('*').eq('user_id', user.id).gte('date', fromDate).order('date', { ascending: true })
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [range])

  const chartData = entries.map(e => ({ date: e.date, value: e.hours_slept }))
  const values = entries.map(e => e.hours_slept)
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Sleep" subtitle="Track your rest" action={<SleepClient onSave={fetchData} />} />
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
      <div className="mx-4 stat-card">
        <p className="text-xs font-medium text-muted-foreground mb-3">Hours Slept</p>
        <TrendChart data={chartData} color="hsl(243, 75%, 65%)" height={180} />
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Average</p>
          <p className="text-xl font-bold">{avg ? `${avg}h` : '--'}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Entries</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {loading ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">Loading...</p></div>
        ) : entries.length === 0 ? (
          <div className="stat-card text-center py-8"><p className="text-sm text-muted-foreground">No entries yet.</p></div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="stat-card flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.hours_slept} hours</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground text-right max-w-[50%]">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
