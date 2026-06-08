'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { WeightClient, WeightHistoryList } from './weight-client'

export default function WeightPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const supabase = createClient()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '1y' ? 365 : 3650
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const [{ data: weightData }, { data: profileData }] = await Promise.all([
      supabase.from('weight_entries').select('*').eq('user_id', user.id).gte('date', fromDate).order('date', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    setEntries(weightData ?? [])
    setProfile(profileData)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [range])

  const chartData = entries.map(e => ({ date: e.date, value: e.weight }))
  const weights = entries.map(e => e.weight)
  const avg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null
  const min = weights.length > 0 ? Math.min(...weights) : null
  const max = weights.length > 0 ? Math.max(...weights) : null
  const latest = entries.length > 0 ? entries[entries.length - 1].weight : null
  const goalWeight = profile?.goal_weight ?? null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Weight"
        subtitle="Track your progress over time"
        action={
          <WeightClient
            entries={entries}
            onSave={fetchData}
            editingEntry={editingEntry}
            onEditClose={() => setEditingEntry(null)}
          />
        }
      />
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">Weight (kg)</p>
          {goalWeight && latest && (
            <span className="text-xs text-muted-foreground">
              Goal: <span className="text-primary font-semibold">{goalWeight}kg</span>
              {' '}({(latest - goalWeight).toFixed(1)} to go)
            </span>
          )}
        </div>
        <TrendChart data={chartData} color="hsl(142, 72%, 55%)" unit="kg" height={180} showGrid />
      </div>
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Current', value: latest ? `${latest}kg` : '--' },
          { label: 'Average', value: avg ? `${avg.toFixed(1)}kg` : '--' },
          { label: 'Goal', value: goalWeight ? `${goalWeight}kg` : '--' },
          { label: 'Lowest', value: min ? `${min}kg` : '--' },
          { label: 'Highest', value: max ? `${max}kg` : '--' },
          { label: 'Entries', value: entries.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {loading ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <WeightHistoryList
            entries={entries}
            onDelete={fetchData}
            onEdit={(entry) => setEditingEntry(entry)}
          />
        )}
      </div>
    </div>
  )
}
