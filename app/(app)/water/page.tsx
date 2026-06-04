import { getWaterEntries, getProfile } from '@/lib/data'
import { PageHeader } from '@/components/ui-kit'
import { TrendChart } from '@/components/charts'
import { DateRangeSelector } from '@/components/date-range-selector'
import { WaterClient } from './water-client'
import type { DateRange } from '@/types'

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function WaterPage({ searchParams }: PageProps) {
  const { range = '30d' } = await searchParams
  const dateRange = (range as DateRange) || '30d'
  const [entries, profile] = await Promise.all([getWaterEntries(dateRange), getProfile()])
  const chartData = entries.map(e => ({ date: e.date, value: e.litres }))
  const values = entries.map(e => e.litres)
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Water" subtitle={`Target: ${profile?.water_target ?? 2.5}L per day`} action={<WaterClient />} />
      <div className="px-4">
        <DateRangeSelector value={dateRange} />
      </div>
      <div className="mx-4 stat-card">
        <p className="text-xs font-medium text-muted-foreground mb-3">Litres per Day</p>
        <TrendChart data={chartData} color="hsl(187, 72%, 55%)" height={180} />
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Average</p>
          <p className="text-xl font-bold">{avg ? `${avg}L` : '--'}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Target</p>
          <p className="text-xl font-bold">{profile?.water_target ?? 2.5}L</p>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h2>
        {entries.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-sm text-muted-foreground">No entries yet. Tap + to log water.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="stat-card flex items-center justify-between">
                <p className="text-sm font-semibold">{entry.litres}L</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
